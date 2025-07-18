<template>
  <a-modal
    :visible="visible"
    :title="title"
    :width="520"
    :footer="null"
    :maskClosable="false"
    @cancel="handleCancel"
    :closable="!uploading"
  >
    <div class="upload-container">
      <!-- 文件选择 -->
      <div v-if="!uploading && !uploadSuccess">
        <a-upload-dragger
          :multiple="false"
          :before-upload="beforeUpload"
          :show-upload-list="false"
          :accept="acceptTypes"
          :class="{ 'drag-over': isDragOver }"
          @drop="handleDrop"
          @dragover="handleDragOver"
          @dragleave="handleDragLeave"
        >
          <div class="upload-content">
            <a-icon type="inbox" class="upload-icon" />
            <div class="upload-text">点击或拖拽文件到此区域上传</div>
            <div class="upload-hint">
              支持 PDF、DOC、DOCX 格式，文件大小不超过 500MB
            </div>
          </div>
        </a-upload-dragger>

        <!-- 已选择文件 -->
        <div v-if="selectedFile" class="file-info">
          <a-icon type="file-text" />
          <span
            >{{ selectedFile.name }} ({{
              formatFileSize(selectedFile.size)
            }})</span
          >
          <a-button type="link" icon="delete" @click="removeSelectedFile" />
        </div>

        <!-- 错误提示 -->
        <div v-if="errorMessage" class="error-message">
          <a-icon type="exclamation-circle" />
          {{ errorMessage }}
        </div>
      </div>

      <!-- 上传中 -->
      <div v-if="uploading && !uploadSuccess" class="upload-status">
        <div class="status-header">
          <div class="icon-container rocket">
            <a-icon type="rocket" />
          </div>
          <div class="status-info">
            <div class="status-title">正在更新文档</div>
            <div class="file-detail">文档：{{ documentTitle }}</div>
            <div class="file-detail">文件：{{ selectedFile?.name }}</div>
          </div>
        </div>
        <a-progress
          :percent="uploadProgress"
          :show-info="false"
          stroke-color="#faad14"
        />
        <div class="progress-text"><a-icon type="loading" spin /> 更新中</div>
      </div>

      <!-- 上传完成 -->
      <div v-if="!uploading && uploadSuccess" class="upload-status">
        <div class="status-header">
          <div class="icon-container success">
            <a-icon type="check-circle" />
          </div>
          <div class="status-info">
            <div class="status-title">上传完成</div>
            <div class="file-detail">文档：{{ documentTitle }}</div>
            <div class="file-detail">文件：{{ selectedFile?.name }}</div>
            <div class="success-message">文件已成功上传并更新</div>
          </div>
        </div>
      </div>

      <!-- 底部按钮 -->
      <div class="modal-actions">
        <a-button v-if="!uploading && !uploadSuccess" @click="handleCancel"
          >取消</a-button
        >
        <a-button
          v-if="!uploading && !uploadSuccess"
          type="primary"
          :disabled="!selectedFile"
          @click="startUpload"
          >开始上传</a-button
        >
        <a-button v-if="uploading && !uploadSuccess" @click="cancelUpload"
          >取消上传</a-button
        >
        <a-button
          v-if="!uploading && uploadSuccess"
          type="primary"
          @click="handleComplete"
          >完成</a-button
        >
      </div>
    </div>
  </a-modal>
</template>

<script lang="ts">
// @ts-nocheck
import { Component, Vue, Prop, Watch } from "nuxt-property-decorator";

@Component
export default class FileUploadModal extends Vue {
  @Prop({ type: Boolean, default: false }) visible!: boolean;
  @Prop({ type: String, default: "上传文件" }) title!: string;
  @Prop({ type: String, default: "" }) documentId!: string;
  @Prop({ type: String, default: "" }) documentTitle!: string;

  // 状态
  selectedFile: File | null = null;
  uploading = false;
  uploadSuccess = false;
  uploadProgress = 0;
  errorMessage = "";
  isDragOver = false;
  uploadTimer: any = null;

  // 配置
  acceptTypes = ".pdf,.doc,.docx";
  maxFileSize = 500 * 1024 * 1024; // 500MB

  // 文件验证
  beforeUpload(file: File) {
    this.clearError();

    if (!this.isValidFileType(file)) {
      this.showError("只支持 PDF、DOC、DOCX 格式的文件");
      return false;
    }

    if (file.size > this.maxFileSize) {
      this.showError("文件大小不能超过 500MB");
      return false;
    }

    if (file.size === 0) {
      this.showError("不能上传空文件");
      return false;
    }

    this.selectedFile = file;
    return false;
  }

