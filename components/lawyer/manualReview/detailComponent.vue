<template>
  <div ref="documentComparePageContainer" class="lawyer-manual-review-detail-wrapper">
    <lawyer-document-compare
      :document="documentData"
      :submitting="submitting"
      @go-back="goBack"
      @submit-review="handleReviewSubmit"
      @update-document="handleUpdateDocument"
    />
  </div>
</template>

<script lang="ts">
  import { Component, Vue } from 'nuxt-property-decorator';
  import { DocumentComparePageData, ChangeItem, ReviewSubmitData } from '@/model/LawyerModel';
  import { LawyerStoreModule } from '~/store/lawyer';
  @Component({ name: 'lawyer-manual-review-detail-component' })
  export default class LawyerManualReviewDetailComponent extends Vue {
    // 对比数据
    documentData: DocumentComparePageData = {
      id: '',
      title: '',
      status: 'pending',
      tags: [],
      originalVersion: '',
      newVersion: '',
      originalContent: '',
      newContent: '',
      changes: []
    };

    loading: boolean = false;
    // 审核提交中的状态
    submitting: boolean = false;
    // 组件销毁标志
    private isDestroyed: boolean = false;
    // 返回上一页
    goBack(): void {
      const sourcePath = this.$route.query.source as string;

      if (sourcePath) {
        this.$router.push(sourcePath);
      } else {
        this.$router.back();
      }
    }

    // 处理文档更新
    handleUpdateDocument(updateData: { tags: string[]; effectDate: string | null }): void {
      // 更新本地文档数据
      this.documentData.tags = updateData.tags;
      this.documentData.effectDate = updateData.effectDate;
    }

    // 处理审核提交
    async handleReviewSubmit(
      reviewData: ReviewSubmitData & {
        categoryMain?: string;
        categoryId?: string;
        effectDateStr?: string | null;
      }
    ): Promise<void> {
      // 防止重复提交
      if (this.submitting) {
        return;
      }

      const { action, categoryMain, categoryId, effectDateStr } = reviewData;

      try {
        // 设置提交中状态
        this.submitting = true;

        // 调用API
        await this.$roadLawyerService.approveToDoRule({
          id: this.documentData.id,
          approvalComment: action === 'approve' ? '已通过' : '已驳回',
          effectDateStr: effectDateStr || this.documentData.effectDate, // 优先使用弹窗设置的施行日期，允许为空
          categoryMain, // 允许为空，根据新逻辑是最终选择的分类名称
          categoryId // 专题分类ID，根据新逻辑是最终选择的分类ID
        });

        // 检查组件是否已销毁
        if (this.isDestroyed) return;

        this.documentData.status = action === 'approve' ? 'approved' : 'rejected';

        this.$message.success(`${action === 'approve' ? '通过' : '驳回'}操作成功！`);

        // 标记列表页需要刷新
        LawyerStoreModule.markPageRefresh('manualReviewList');
        console.log('markPageRefresh', LawyerStoreModule.refreshFlags);
        // 审核后返回列表页
        this.goBack();
      } catch (error) {
        // 检查组件是否已销毁
        if (this.isDestroyed) return;

        console.error('审核操作失败:', error);
        this.$message.error('审核操作失败，请重试');
      } finally {
        // 无论成功或失败，都要重置提交状态
        if (!this.isDestroyed) {
          this.submitting = false;
        }
      }
    }

    // 字符串清理工具函数
    private normalizeString(str: string): string {
      if (!str) return '';
      return str.replace(/[\r\n\t\s]+/g, ' ').trim();
    }

    // 格式化文档变更数据（拆分解析逻辑，提高可维护性）
    formatChanges(checkResult: string): ChangeItem[] {
      if (!checkResult || typeof checkResult !== 'string') return [];
      try {
        // 1) 去掉方括号
        let content: string = checkResult.trim();
        if (content.startsWith('[') && content.endsWith(']')) {
          content = content.slice(1, -1);
        }
        // 检查特殊情况：无旧版文件或无新版文件
        const trimmedContent = content.trim();
        if (trimmedContent === '无旧版文件' || trimmedContent === '无新版文件') {
          // 返回特殊标记，用于在UI中显示相应信息
          return [
            {
              type: 'info',
              position: trimmedContent,
              sectionDisplay: '',
              oldText: '',
              newText: ''
            }
          ];
        }
        if (!content.trim()) return [];
        // 2) 智能分割（处理引号内逗号）
        const items: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < content.length; i++) {
          const ch = content[i];
          if (ch === "'" && !inQuotes) inQuotes = true;
          else if (ch === "'" && inQuotes) inQuotes = false;
          else if (ch === ',' && !inQuotes) {
            if (current.trim()) items.push(current.trim());
            current = '';
            continue;
          }
          current += ch;
        }
        if (current.trim()) items.push(current.trim());
        // 3) 解析每一项 - 调用提取的解析方法
        const changes: ChangeItem[] = [];
        for (const raw of items) {
          const change = this.parseChangeItem(raw.trim());
          if (change) {
            changes.push(change);
          }
        }
        // 4) 统一清理空白
        return changes.map(c => {
          if (c.position) c.position = this.normalizeString(c.position);
          if (c.sectionDisplay) c.sectionDisplay = this.normalizeString(c.sectionDisplay);
          return c;
        });
      } catch (error) {
        console.error('解析变更数据失败:', error);
        return [];
      }
    }

    // 解析单个变更项（提取复杂的正则匹配逻辑）
    private parseChangeItem(item: string): ChangeItem | null {
      if (!item) return null;
      // 标题变更
      let changeMatch = item.match(/^(.+?)\s+标题变更：由'(.+?)'变更为'(.+?)'$/);
      if (changeMatch) {
        const sectionText = changeMatch[1].trim();
        return {
          type: 'modify',
          position: '标题变更',
          sectionDisplay: sectionText,
          oldText: changeMatch[2].trim(),
          newText: changeMatch[3].trim()
        };
      }

      // 删除条款
      if (item.includes('删除条款：')) {
        const contentText = item.substring(item.indexOf('删除条款：') + 6).trim();
        const displayMatch = contentText.match(/^(第.+?[章条])/);
        return {
          type: 'delete',
          position: '删除内容',
          sectionDisplay: displayMatch ? displayMatch[1] : '',
          oldText: contentText
        };
      }

      // 内容变更：由'..'变更为'..'
      changeMatch = item.match(/^(.+?)：由'(.+?)'变更为'(.+?)'$/);
      if (changeMatch) {
        const sectionText = changeMatch[1].trim();
        return {
          type: 'modify',
          position: '内容变更',
          sectionDisplay: sectionText,
          oldText: changeMatch[2].trim(),
          newText: changeMatch[3].trim()
        };
      }

      // 新增条款
      changeMatch = item.match(/^(.+?)\s*新增条款：(.+)$/);
      if (changeMatch) {
        const sectionText = changeMatch[1].trim();
        return {
          type: 'add',
          position: '新增内容',
          sectionDisplay: sectionText,
          newText: changeMatch[2].trim()
        };
      }

      // 未匹配的项
      console.warn('无法解析的变更项:', item);
      return null;
    }

    // 获取文档对比数据
    async fetchDocumentData(): Promise<void> {
      const docId = this.$route.query.id;
      const pageTitle = this.$route.query.pageTitle;
      const checkStatus = this.$route.query.checkStatus; // 从路由参数获取审核状态
      if (!docId) return;
      this.loading = true;
      this.documentData = {
        id: docId as string,
        title: (pageTitle as string) || '正在加载文档...',
        status: 'pending',
        checkStatus: (checkStatus as string) || '待审核', // 使用路由参数中的审核状态
        tags: [],
        originalVersion: '',
        newVersion: '',
        originalContent: '暂无数据',
        newContent: '暂无数据',
        changes: [],
        oldFileVersion: null,
        oldPublishTime: null,
        newFileVersion: null,
        newPublishTime: null,
        effectDate: null,
        currentMaxFileVersion: 0
      };

      try {
        // 调用接口获取文档详情
        const result = await this.$roadLawyerService.getToDoRuleDetail({
          id: docId as string
        });
        if (result && (result.oldFileContent || result.newFileContent)) {
          // 构建标签数组，包含一级和二级分类
          const tags: string[] = [];
          if (result.categoryMain) tags.push(result.categoryMain);
          if (result.categorySub) tags.push(result.categorySub);

          // 处理文档数据 - 使用从URL参数获取的标题
          this.documentData = {
            id: docId as string,
            title:
              (pageTitle as string) ||
              `${result.categoryMain || ''}${result.categorySub ? '/' + result.categorySub : ''}`,
            status:
              result.checkStatus === '1'
                ? 'approved'
                : result.checkStatus === '2'
                ? 'rejected'
                : 'pending',
            checkStatus: (checkStatus as string) || '待审核', // 使用路由参数中的审核状态
            tags, // 使用包含一级和二级分类的标签数组
            originalVersion: '原始版本',
            newVersion: result.newFileVersion || '修订版本',
            originalContent: result.oldFileContent || '',
            newContent: result.newFileContent || '',
            changes: this.formatChanges(result.checkResult),
            modifiedDate: result.newPublishTime || result.effectDate,
            effectDate: result.effectDate,
            oldFileVersion: result.oldFileVersion,
            oldPublishTime: result.oldPublishTime,
            newFileVersion: result.newFileVersion,
            newPublishTime: result.newPublishTime,
            currentMaxFileVersion: result.currentMaxFileVersion || 0
          };
        } else {
          // 检查组件是否已销毁
          if (this.isDestroyed) return;
          // 数据为空
          this.documentData = {
            id: docId as string,
            title: (pageTitle as string) || '未找到文档数据',
            status: 'pending',
            checkStatus: (checkStatus as string) || '待审核',
            tags: [],
            originalVersion: '',
            newVersion: '',
            originalContent: 'error',
            newContent: 'error',
            changes: []
          };
          this.$message.error('文件缺失或暂无对比结果，请联系管理员');
        }
      } catch (error) {
        // 检查组件是否已销毁
        if (this.isDestroyed) return;
        console.error('获取文档对比数据失败:', error);
        this.$message.error('获取文档对比数据失败，请重试');

        // 显示错误状态
        this.documentData = {
          id: docId as string,
          title: (pageTitle as string) || '加载失败',
          status: 'pending',
          checkStatus: (checkStatus as string) || '待审核',
          tags: [],
          originalVersion: '',
          newVersion: '',
          originalContent: 'error',
          newContent: 'error',
          changes: [],
          oldFileVersion: null,
          oldPublishTime: null,
          newFileVersion: null,
          newPublishTime: null,
          effectDate: null,
          currentMaxFileVersion: 0
        };
      } finally {
        // 检查组件是否已销毁
        if (!this.isDestroyed) {
          this.loading = false;
        }
      }
    }

    // 生命周期钩子
    created(): void {
      // 在created钩子中获取数据
      this.fetchDocumentData();
    }

    // 组件销毁前清理
    beforeDestroy(): void {
      this.isDestroyed = true;
    }
  }
</script>

<style lang="less">
  .lawyer-manual-review-detail-wrapper {
    width: 100%;
    overflow: hidden;
  }
</style>
