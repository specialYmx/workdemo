<template>
  <div>
    <a-modal
      :visible="visible"
      :title="title"
      :width="520"
      :footer="null"
      :maskClosable="false"
      @cancel="handleCancel"
      :closable="!uploading"
    >
      <div class="lawyer-upload-container">
        <!-- 文件选择 -->
        <div v-if="!uploading && !uploadSuccess">
          <a-upload-dragger
            :multiple="uploadConfig.multiple"
            :before-upload="beforeUpload"
            :show-upload-list="false"
            :accept="acceptTypes"
            :class="{ 'drag-over': isDragOver }"
            @drop="handleDrop"
            @dragover="handleDragOver"
            @dragleave="handleDragLeave"
          >
            <div class="lawyer-upload-content">
              <a-icon type="inbox" class="lawyer-upload-icon" />
              <div class="lawyer-upload-text">
                {{ uploadConfig.uploadText }}
              </div>
              <div class="lawyer-upload-hint">{{ uploadConfig.hintText }}</div>
            </div>
          </a-upload-dragger>

          <!-- 已选择文件列表 -->
          <div v-if="selectedFiles.length > 0" class="lawyer-files-container">
            <div
              v-for="(file, index) in selectedFiles"
              :key="index"
              class="lawyer-file-info"
            >
              <a-icon type="file-text" />
              <span class="lawyer-file-name"
                >{{ file.name }} ({{ formatFileSize(file.size) }})</span
              >
              <a-button
                type="link"
                icon="delete"
                @click="removeSelectedFile(index)"
              />
            </div>

            <!-- 多文件模式下显示文件统计 -->
            <div
              v-if="uploadConfig.multiple && selectedFiles.length > 1"
              class="lawyer-file-summary"
            >
              <a-icon type="folder" />
              <span>已选择 {{ selectedFiles.length }} 个文件</span>
            </div>
          </div>

          <!-- 错误提示 -->
          <div v-if="errorMessage" class="lawyer-error-message">
            <a-icon type="exclamation-circle" />
            {{ errorMessage }}
          </div>
        </div>

        <!-- 上传中 -->
        <div v-if="uploading && !uploadSuccess" class="lawyer-upload-status">
          <div class="lawyer-status-header">
            <div class="lawyer-icon-container lawyer-rocket">
              <a-icon type="rocket" />
            </div>
            <div class="lawyer-status-info">
              <div class="lawyer-status-title">正在更新文档</div>
              <div class="lawyer-file-detail">文档：{{ documentTitle }}</div>
              <div class="lawyer-file-detail">
                文件：{{ selectedFile?.name }}
              </div>
            </div>
          </div>
          <a-progress
            :percent="uploadProgress"
            :show-info="false"
            stroke-color="#faad14"
          />
          <div class="lawyer-progress-text">
            <a-icon type="loading" spin /> 更新中
          </div>
        </div>

        <!-- 上传完成 -->
        <div v-if="!uploading && uploadSuccess" class="lawyer-upload-status">
          <div class="lawyer-status-header">
            <div class="lawyer-icon-container lawyer-success">
              <a-icon type="check-circle" />
            </div>
            <div class="lawyer-status-info">
              <div class="lawyer-status-title">上传完成</div>
              <div class="lawyer-file-detail">文档：{{ documentTitle }}</div>
              <div class="lawyer-file-detail">
                文件：{{ selectedFile?.name }}
              </div>
              <div class="lawyer-success-message">文件已成功上传并更新</div>
            </div>
          </div>
        </div>

        <!-- 底部按钮 -->
        <div class="lawyer-modal-actions">
          <a-button v-if="!uploading && !uploadSuccess" @click="handleCancel"
            >取消</a-button
          >
          <a-button
            v-if="!uploading && !uploadSuccess"
            type="primary"
            :disabled="selectedFiles.length === 0"
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
  </div>
</template>

<script lang="ts">
// @ts-nocheck
import { Component, Vue, Prop, Watch, Emit } from "nuxt-property-decorator";

// 上传配置接口
interface UploadConfig {
  multiple?: boolean;
  acceptTypes?: string;
  maxFileSize?: number;
  maxFileCount?: number;
  uploadText?: string;
  hintText?: string;
  autoUpload?: boolean;
}

@Component
export default class FileUploadModal extends Vue {
  @Prop({ type: Boolean, default: false }) visible!: boolean;
  @Prop({ type: String, default: "上传文件" }) title!: string;
  @Prop({ type: String, default: "" }) documentId!: string;
  @Prop({ type: String, default: "" }) documentTitle!: string;

