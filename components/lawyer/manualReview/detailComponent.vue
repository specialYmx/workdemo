<template>
  <div ref="documentComparePageContainer" class="lawyer-manual-review-detail-wrapper">
    <a-spin
      v-if="loading && !isPptReview"
      class="lawyer-manual-review-detail-loading"
      tip="加载中..."
    />
    <lawyer-document-ppt-review-detail
      v-else-if="isPptReview"
      :document="documentData"
      :submitting="submitting"
      @go-back="goBack"
      @submit-review="handleReviewSubmit"
      @update-document="handlePptUpdateDocument"
      @ppt-changed="handlePptChanged"
    />
    <lawyer-document-compare
      v-else
      :document="documentData"
      :submitting="submitting"
      :rule-detail-list="ruleDetailList"
      :rule-loading="ruleLoading"
      :comparison-loading="comparisonLoading"
      @go-back="goBack"
      @submit-review="handleReviewSubmit"
      @update-document="handleUpdateDocument"
      @rule-selected="handleRuleSelected"
      @rule-clear="handleRuleClear"
    />
  </div>
</template>

<script lang="ts">
  import { Component, Vue } from 'nuxt-property-decorator';
  import {
    DocumentComparePageData,
    ChangeItem,
    ReviewSubmitData,
    RuleDetailItem,
    ApprovalParams
  } from '@/model/LawyerModel';
  import { LawyerStoreModule } from '~/store/lawyer';
  @Component({ name: 'lawyer-manual-review-detail-component' })
  class LawyerManualReviewDetailComponent extends Vue {
    // 对比数据
    documentData: DocumentComparePageData = {
      id: '',
      title: '',
      status: 'pending',
      tags: [],
      originalContent: '',
      newContent: '',
      changes: [],
      effectDate: null
    };

    loading: boolean = true;
    // 审核提交中的状态
    submitting: boolean = false;
    // 组件销毁标志
    private isDestroyed: boolean = false;
    // 规则列表相关
    ruleDetailList: RuleDetailItem[] = [];
    ruleLoading: boolean = false;
    comparisonLoading: boolean = false;

    get isPptReview(): boolean {
      return !!this.documentData.assId;
    }

    // 加载规则详情列表
    async loadRuleDetailList(): Promise<void> {
      try {
        this.ruleLoading = true;
        this.ruleDetailList = await this.$roadLawyerService.getRuleDetailList();
      } catch (error) {
        if (this.isDestroyed) return;
        console.error('加载规则列表失败:', error);
        this.$message.error('加载制度文档列表失败');
        this.ruleDetailList = [];
      } finally {
        if (!this.isDestroyed) {
          this.ruleLoading = false;
        }
      }
    }

    // 处理规则选择
    async handleRuleSelected(selectedRuleId: string): Promise<void> {
      if (!selectedRuleId || this.comparisonLoading) {
        return;
      }

      const currentDocId = this.documentData.id;
      if (!currentDocId) {
        this.$message.error('当前文档ID缺失');
        return;
      }

      // 查找选中的规则详情
      const selectedRule = this.ruleDetailList.find(rule => rule.id === selectedRuleId);
      if (!selectedRule) {
        this.$message.error('未找到选中的制度文档');
        return;
      }

      try {
        this.comparisonLoading = true;
        this.$message.info('正在进行AI对比，请稍候...');

        // 调用生成对比接口
        const checkResult = await this.$roadLawyerService.generateComparison({
          oldId: selectedRuleId,
          newId: currentDocId
        });

        if (this.isDestroyed) return;

        // 接口成功后再更新原文内容与对比结果，避免接口失败导致数据不一致
        this.documentData.originalContent = selectedRule.fileContent;
        this.documentData.changes = this.formatChanges(checkResult);

        this.$message.success(`与"${selectedRule.ruleName}"的对比完成！`);
      } catch (error) {
        if (this.isDestroyed) return;
        console.error('生成对比失败:', error);
        this.$message.error('生成对比失败，请重试');
      } finally {
        if (!this.isDestroyed) {
          this.comparisonLoading = false;
        }
      }
    }

    // 处理规则清空
    async handleRuleClear(): Promise<void> {
      const currentDocId = this.documentData.id;
      if (!currentDocId) {
        this.$message.error('当前文档ID缺失');
        return;
      }

      try {
        this.comparisonLoading = true;
        this.$message.info('正在清除对比结果，请稍候...');

        // 调用清除对比接口
        const success = await this.$roadLawyerService.deleteComparison({
          id: currentDocId
        });

        if (this.isDestroyed) return;

        if (success) {
          // 清除成功后，重新加载文档数据恢复到原始对比状态
          await this.fetchDocumentData();
          this.$message.success('对比结果已清除');
        } else {
          this.$message.error('清除对比结果失败');
        }
      } catch (error) {
        if (this.isDestroyed) return;
        console.error('清除对比失败:', error);
        this.$message.error('清除对比失败，请重试');
      } finally {
        if (!this.isDestroyed) {
          this.comparisonLoading = false;
        }
      }
    }

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

    handlePptUpdateDocument(updateData: { effectDate: string | null }): void {
      this.documentData.effectDate = updateData.effectDate;
    }

    handlePptChanged(): void {
      LawyerStoreModule.markPageRefresh('manualReviewList');
      console.log('🚀 ~  ~ handlePptChanged ~ LawyerStoreModule:', LawyerStoreModule);
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

        const approvalParams: ApprovalParams = {
          id: this.documentData.id,
          approvalComment: action === 'approve' ? '已通过' : '已驳回'
        };

        approvalParams.effectDateStr = effectDateStr || this.documentData.effectDate; // 优先使用弹窗设置的施行日期，允许为空
        approvalParams.categoryMain = categoryMain || this.documentData.categoryMain; // 允许为空，根据新逻辑是最终选择的分类名称
        approvalParams.categoryId = categoryId || this.documentData.categoryId; // 专题分类ID，根据新逻辑是最终选择的分类ID

        // 调用API
        await this.$roadLawyerService.approveToDoRule(approvalParams);

        // 检查组件是否已销毁
        if (this.isDestroyed) return;

        this.documentData.status = action === 'approve' ? 'approved' : 'rejected';

        this.$message.success(
          this.isPptReview
            ? '审批操作成功。数据已更新'
            : `${action === 'approve' ? '通过' : '驳回'}操作成功！`
        );

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
        const contentText = item.substring(item.indexOf('删除条款：') + 5).trim();
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

      // 未匹配的项 - 直接显示原始内容
      console.warn('无法解析的变更项:', item);
      return {
        type: 'info',
        position: '',
        sectionDisplay: '原始数据',
        oldText: '',
        newText: item
      };
    }

    // 获取文档对比数据
    async fetchDocumentData(): Promise<void> {
      const docId = this.$route.query.id;
      const pageTitle = this.$route.query.pageTitle;
      const checkStatus = this.$route.query.checkStatus; // 从路由参数获取审核状态
      const queryFilePathOther = this.$route.query.filePathOther;
      const queryAssId = this.$route.query.assId;
      const queryCategoryMain = this.$route.query.categoryMain;
      const queryCategoryId = this.$route.query.categoryId;
      if (!docId) {
        this.loading = false;
        return;
      }
      this.loading = true;
      this.documentData = {
        id: docId as string,
        title: (pageTitle as string) || '正在加载文档...',
        status: 'pending',
        checkStatus: (checkStatus as string) || '待审核', // 使用路由参数中的审核状态
        tags: [],
        originalContent: '暂无数据',
        newContent: '暂无数据',
        changes: [],
        oldPublishTime: null,
        newPublishTime: null,
        effectDate: null,
        currentMaxFileVersion: 0,
        assId: typeof queryAssId === 'string' ? queryAssId : undefined,
        categoryMain: typeof queryCategoryMain === 'string' ? queryCategoryMain : undefined,
        categoryId: typeof queryCategoryId === 'string' ? queryCategoryId : undefined,
        filePathOther: typeof queryFilePathOther === 'string' ? queryFilePathOther : undefined
      };

      try {
        // 调用接口获取文档详情
        const result = await this.$roadLawyerService.getToDoRuleDetail({
          id: docId as string
        });
        const resultFilePathOther =
          typeof queryFilePathOther === 'string' ? queryFilePathOther : '';

        if (result?.assId) {
          this.documentData = {
            id: docId as string,
            title: (pageTitle as string) || result?.categoryMain || '新规解读PPT',
            status: 'pending',
            checkStatus: (checkStatus as string) || result?.checkStatus || '待审核',
            tags: result?.categoryId ? [result.categoryId] : [],
            originalContent: '',
            newContent: '',
            changes: [],
            effectDate: result?.effectDate,
            currentMaxFileVersion: result?.currentMaxFileVersion || 0,
            assId: result.assId,
            categoryMain: result.categoryMain,
            categoryId: result.categoryId,
            filePathOther: resultFilePathOther
          };
          return;
        }

        if (result && (result.oldFileContent || result.newFileContent)) {
          // 仅使用分类ID（不再兼容中文名称）
          const tags: string[] = result.categoryId ? [result.categoryId] : [];

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
            originalContent: result.oldFileContent || '',
            newContent: result.newFileContent || '',
            changes: this.formatChanges(result.checkResult),
            modifiedDate: result.newPublishTime || result.effectDate,
            effectDate: result.effectDate,
            categoryMain: result.categoryMain,
            categoryId: result.categoryId,
            oldFileVersion: result.oldFileVersion,
            oldPublishTime: result.oldPublishTime,
            newFileVersion: result.newFileVersion,
            newPublishTime: result.newPublishTime,
            currentMaxFileVersion: result.currentMaxFileVersion || 0,
            completed: result.completed
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
          originalContent: 'error',
          newContent: 'error',
          changes: [],
          oldPublishTime: null,
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

    async initPage(): Promise<void> {
      await this.fetchDocumentData();
      if (!this.isPptReview) {
        // 加载规则列表
        await this.loadRuleDetailList();
      }
    }

    // 生命周期钩子
    created(): void {
      // 在created钩子中获取数据
      this.initPage();
    }

    // 组件销毁前清理
    beforeDestroy(): void {
      this.isDestroyed = true;
    }
  }
  export default LawyerManualReviewDetailComponent;
</script>

<style lang="less">
  .lawyer-manual-review-detail-wrapper {
    width: 100%;
    overflow: hidden;
  }

  .lawyer-manual-review-detail-loading {
    width: 100%;
    padding: 80px 0;
  }
</style>
