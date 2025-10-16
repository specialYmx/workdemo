<template>
  <div class="lawyer-knowledge-detail-wrapper">
    <lawyer-document-viewer
      :document="document"
      @go-back="goBack"
      @update-document-status="handleUpdateDocumentStatus"
    />
  </div>
</template>

<script lang="ts">
  import { Component, Vue } from 'nuxt-property-decorator';
  import { KnowledgeDataItem, DocumentViewerData } from '~/model/LawyerModel';
  import { LawyerStoreModule } from '~/store/lawyer';

  @Component({ name: 'lawyer-knowledge-detail-component' })
  export default class LawyerKnowledgeDetailComponent extends Vue {
    // 文档数据
    document: DocumentViewerData = {
      id: '',
      title: '正在加载...',
      date: '',
      effectiveDate: '',
      publisher: '',
      fileNumber: '',
      status: '',
      views: 0,
      content: '正在加载文档内容...',
      isRevoke: false,
      timeLiness: ''
    };

    loading: boolean = false;

    // 废止状态控制（从文档详情弹窗的已废止控件获取）
    isRevoke: boolean = false;

    // 返回上一页
    goBack(): void {
      // 优先根据来源页面参数返回到正确的列表页面
      const sourcePath = this.$route.query.source as string;

      if (sourcePath) {
        this.$router.push(sourcePath);
      } else {
        this.$router.back();
      }
    }

    // 处理文档状态更新
    handleUpdateDocumentStatus(statusData: {
      timeLiness: string;
      categoryMain?: string;
      categoryId?: string;
      effectivenessLevel?: string;
      effectDate?: string;
      legalSource?: string;
      department?: string | string[];
      documentNo?: string;
      appendix?: boolean;
      publishDateStr?: string;
    }): void {
      // 更新时效性相关字段
      this.document.timeLiness = statusData.timeLiness;
      this.document.status = statusData.timeLiness;
      this.document.isRevoke = statusData.timeLiness === '已废止';

      // 更新分类相关字段（根据新的后端逻辑，categoryMain是最终选择的分类名称）
      if (statusData.categoryMain !== undefined) {
        this.document.categoryMain = statusData.categoryMain;
      }
      if (statusData.categoryId !== undefined) {
        this.document.categoryId = statusData.categoryId;
      }

      // 更新效力位阶
      if (statusData.effectivenessLevel !== undefined) {
        this.document.effectivenessLevel = statusData.effectivenessLevel;
      }

      // 更新生效时间（注意字段名映射：effectDate -> effectiveDate）
      if (statusData.effectDate !== undefined) {
        this.document.effectiveDate = statusData.effectDate;
      }

      // 更新其他字段
      if (statusData.legalSource !== undefined) {
        this.document.legalSource = statusData.legalSource;
        this.document.publisher = statusData.legalSource; // 同时更新publisher字段
      }
      if (statusData.department !== undefined) {
        this.document.department = statusData.department;
      }
      if (statusData.documentNo !== undefined) {
        this.document.documentNo = statusData.documentNo;
        this.document.fileNumber = statusData.documentNo; // 同时更新fileNumber字段
      }
      if (statusData.appendix !== undefined) {
        this.document.appendix = statusData.appendix;
      }
      if (statusData.publishDateStr !== undefined) {
        this.document.publishDateStr = statusData.publishDateStr;
        this.document.date = statusData.publishDateStr; // 同时更新date字段
      }

      // 根据来源页面标记对应的列表页需要刷新
      const sourcePath = this.$route.query.source as string;
      if (sourcePath) {
        // 使用来源路径作为刷新标记的key，确保只刷新对应的页面
        LawyerStoreModule.markPageRefresh(sourcePath);
      }
    }

    // 获取文档详情数据
    async fetchDocument(docId: string): Promise<void> {
      if (!docId) {
        return;
      }

      this.loading = true;
      try {
        const result: KnowledgeDataItem | null = await this.$roadLawyerService.getRuleSourceDetail({
          searchId: docId,
          isRevoke: this.isRevoke
        });

        if (result) {
          // 转换KnowledgeDataItem数据为DocumentViewer需要的格式
          const formattedContent: string = result.fileContent || '暂无内容';
          this.document = {
            id: result.id,
            title: result.ruleName,
            date: result.publishDateStr || result.createdTimeStr,
            effectiveDate: result.effectDateStr,
            publisher: result.legalSource,
            fileNumber: result.documentNo || result.documentNo || undefined,
            status: result.timeLiness || '未知',
            views: result.readCount,
            content: formattedContent,
            isRevoke: result.timeLiness === '已废止',
            timeLiness: result.timeLiness || '未知',
            // 保留所有需要的字段
            effectivenessLevel: result.effectivenessLevel,
            tags: result.topicCategory ? [result.topicCategory] : [],
            ...result // 保留原始数据的所有字段
          };
        } else {
          // 如果没有获取到数据，显示错误信息
          this.$message.error('未找到文档数据');
          this.$router.push('/lawyerKnowledge');
        }
      } catch (error) {
        console.error('获取文档详情失败:', error);
        this.$message.error('获取文档详情失败，请重试');
        this.$router.push('/lawyerKnowledge');
      } finally {
        this.loading = false;
      }
    }

    // 生命周期钩子
    async mounted(): Promise<void> {
      const docId = this.$route.query.id;
      const pageTitle = this.$route.query.pageTitle;
      console.log('文档ID:', docId);
      console.log('页面标题:', pageTitle);

      // 如果有 pageTitle 参数，先设置标题
      if (pageTitle && typeof pageTitle === 'string') {
        this.document.title = pageTitle;
      }

      // 从路由查询参数中获取isRevoke状态
      const isRevokeParam = this.$route.query.isRevoke;
      if (isRevokeParam !== undefined && isRevokeParam !== null) {
        this.isRevoke = String(isRevokeParam) === 'true';
      }
      console.log('废止状态:', this.isRevoke);

      if (docId && typeof docId === 'string') {
        await this.fetchDocument(docId);
      } else {
        this.$message.error('缺少文档ID参数');
        this.$router.push('/lawyerKnowledge');
      }
    }
  }
</script>

<style lang="less">
  @import '~/assets/styles/lawyer.less';

  .lawyer-knowledge-detail-wrapper {
    width: 100%;
    height: 100vh;
    overflow: hidden;
  }
</style>