  // 上传配置
  @Prop({
    type: Object,
    default: () => ({
      multiple: false,
      acceptTypes: ".pdf,.doc,.docx",
      maxFileSize: 500 * 1024 * 1024, // 500MB
      maxFileCount: 1,
      uploadText: "点击或拖拽文件到此区域上传",
      hintText: "支持 PDF、DOC、DOCX 格式，文件大小不超过 500MB",
      autoUpload: false,
    }),
  })
  config!: UploadConfig;

  // 状态
  selectedFiles: File[] = [];
  uploading = false;
  uploadSuccess = false;
  uploadProgress = 0;
  errorMessage = "";
  isDragOver = false;
  uploadTimer: any = null;

  // 计算属性 - 获取配置值
  get uploadConfig(): Required<UploadConfig> {
    return {
      multiple: false,
      acceptTypes: ".pdf,.doc,.docx",
      maxFileSize: 500 * 1024 * 1024,
      maxFileCount: 1,
      uploadText: "点击或拖拽文件到此区域上传",
      hintText: "支持 PDF、DOC、DOCX 格式，文件大小不超过 500MB",
      autoUpload: false,
      ...this.config,
    };
  }

  // 兼容性属性 - 保持向后兼容
  get selectedFile(): File | null {
    return this.selectedFiles.length > 0 ? this.selectedFiles[0] : null;
  }

  get acceptTypes(): string {
    return this.uploadConfig.acceptTypes;
  }

  get maxFileSize(): number {
    return this.uploadConfig.maxFileSize;
  }

  // 文件验证
  beforeUpload(file: File) {
    this.clearError();

    // 检查文件类型
    if (!this.isValidFileType(file)) {
      const typeHint = this.getFileTypeHint();
      this.showError(`只支持 ${typeHint} 格式的文件`);
      return false;
    }

    // 检查文件大小
    if (file.size > this.maxFileSize) {
      const sizeHint = this.formatFileSize(this.maxFileSize);
      this.showError(`文件大小不能超过 ${sizeHint}`);
      return false;
    }

    if (file.size === 0) {
      this.showError("不能上传空文件");
      return false;
    }

    // 检查文件数量限制
    if (!this.uploadConfig.multiple) {
      // 单文件模式，替换现有文件
      this.selectedFiles = [file];
    } else {
      // 多文件模式，检查数量限制
      if (this.selectedFiles.length >= this.uploadConfig.maxFileCount) {
        this.showError(`最多只能选择 ${this.uploadConfig.maxFileCount} 个文件`);
        return false;
      }

      // 检查是否已存在同名文件
      const existingFile = this.selectedFiles.find((f) => f.name === file.name);
      if (existingFile) {
        this.showError(`文件 "${file.name}" 已存在`);
        return false;
      }

      this.selectedFiles.push(file);
    }

    // 触发文件变化事件
    this.emitFileChange({
      files: this.selectedFiles,
      currentFile: file,
    });

    // 如果启用自动上传，立即开始上传
    if (this.uploadConfig.autoUpload) {
      this.$nextTick(() => {
        this.startUpload();
      });
    }

    return false;
  }

  isValidFileType(file: File): boolean {
    // 根据配置的文件类型进行验证
    const acceptTypes = this.uploadConfig.acceptTypes.toLowerCase();
    const fileName = file.name.toLowerCase();

    // 如果配置了具体的扩展名
    if (acceptTypes.includes(".")) {
      const extensions = acceptTypes.split(",").map((ext) => ext.trim());
      return extensions.some((ext) => fileName.endsWith(ext));
    }

    // 默认的文件类型验证（保持向后兼容）
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const validExtensions = [".pdf", ".doc", ".docx"];
    return (
      validTypes.includes(file.type) ||
      validExtensions.some((ext) => fileName.endsWith(ext))
    );
  }

