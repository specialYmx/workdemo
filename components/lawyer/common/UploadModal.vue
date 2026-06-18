<template>
  <div ref="uploadModalContainer">
    <a-modal
      :visible="visible"
      :title="title"
      :width="width"
      :footer="null"
      :mask-closable="false"
      :closable="!uploading"
      :keyboard="!uploading"
      :dialog-style="{ top: '20px' }"
      class="modalBodyH152"
      :get-container="() => $refs.uploadModalContainer || document.body"
      @cancel="handleCancel"
    >
      <div class="common-upload-container">
        <div v-if="!uploading && !uploadSuccess">
          <a-upload-dragger
            :multiple="uploadConfig.multiple"
            :accept="uploadConfig.acceptTypes"
            :before-upload="beforeUpload"
            :file-list="fileList"
            :show-upload-list="false"
          >
            <p class="ant-upload-drag-icon">
              <a-icon type="inbox" />
            </p>
            <p class="ant-upload-text">
              {{ uploadConfig.uploadText }}
            </p>
            <p class="ant-upload-hint">
              {{ uploadConfig.hintText }}
            </p>
          </a-upload-dragger>

          <div v-if="selectedFiles.length > 0" class="common-upload-files">
            <div
              v-for="(file, index) in selectedFiles"
              :key="`${file.name}-${index}`"
              class="common-upload-file"
            >
              <a-icon type="file-text" />
              <span class="common-upload-file-name">
                {{ file.name }} ({{ formatFileSize(file.size) }})
              </span>
              <a-button
                type="link"
                icon="delete"
                :disabled="uploading"
                @click="removeSelectedFile(index)"
              />
            </div>

            <div
              v-if="uploadConfig.multiple && selectedFiles.length > 1"
              class="common-upload-summary"
            >
              <a-icon type="folder" />
              <span>已选择 {{ selectedFiles.length }} 个文件</span>
            </div>
          </div>

          <slot name="form" :files="selectedFiles" />

          <div v-if="errorMessage" class="common-upload-error">
            <a-icon type="exclamation-circle" />
            {{ errorMessage }}
          </div>
        </div>

        <div v-if="uploading && !uploadSuccess" class="common-upload-status">
          <div class="common-upload-status-header">
            <div class="common-upload-icon common-upload-icon-uploading">
              <a-icon type="rocket" />
            </div>
            <div class="common-upload-status-info">
              <div class="common-upload-status-title">{{ uploadingTitle }}</div>
              <div v-if="description" class="common-upload-file-detail">{{ description }}</div>
              <div v-if="selectedFiles.length === 1" class="common-upload-file-detail">
                文件：{{ selectedFiles[0].name }}
              </div>
              <div v-else class="common-upload-file-detail">
                文件：共 {{ selectedFiles.length }} 个文件
              </div>
            </div>
          </div>
          <a-progress :percent="uploadProgress" :show-info="false" stroke-color="#faad14" />
          <div class="common-upload-progress-text"><a-icon type="loading" spin /> 上传中</div>
        </div>

        <div v-if="!uploading && uploadSuccess" class="common-upload-status">
          <div class="common-upload-status-header">
            <div class="common-upload-icon common-upload-icon-success">
              <a-icon type="check-circle" />
            </div>
            <div class="common-upload-status-info">
              <div class="common-upload-status-title">{{ successTitle }}</div>
              <div v-if="description" class="common-upload-file-detail">{{ description }}</div>
              <div v-if="selectedFiles.length === 1" class="common-upload-file-detail">
                文件：{{ selectedFiles[0].name }}
              </div>
              <div v-else class="common-upload-file-detail">
                文件：共 {{ selectedFiles.length }} 个文件
              </div>
              <div class="common-upload-success-message">
                {{
                  selectedFiles.length === 1
                    ? singleSuccessMessage
                    : `${selectedFiles.length} 个文件${multipleSuccessSuffix}`
                }}
              </div>
            </div>
          </div>
        </div>

        <div class="common-upload-actions">
          <a-button v-if="!uploading && !uploadSuccess" @click="handleCancel">取消</a-button>
          <a-button
            v-if="!uploading && !uploadSuccess"
            type="primary"
            :disabled="selectedFiles.length === 0"
            @click="startUpload"
          >
            {{ confirmText }}
          </a-button>

          <a-button v-if="!uploading && uploadSuccess" type="primary" @click="handleComplete">
            完成
          </a-button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts">
  import { Component, Vue, Prop, Watch, Emit } from 'nuxt-property-decorator';

  interface CommonUploadConfig {
    multiple?: boolean;
    acceptTypes?: string;
    maxFileSize?: number;
    maxFileCount?: number;
    uploadText?: string;
    hintText?: string;
    autoUpload?: boolean;
  }

  interface UploadResult {
    files: File[];
    file: File | null;
  }

  type UploadRequest = (files: File[]) => Promise<boolean | void> | boolean | void;
  type BeforeSubmit = (files: File[]) => Promise<boolean | void> | boolean | void;

  @Component({ name: 'LawyerCommonUploadModal' })
  class LawyerCommonUploadModal extends Vue {
    @Prop({ default: false }) visible!: boolean;
    @Prop({ default: '上传文件' }) title!: string;
    @Prop({ default: 800 }) width!: number;
    @Prop({ default: '' }) description!: string;
    @Prop({ default: '上传文件' }) confirmText!: string;
    @Prop({ default: '正在上传' }) uploadingTitle!: string;
    @Prop({ default: '上传完成' }) successTitle!: string;
    @Prop({ default: '文件已成功上传' }) singleSuccessMessage!: string;
    @Prop({ default: '已成功上传' }) multipleSuccessSuffix!: string;
    @Prop({ type: Function, default: null }) uploadRequest!: UploadRequest | null;
    @Prop({ type: Function, default: null }) beforeSubmit!: BeforeSubmit | null;

    @Prop({
      type: Object,
      default: () => ({})
    })
    config!: CommonUploadConfig;

    selectedFiles: File[] = [];
    uploading: boolean = false;
    uploadSuccess: boolean = false;
    uploadProgress: number = 0;
    errorMessage: string = '';
    progressTimer: number | NodeJS.Timeout | null = null;

    get uploadConfig(): Required<CommonUploadConfig> {
      return {
        multiple: false,
        acceptTypes: '.pdf,.doc,.docx',
        maxFileSize: 500 * 1024 * 1024,
        maxFileCount: 1,
        uploadText: '点击或拖拽文件到此区域上传',
        hintText: '支持 PDF、DOC、DOCX 格式，文件大小不超过 500MB',
        autoUpload: false,
        ...this.config
      };
    }

    get selectedFile(): File | null {
      return this.selectedFiles.length > 0 ? this.selectedFiles[0] : null;
    }

    get fileList() {
      return this.selectedFiles.map((file, index) => ({
        uid: `file-${index}`,
        name: file.name,
        status: 'done',
        originFileObj: file
      }));
    }

    @Watch('visible')
    onVisibleChange(newVal: boolean): void {
      if (!newVal) {
        this.resetState();
      }
    }

    beforeUpload(file: File): boolean {
      this.processFile(file);
      return false;
    }

    processFile(file: File): void {
      this.clearError();

      if (!this.isValidFileType(file)) {
        this.showError(`只支持 ${this.getFileTypeHint()} 格式的文件`);
        return;
      }

      if (file.size > this.uploadConfig.maxFileSize) {
        this.showError(`文件大小不能超过 ${this.formatFileSize(this.uploadConfig.maxFileSize)}`);
        return;
      }

      if (file.size === 0) {
        this.showError('不能上传空文件');
        return;
      }

      if (!this.uploadConfig.multiple) {
        this.selectedFiles = [file];
      } else {
        if (this.selectedFiles.length >= this.uploadConfig.maxFileCount) {
          this.showError(`最多只能选择 ${this.uploadConfig.maxFileCount} 个文件`);
          return;
        }

        const existingFile = this.selectedFiles.find(item => item.name === file.name);
        if (existingFile) {
          this.showError(`文件 "${file.name}" 已存在`);
          return;
        }

        this.selectedFiles.push(file);
      }

      this.$message.success(`文件 "${file.name}" 已选择`);

      if (this.uploadConfig.autoUpload) {
        this.startUpload();
      }
    }

    isValidFileType(file: File): boolean {
      const acceptTypes = this.uploadConfig.acceptTypes.toLowerCase();
      const fileName = file.name.toLowerCase();
      const extensions = acceptTypes
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);

      return extensions.some(item => fileName.endsWith(item));
    }

    getFileTypeHint(): string {
      return this.uploadConfig.acceptTypes
        .split(',')
        .map(item => item.trim().replace(/\./g, ''))
        .filter(item => item.length > 0)
        .join('、')
        .toUpperCase();
    }

    async startUpload(): Promise<void> {
      if (this.selectedFiles.length === 0) {
        return;
      }

      if (this.beforeSubmit) {
        const canSubmit = await this.beforeSubmit(this.selectedFiles);
        if (canSubmit === false) {
          return;
        }
      }

      await this.runUpload();
    }

    async runUpload(): Promise<void> {
      this.uploading = true;
      this.uploadSuccess = false;
      this.uploadProgress = 0;
      this.startProgress();

      try {
        if (this.uploadRequest) {
          const success = await this.uploadRequest(this.selectedFiles);
          if (success === false) {
            throw new Error('上传失败');
          }
        }

        this.uploadProgress = 100;
        await new Promise(resolve => setTimeout(resolve, 300));

        this.uploading = false;
        this.uploadSuccess = true;
        this.emitUploadSuccess({ files: this.selectedFiles, file: this.selectedFile });
      } catch (error) {
        this.$message.error('上传失败，请重试');
        this.uploading = false;
        this.uploadSuccess = false;
        this.emitUploadError({ files: this.selectedFiles, error });
      } finally {
        this.clearProgress();
      }
    }

    startProgress(): void {
      this.progressTimer = setInterval(() => {
        this.uploadProgress = Math.min(90, this.uploadProgress + Math.random() * 15 + 5);
      }, 200);
    }

    clearProgress(): void {
      if (this.progressTimer) {
        clearInterval(this.progressTimer);
        this.progressTimer = null;
      }
    }

    removeSelectedFile(index: number): void {
      this.selectedFiles.splice(index, 1);
      this.clearError();
    }

    showError(message: string): void {
      this.errorMessage = message;
      this.$message.error(message);
      setTimeout(() => this.clearError(), 5000);
    }

    clearError(): void {
      this.errorMessage = '';
    }

    handleCancel(): void {
      if (this.uploading) {
        return;
      }
      this.resetState();
      this.emitCancel();
    }

    handleComplete(): void {
      this.resetState();
      this.emitComplete();
    }

    resetState(): void {
      this.clearProgress();
      this.selectedFiles = [];
      this.uploading = false;
      this.uploadSuccess = false;
      this.uploadProgress = 0;
      this.clearError();
    }

    formatFileSize(bytes: number): string {
      if (bytes === 0) {
        return '0 B';
      }
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    beforeDestroy(): void {
      this.clearProgress();
    }

    @Emit('upload-success')
    emitUploadSuccess(data: UploadResult): UploadResult {
      return data;
    }

    @Emit('upload-error')
    emitUploadError(data: { files: File[]; error: Error | unknown }): {
      files: File[];
      error: Error | unknown;
    } {
      return data;
    }

    @Emit('cancel')
    emitCancel(): void {
      // 无需返回值
    }

    @Emit('complete')
    emitComplete(): void {
      // 无需返回值
    }
  }

  export default LawyerCommonUploadModal;