  isValidFileType(file: File): boolean {
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const validExtensions = [".pdf", ".doc", ".docx"];
    return (
      validTypes.includes(file.type) ||
      validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))
    );
  }

  // 拖拽处理
  handleDragOver(e: DragEvent) {
    e.preventDefault();
    this.isDragOver = true;
  }
  handleDragLeave(e: DragEvent) {
    e.preventDefault();
    this.isDragOver = false;
  }
  handleDrop(e: DragEvent) {
    e.preventDefault();
    this.isDragOver = false;
  }

  // 错误处理
  showError(message: string) {
    this.errorMessage = message;
    this.$message.error(message);
    setTimeout(() => this.clearError(), 5000);
  }
  clearError() {
    this.errorMessage = "";
  }

  removeSelectedFile() {
    this.selectedFile = null;
    this.clearError();
  }

  // 上传处理
  async startUpload() {
    if (!this.selectedFile) return;

    this.uploading = true;
    this.uploadSuccess = false;
    this.uploadProgress = 0;

    try {
      await this.simulateUpload();
      this.uploading = false;
      this.uploadSuccess = true;
      this.$emit("upload-success", {
        file: this.selectedFile,
        documentId: this.documentId,
      });
    } catch (error) {
      this.$message.error("上传失败，请重试");
      this.uploading = false;
      this.uploadSuccess = false;
    }
  }

  // 模拟上传进度
  async simulateUpload(): Promise<void> {
    return new Promise((resolve) => {
      this.uploadTimer = setInterval(() => {
        this.uploadProgress += 10;
        if (this.uploadProgress >= 100) {
          clearInterval(this.uploadTimer);
          setTimeout(resolve, 500);
        }
      }, 200);
    });
  }

  cancelUpload() {
    if (this.uploadTimer) {
      clearInterval(this.uploadTimer);
      this.uploadTimer = null;
    }
    this.uploading = false;
    this.uploadSuccess = false;
    this.uploadProgress = 0;
  }

  handleCancel() {
    this.cancelUpload();
    this.resetState();
    this.$emit("cancel");
  }

  handleComplete() {
    this.resetState();
    this.$emit("complete");
  }

  resetState() {
    this.selectedFile = null;
    this.uploading = false;
    this.uploadSuccess = false;
    this.uploadProgress = 0;
    this.clearError();
    this.isDragOver = false;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  @Watch("visible")
  onVisibleChange(newVal: boolean) {
    if (!newVal) this.resetState();
  }
}
</script>

<style lang="less" scoped>
.upload-container {
  padding: 16px 0;
}

.ant-upload-dragger {
  border: 2px dashed #d9d9d9 !important;
  border-radius: 8px;
  min-height: 160px;
  transition: all 0.3s;

  &:hover,
  &.drag-over {
    border-color: #1890ff !important;
    background: #f0f8ff !important;
  }
}

.upload-content {
  padding: 24px;
  text-align: center;

  .upload-icon {
    font-size: 48px;
    color: #1890ff;
    margin-bottom: 16px;
  }
  .upload-text {
    font-size: 16px;
    color: #333;
    margin-bottom: 8px;
    font-weight: 500;
  }
  .upload-hint {
    color: #999;
    font-size: 14px;
  }
}

.file-info,
.error-message {
  margin-top: 16px;
  padding: 12px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-info {
  background: #f0f8ff;
  border: 1px solid #d6e4ff;
  color: #333;
}

.error-message {
  background: #fff2f0;
  border: 1px solid #ffccc7;
  color: #ff4d4f;
}

.upload-status {
  text-align: center;
  padding: 24px;

  .status-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin-bottom: 24px;

    .icon-container {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;

      .anticon {
        font-size: 24px;
        color: #fff;
      }

      &.rocket {
        background: linear-gradient(135deg, #ffd666, #faad14);
      }
      &.success {
        background: linear-gradient(135deg, #73d13d, #52c41a);
      }
    }

    .status-info {
      text-align: left;

      .status-title {
        font-size: 16px;
        font-weight: 600;
        color: #333;
        margin-bottom: 8px;
      }
      .file-detail {
        font-size: 14px;
        color: #666;
        margin-bottom: 4px;
      }
      .success-message {
        font-size: 14px;
        color: #52c41a;
        font-weight: 500;
        margin-top: 8px;
      }
    }
  }

  .progress-text {
    margin-top: 12px;
    font-size: 14px;
    color: #faad14;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}
</style>
