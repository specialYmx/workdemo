<template>
  <div class="lawyer-manual-review-detail-wrapper">
    <lawyer-document-compare :document="documentData" @go-back="goBack" />
  </div>
</template>

<script lang="ts">
  import { Component, Vue } from 'nuxt-property-decorator';
  import { DocumentComparePageData, ChangeItem } from '@/model/LawyerModel';

  @Component({ name: 'lawyer-update-detail-component' })
  export default class LawyerUpdateDetailComponent extends Vue {
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

    // 创建基础文档数据结构
    private createBaseDocumentData(
      docId: string,
      pageTitle: string,
      checkStatus: string,
      content: string = '正在加载数据...'
    ): DocumentComparePageData {
      return {
        id: docId,
        title: pageTitle || '正在加载文档...',
        status: 'pending',
        checkStatus: checkStatus || '待审核',
        tags: [],
        originalVersion: '',
        newVersion: '',
        originalContent: content,
        newContent: content,
        changes: [],
        oldFileVersion: null,
        oldPublishTime: null,
        newFileVersion: null,
        newPublishTime: null,
        effectDate: null,
        currentMaxFileVersion: 0
      };
    }

    // 获取文档对比数据
    async fetchDocumentData(): Promise<void> {
      const docId = this.$route.query.id;
      const pageTitle = this.$route.query.pageTitle as string;
      const checkStatus = this.$route.query.checkStatus as string;
      const dataSource = this.$route.query.dataSource as string;

      if (!docId) return;

      this.loading = true;
      // 设置初始加载状态
      this.documentData = this.createBaseDocumentData(docId as string, pageTitle, checkStatus);

      try {
        // 根据 dataSource 调用不同的接口
        const result: any = await (dataSource === '2'
          ? this.$roadLawyerService.getToDoRuleDetail({ id: docId as string })
          : this.$roadLawyerService.getRuleSourceDetail({ searchId: docId as string }));

        // 处理数据
        if (result && (result.oldFileContent || result.newFileContent)) {
          // 构建标签数组
          const tags: string[] = [result.categoryMain, result.categorySub].filter(Boolean);

          // 更新文档数据
          this.documentData = {
            ...this.createBaseDocumentData(docId as string, pageTitle, checkStatus),
            title:
              pageTitle ||
              `${result.categoryMain || ''}${result.categorySub ? '/' + result.categorySub : ''}`,
            status:
              result.checkStatus === '1'
                ? 'approved'
                : result.checkStatus === '2'
                ? 'rejected'
                : 'pending',
            tags,
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
          // 数据为空
          if (this.isDestroyed) return;
          this.documentData = this.createBaseDocumentData(
            docId as string,
            pageTitle || '未找到文档数据',
            checkStatus,
            '暂无数据'
          );
          this.$message.error('文件缺失或暂无对比结果，请联系管理员');
        }
      } catch (error) {
        // 错误处理
        if (this.isDestroyed) return;
        console.error('获取文档对比数据失败:', error);
        this.$message.error('获取文档对比数据失败，请重试');
        this.documentData = this.createBaseDocumentData(
          docId as string,
          pageTitle || '加载失败',
          checkStatus,
          '加载失败，请重试'
        );
      } finally {
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