  // 获取文件类型提示文本
  getFileTypeHint(): string {
    const acceptTypes = this.uploadConfig.acceptTypes;
    if (acceptTypes.includes(".")) {
      return acceptTypes.replace(/\./g, "").replace(/,/g, "、").toUpperCase();
    }
    return "PDF、DOC、DOCX";
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

  removeSelectedFile(index?: number) {
    if (typeof index === "number") {
      // 移除指定索引的文件
      this.selectedFiles.splice(index, 1);
    } else {
      // 兼容性：移除所有文件
      this.selectedFiles = [];
    }

    this.clearError();

    // 触发文件变化事件
    this.emitFileChange({
      files: this.selectedFiles,
      currentFile: null,
    });
  }

  // 上传处理
  async startUpload() {
    if (this.selectedFiles.length === 0) return;

    this.uploading = true;
    this.uploadSuccess = false;
    this.uploadProgress = 0;

    try {
      await this.simulateUpload();
      this.uploading = false;
      this.uploadSuccess = true;

      // 发送上传成功事件
      this.emitUploadSuccess({
        files: this.selectedFiles,
        file: this.selectedFile, // 保持向后兼容
        documentId: this.documentId,
      });
    } catch (error) {
      this.$message.error("上传失败，请重试");
      this.uploading = false;
      this.uploadSuccess = false;

      // 发送上传失败事件
      this.emitUploadError({
        files: this.selectedFiles,
        error: error,
      });
    }
  }

  // 真实上传到后端
  async simulateUpload(): Promise<void> {
    if (!this.selectedFile || !this.documentId) {
      throw new Error("缺少必要的上传参数");
    }

    try {
      // 创建FormData
      const formData = new FormData();
      formData.append("id", this.documentId);
      formData.append("file", this.selectedFile);

      console.log("上传参数:", {
        id: this.documentId,
        fileName: this.selectedFile.name,
        fileSize: this.selectedFile.size,
      });

      // 模拟上传进度
      const progressInterval = setInterval(() => {
        if (this.uploadProgress < 90) {
          this.uploadProgress += 10;
        }
      }, 200);

      // 调用真实的后端接口
      const success = await this.$service.lawyer.uploadRuleSource({
        id: this.documentId,
        file: this.selectedFile,
      });

      clearInterval(progressInterval);
      this.uploadProgress = 100;

      if (!success) {
        throw new Error("上传失败");
      }

      // 等待一下让用户看到100%进度
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error("上传失败:", error);
      throw error;
    }
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
    this.emitCancel();
  }

  handleComplete() {
    this.resetState();
    this.emitComplete();
  }

  resetState() {
    this.selectedFiles = [];
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

  // Emit 装饰器方法
  @Emit("file-change")
  emitFileChange(data: { files: File[]; currentFile: File | null }) {
    return data;
  }

  @Emit("upload-success")
  emitUploadSuccess(data: {
    files: File[];
    file: File | null;
    documentId: string;
  }) {
    return data;
  }

  @Emit("upload-error")
  emitUploadError(data: { files: File[]; error: any }) {
    return data;
  }

  @Emit("cancel")
  emitCancel() {
    // 无需返回值
  }

  @Emit("complete")
  emitComplete() {
    // 无需返回值
  }
}
</script>

<style lang="less" scoped>
.lawyer-upload-container {
  padding: 16px 0;
}

.lawyer-upload-content {
  padding: 24px;
  text-align: center;

  .lawyer-upload-icon {
    font-size: 48px;
    color: #1890ff;
    margin-bottom: 16px;
    display: block;
  }
  .lawyer-upload-text {
    font-size: 16px;
    color: #333;
    margin-bottom: 8px;
    font-weight: 500;
  }
  .lawyer-upload-hint {
    color: #999;
    font-size: 14px;
  }
}

.lawyer-files-container {
  margin-top: 16px;
}

.lawyer-file-info,
.lawyer-error-message {
  margin-bottom: 8px;
  padding: 12px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.lawyer-file-info {
  background: #f0f8ff;
  border: 1px solid #d6e4ff;
  color: #333;

  .lawyer-file-name {
    flex: 1;
    word-break: break-all;
  }
}

.lawyer-file-summary {
  margin-top: 8px;
  padding: 8px 12px;
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 6px;
  color: #52c41a;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.lawyer-error-message {
  background: #fff2f0;
  border: 1px solid #ffccc7;
  color: #ff4d4f;
}

.lawyer-upload-status {
  text-align: center;
  padding: 24px;

  .lawyer-status-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin-bottom: 24px;

    .lawyer-icon-container {
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

      &.lawyer-rocket {
        background: linear-gradient(135deg, #ffd666, #faad14);
      }
      &.lawyer-success {
        background: linear-gradient(135deg, #73d13d, #52c41a);
      }
    }

    .lawyer-status-info {
      text-align: left;

      .lawyer-status-title {
        font-size: 16px;
        font-weight: 600;
        color: #333;
        margin-bottom: 8px;
      }
      .lawyer-file-detail {
        font-size: 14px;
        color: #666;
        margin-bottom: 4px;
      }
      .lawyer-success-message {
        font-size: 14px;
        color: #52c41a;
        font-weight: 500;
        margin-top: 8px;
      }
    }
  }

  .lawyer-progress-text {
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

.lawyer-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

// Ant Design组件样式
.ant-upload-dragger {
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  min-height: 160px;
  transition: all 0.3s;
  background: #fafafa;
  padding: 20px;

  &:hover,
  &.drag-over {
    border-color: #1890ff;
    background: #f0f8ff;
  }
}
</style>