</script>

<style lang="less" scoped>
  .common-upload-container {
    padding: 16px 0;

    .ant-upload-dragger {
      height: 180px;

      .ant-upload-drag-icon {
        margin-bottom: 16px;
      }

      .ant-upload-text {
        font-size: 16px;
        font-weight: 500;
        color: #333;
        margin-bottom: 8px;
      }

      .ant-upload-hint {
        color: #999;
      }
    }
  }

  .ant-upload-drag-icon .anticon {
    font-size: 48px;
    color: #1890ff;
  }

  .common-upload-file,
  .common-upload-error,
  .common-upload-summary,
  .common-upload-status-header,
  .common-upload-icon,
  .common-upload-progress-text,
  .common-upload-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .common-upload-files {
    margin-top: 16px;
  }

  .common-upload-file,
  .common-upload-error,
  .common-upload-summary {
    border-radius: 6px;
    border: 1px solid;
  }

  .common-upload-file,
  .common-upload-error {
    margin-bottom: 8px;
    padding: 12px;
  }

  .common-upload-file {
    background: #f0f8ff;
    border-color: #d6e4ff;
    color: #333;
  }

  .common-upload-file-name {
    flex: 1;
    word-break: break-all;
  }

  .common-upload-summary {
    margin-top: 8px;
    padding: 8px 12px;
    background: #f6ffed;
    border-color: #b7eb8f;
    color: #52c41a;
  }

  .common-upload-error {
    background: #fff2f0;
    border-color: #ffccc7;
    color: #ff4d4f;
  }

  .common-upload-status {
    text-align: center;
    padding: 24px;
  }

  .common-upload-status-header {
    justify-content: center;
    gap: 16px;
    margin-bottom: 24px;
  }

  .common-upload-icon {
    justify-content: center;
    width: 56px;
    height: 56px;
    border-radius: 50%;
  }

  .common-upload-icon .anticon {
    font-size: 24px;
    color: #fff;
  }

  .common-upload-icon-uploading {
    background: #faad14;
  }

  .common-upload-icon-success {
    background: #52c41a;
  }

  .common-upload-status-info {
    text-align: left;
  }

  .common-upload-status-title,
  .common-upload-success-message,
  .common-upload-progress-text {
    font-weight: 500;
  }

  .common-upload-status-title {
    font-size: 16px;
    font-weight: 600;
    color: #333;
    margin-bottom: 8px;
  }

  .common-upload-file-detail {
    color: #666;
    margin-bottom: 4px;
  }

  .common-upload-success-message {
    color: #52c41a;
    margin-top: 8px;
  }

  .common-upload-progress-text {
    justify-content: center;
    color: #faad14;
    margin-top: 12px;
  }

  .common-upload-actions {
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid #f0f0f0;
  }
</style>
