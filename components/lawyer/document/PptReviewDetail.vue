<template>
  <div class="ppt-review-wrapper">
    <header class="ppt-review-header">
      <div class="ppt-review-title">
        <h3>{{ document.title }}</h3>
        <a-tag
          color="orange"
          :class="['ppt-review-editable-tag', { 'ppt-review-editable-tag--disabled': readOnly }]"
          @click="showEffectDateModal"
        >
          新规解读
          <a-icon v-if="!readOnly" type="edit" class="ppt-review-tag-edit-icon" />
        </a-tag>
      </div>
      <a-button class="ppt-review-back" @click="goBack">
        <a-icon type="arrow-left" />
        返回
      </a-button>
    </header>

    <div class="ppt-review-toolbar">
      <a-button @click="downloadCurrentPpt"> 下载PPT </a-button>
      <a-button type="primary" @click="showUploadModal"> 上传更新 </a-button>
      <a-button class="ppt-review-history-btn" @click="showUploadRecords"> 查看上传记录 </a-button>
      <a-button @click="viewSourceDocument"> 查看关联原文 </a-button>
    </div>

    <div class="ppt-review-preview">
      <a-spin :spinning="previewLoading">
        <iframe
          v-if="previewUrl"
          :src="previewUrl"
          class="ppt-review-iframe"
          frameborder="0"
          sandbox="allow-same-origin allow-scripts"
        ></iframe>
        <a-empty v-else description="暂无预览" />
      </a-spin>
    </div>

    <div v-if="canApprove" class="ppt-review-actions">
      <a-button type="primary" :loading="submitting" @click="handleApprove"> 通过 </a-button>
    </div>

    <lawyer-common-upload-modal
      :visible="uploadVisible"
      title="上传更新PPT"
      confirm-text="上传PPT"
      :width="700"
      :config="uploadConfig"
      :upload-request="uploadPpt"
      @cancel="uploadVisible = false"
      @complete="handleUploadComplete"
    />

    <a-modal
      title="上传记录"
      :visible="uploadRecordVisible"
      :footer="null"
      width="75%"
      @cancel="uploadRecordVisible = false"
    >
      <a-table
        :columns="uploadRecordColumns"
        :data-source="uploadRecords"
        :loading="uploadRecordLoading"
        :pagination="false"
        row-key="id"
        size="small"
      >
        <template slot="action" slot-scope="text, record">
          <a @click="downloadUploadRecord(record)">下载</a>
          <a-divider type="vertical" />
          <a class="ppt-review-delete" @click="deleteUploadRecord(record)">删除</a>
        </template>
      </a-table>
    </a-modal>

    <a-modal
      title="编辑施行日期"
      :visible="effectDateVisible"
      :width="500"
      ok-text="确认"
      cancel-text="取消"
      @ok="handleEffectDateConfirm"
      @cancel="effectDateVisible = false"
    >
      <div class="ppt-review-effect-date">
        <label>施行日期</label>
        <a-date-picker
          v-model="tempEffectDate"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          placeholder="请选择施行日期"
          style="width: 300px"
        />
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts">
  import { Component, Emit, Prop, Vue } from 'nuxt-property-decorator';
  import type {
    DocumentComparePageData,
    PptUploadRecord,
    ReviewSubmitData
  } from '~/model/LawyerModel';
  import { downloadFileWithMessage } from '~/utils/personal';
  import type { CustomColumn } from '~/model/CommonModel';

  @Component({ name: 'PptReviewDetail' })
  class PptReviewDetail extends Vue {
    @Prop({ required: true }) document!: DocumentComparePageData;
    @Prop({ default: false }) submitting!: boolean;
    @Prop({ default: false }) readOnly!: boolean;

    previewUrl: string = '';
    previewLoading: boolean = false;
    uploadVisible: boolean = false;
    uploadRecordVisible: boolean = false;
    uploadRecordLoading: boolean = false;
    uploadRecords: PptUploadRecord[] = [];
    effectDateVisible: boolean = false;
    tempEffectDate: string | null = null;

    uploadConfig = {
      multiple: false,
      acceptTypes: '.ppt,.pptx',
      maxFileSize: 200 * 1024 * 1024,
      maxFileCount: 1,
      uploadText: '点击或拖拽PPT文件到此区域上传',
      hintText: '支持 PPT、PPTX 格式，文件大小不超过 200MB',
      autoUpload: false
    };

    uploadRecordColumns: CustomColumn[] = [
      {
        title: '文件名称',
        dataIndex: 'name',
        key: 'name'
      },
      {
        title: '上传时间',
        dataIndex: 'createdTime',
        key: 'createdTime'
      },
      {
        title: '操作',
        key: 'action',
        scopedSlots: { customRender: 'action' },
        width: 120
      }
    ];

    get canApprove(): boolean {
      if (this.readOnly) {
        return false;
      }
      return this.document.checkStatus === '待审核' || this.document.checkStatus === '需人工处理';
    }

    mounted(): void {
      this.loadPreviewUrl();
    }

    async loadPreviewUrl(): Promise<void> {
      if (!this.document.filePathOther) {
        this.previewUrl = '';
        return;
      }
      this.previewLoading = true;
      try {
        this.previewUrl = await this.$roadLawyerService.getPreviewUrl({
          id: this.document.filePathOther
        });
      } catch (error) {
        console.error('获取PPT预览地址失败:', error);
        this.previewUrl = '';
      } finally {
        this.previewLoading = false;
      }
    }

    async downloadCurrentPpt(): Promise<void> {
      if (!this.document.filePathOther) {
        this.$message.warning('暂无可下载文件');
        return;
      }
      const result = await this.$roadLawyerService.minioDownload({
        id: this.document.filePathOther
      });
      downloadFileWithMessage(result, {
        fileName: `${this.document.title}.pptx`,
        showMessage: true,
        messageService: this.$message
      });
    }

    showUploadModal(): void {
      this.uploadVisible = true;
    }

    uploadPpt(files: File[]): Promise<boolean> | boolean {
      const file = files[0];
      if (!file) {
        return false;
      }
      return this.$roadLawyerService.uploadPpt({
        rawledId: this.document.id,
        multipartFile: file
      });
    }

    async handleUploadComplete(): Promise<void> {
      this.uploadVisible = false;
      await this.loadUploadRecords();
      await this.loadPreviewUrl();
    }

    async showUploadRecords(): Promise<void> {
      this.uploadRecordVisible = true;
      await this.loadUploadRecords();
    }

    async loadUploadRecords(): Promise<void> {
      this.uploadRecordLoading = true;
      try {
        this.uploadRecords = await this.$roadLawyerService.getUploadPpt({
          id: this.document.id
        });
      } finally {
        this.uploadRecordLoading = false;
      }
    }

    async downloadUploadRecord(record: PptUploadRecord): Promise<void> {
      const result = await this.$roadLawyerService.minioDownload({
        id: record.id
      });
      downloadFileWithMessage(result, {
        fileName: record.name,
        showMessage: true,
        messageService: this.$message
      });
    }

    deleteUploadRecord(record: PptUploadRecord): void {
      this.$confirm({
        title: '确认删除',
        content: `确定要删除"${record.name}"吗？`,
        okText: '删除',
        okType: 'danger',
        cancelText: '取消',
        onOk: async () => {
          const success = await this.$roadLawyerService.deleteUploadPpt({
            fileId: record.id
          });
          if (success) {
            this.$message.success('删除成功');
            await this.loadUploadRecords();
          } else {
            this.$message.error('删除失败');
          }
        }
      });
    }

    viewSourceDocument(): void {
      if (!this.document.assId) {
        this.$message.warning('暂无关联原文');
        return;
      }
      this.$router.push({
        path: '/lawyerKnowledge/detail',
        query: {
          id: this.document.assId,
          pageTitle: this.document.title,
          fromPptReview: '1',
          source: this.$route.fullPath
        }
      });
    }

    showEffectDateModal(): void {
      if (this.readOnly) {
        return;
      }
      if (this.document.checkStatus !== '待审核') {
        this.$message.warning('当前文档状态不允许编辑');
        return;
      }
      this.tempEffectDate = this.document.effectDate || null;
      this.effectDateVisible = true;
    }

    handleEffectDateConfirm(): void {
      this.emitUpdateDocument({
        effectDate: this.tempEffectDate
      });
      this.effectDateVisible = false;
      this.$message.success('施行日期已更新');
    }

    handleApprove(): void {
      if (!this.document.effectDate) {
        this.$message.error('请先设置施行日期后再进行审核');
        return;
      }
      this.$confirm({
        title: '确认通过',
        content: '确定要通过此PPT的审核吗？',
        okText: '确认通过',
        cancelText: '取消',
        onOk: () => {
          this.emitSubmitReview({
            action: 'approve',
            comment: '',
            effectDateStr: this.document.effectDate
          });
        }
      });
    }

    goBack(): void {
      this.emitGoBack();
    }

    @Emit('go-back')
    emitGoBack(): void {
      // 无需返回值
    }

    @Emit('submit-review')
    emitSubmitReview(
      data: ReviewSubmitData & { effectDateStr?: string | null }
    ): ReviewSubmitData & {
      effectDateStr?: string | null;
    } {
      return data;
    }

    @Emit('update-document')
    emitUpdateDocument(updateData: { effectDate: string | null }): { effectDate: string | null } {
      return updateData;
    }
  }

  export default PptReviewDetail;
</script>

<style lang="less" scoped>
  .ppt-review-wrapper {
    height: calc(100vh - 160px);
    background: #fff;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .ppt-review-header,
  .ppt-review-toolbar,
  .ppt-review-actions {
    flex-shrink: 0;
    display: flex;
    align-items: center;
  }

  .ppt-review-header {
    justify-content: space-between;
    padding: 14px 16px 8px;
  }

  .ppt-review-title {
    display: flex;
    align-items: center;
    gap: 8px;

    h3 {
      margin: 0;
      font-size: 16px;
      color: #333;
    }
  }

  .ppt-review-editable-tag {
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .ppt-review-editable-tag--disabled {
    cursor: default;
  }

  .ppt-review-tag-edit-icon {
    font-size: 10px;
    opacity: 0.7;
  }

  .ppt-review-effect-date {
    display: flex;
    align-items: center;
    gap: 16px;

    label {
      width: 80px;
      color: #333;
      font-weight: 500;
    }
  }

  .ppt-review-toolbar {
    gap: 12px;
    flex-wrap: wrap;
    padding: 0 16px 12px;
    border-bottom: 1px solid #f0f0f0;
  }

  .ppt-review-history-btn {
    background: #d99a26;
    border-color: #d99a26;
    color: #fff;
  }

  .ppt-review-preview {
    flex: 1;
    min-height: 0;

    .ant-spin-nested-loading,
    .ant-spin-container {
      height: 100%;
    }
  }

  .ppt-review-iframe {
    width: 100%;
    height: 100%;
    border: none;
  }

  .ppt-review-actions {
    justify-content: flex-end;
    padding: 8px 12px;
    border-top: 1px solid #f0f0f0;
  }

  .ppt-review-delete {
    color: #ff4d4f;
  }
</style>
