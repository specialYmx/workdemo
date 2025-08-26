<template>
  <div ref="fileUploadModalContainer">
    <a-modal
      :visible="visible"
      :title="title"
      :width="520"
      :footer="null"
      :maskClosable="false"
      @cancel="handleCancel"
      :closable="!uploading"
      :getContainer="() => $refs.fileUploadModalContainer || document.body"
    >
      <div class="lawyer-upload-container">
        <!-- 文件选择 -->
        <div v-if="!uploading && !uploadSuccess">
          <a-upload-dragger
            :multiple="uploadConfig.multiple"
            :accept="uploadConfig.acceptTypes"
            :beforeUpload="beforeUpload"
            :fileList="fileList"
            :showUploadList="false"
          >
            <p class="ant-upload-drag-icon">
              <a-icon type="inbox" />
            </p>
            <p class="ant-upload-text">{{ uploadConfig.uploadText }}</p>
            <p class="ant-upload-hint">{{ uploadConfig.hintText }}</p>
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
                :disabled="uploading"
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
              <div class="lawyer-file-detail" v-if="selectedFiles.length === 1">
                文件：{{ selectedFiles[0]?.name }}
              </div>
              <div class="lawyer-file-detail" v-else>
                文件：共 {{ selectedFiles.length }} 个文件
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
              <div class="lawyer-file-detail" v-if="selectedFiles.length === 1">
                文件：{{ selectedFiles[0]?.name }}
              </div>
              <div class="lawyer-file-detail" v-else>
                文件：共 {{ selectedFiles.length }} 个文件
              </div>
              <div class="lawyer-success-message">
                {{
                  selectedFiles.length === 1
                    ? "文件已成功上传并更新"
                    : `${selectedFiles.length} 个文件已成功上传并更新`
                }}
              </div>
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
import { Component, Vue, Prop, Watch, Emit } from "nuxt-property-decorator";
import {
  UploadConfig,
  UploadSuccessData,
  UploadErrorData,
} from "~/model/LawyerModel";

@Component
export default class FileUploadModal extends Vue {
  @Prop({ type: Boolean, default: false }) visible!: boolean;
  @Prop({ type: String, default: "上传文件" }) title!: string;
  @Prop({ type: String, default: "" }) documentId!: string;
  @Prop({ type: String, default: "" }) documentTitle!: string;

  // 上传配置
  @Prop({
    type: Object,
    default: () => ({}),
  })
  config!: UploadConfig;

  // 状态
  selectedFiles: File[] = [];
  uploading: boolean = false;
  uploadSuccess: boolean = false;
  uploadProgress: number = 0;
  errorMessage: string = "";
  progressTimer: NodeJS.Timeout | null = null;

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

  // antd-vue Upload 组件需要的 fileList
  get fileList() {
    return this.selectedFiles.map((file, index) => ({
      uid: `file-${index}`,
      name: file.name,
      status: "done",
      originFileObj: file,
    }));
  }

  // antd-vue Upload 组件的 beforeUpload 钩子
  beforeUpload(file: File): boolean {
    this.processFile(file);
    return false; // 阻止自动上传
  }

  isValidFileType(file: File): boolean {
    // 完全根据配置的 acceptTypes 进行验证
    const acceptTypes: string = this.uploadConfig.acceptTypes.toLowerCase();
    const fileName: string = file.name.toLowerCase();

    // 解析扩展名列表
    const extensions: string[] = acceptTypes
      .split(",")
      .map((ext: string): string => ext.trim())
      .filter((ext: string): boolean => ext.length > 0);

    // 验证文件扩展名
    return extensions.some((ext: string): boolean => fileName.endsWith(ext));
  }

  // 获取文件类型提示文本
  getFileTypeHint(): string {
    const acceptTypes: string = this.uploadConfig.acceptTypes;
    return acceptTypes
      .split(",")
      .map((ext: string): string => ext.trim().replace(/\./g, ""))
      .filter((ext: string): boolean => ext.length > 0)
      .join("、")
      .toUpperCase();
  }

  // 处理文件的核心方法
  processFile(file: File): void {
    this.clearError();

    // 检查文件类型
    if (!this.isValidFileType(file)) {
      const typeHint: string = this.getFileTypeHint();
      this.showError(`只支持 ${typeHint} 格式的文件`);
      return;
    }

    // 检查文件大小
    if (file.size > this.uploadConfig.maxFileSize) {
      const sizeHint: string = this.formatFileSize(
        this.uploadConfig.maxFileSize
      );
      this.showError(`文件大小不能超过 ${sizeHint}`);
      return;
    }

    if (file.size === 0) {
      this.showError("不能上传空文件");
      return;
    }

    // 检查文件数量限制
    if (!this.uploadConfig.multiple) {
      // 单文件模式，替换现有文件
      this.selectedFiles = [file];
    } else {
      // 多文件模式，检查数量限制
      if (this.selectedFiles.length >= this.uploadConfig.maxFileCount) {
        this.showError(`最多只能选择 ${this.uploadConfig.maxFileCount} 个文件`);
        return;
      }

      // 检查是否已存在同名文件
      const existingFile: File | undefined = this.selectedFiles.find(
        (f: File): boolean => f.name === file.name
      );
      if (existingFile) {
        this.showError(`文件 "${file.name}" 已存在`);
        return;
      }

      this.selectedFiles.push(file);
    }

    // 立即显示成功提示
    this.$message.success(`文件 "${file.name}" 已选择`);

    // 如果启用自动上传，立即开始上传
    if (this.uploadConfig.autoUpload) {
      this.startUpload();
    }
  }

  // 错误处理
  showError(message: string): void {
    this.errorMessage = message;
    this.$message.error(message);
    setTimeout(() => this.clearError(), 5000);
  }

  clearError(): void {
    this.errorMessage = "";
  }

  removeSelectedFile(index?: number): void {
    if (typeof index === "number") {
      // 移除指定索引的文件
      this.selectedFiles.splice(index, 1);
    } else {
      // 兼容性：移除所有文件
      this.selectedFiles = [];
    }

    this.clearError();
  }

  // 上传处理
  async startUpload(): Promise<void> {
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

  // 真实上传到后端 - 支持单文件和多文件
  async simulateUpload(): Promise<void> {
    if (this.selectedFiles.length === 0 || !this.documentId) {
      throw new Error("缺少必要的上传参数");
    }

    try {
      const totalFiles = this.selectedFiles.length;
      let completedFiles = 0;

      console.log("上传参数:", {
        id: this.documentId,
        totalFiles: totalFiles,
        files: this.selectedFiles.map((f) => ({ name: f.name, size: f.size })),
      });

      // 上传进度处理
      this.progressTimer = setInterval(() => {
        // 基础进度：已完成文件的进度 + 当前文件的模拟进度
        const baseProgress = (completedFiles / totalFiles) * 100;
        const currentFileProgress = Math.min(90, this.uploadProgress % 100);
        const totalProgress = Math.min(
          90,
          baseProgress + currentFileProgress / totalFiles
        );
        this.uploadProgress = totalProgress;
      }, 200);

      // 遍历上传所有文件
      for (let i = 0; i < this.selectedFiles.length; i++) {
        const file = this.selectedFiles[i];

        console.log(`正在上传第 ${i + 1}/${totalFiles} 个文件: ${file.name}`);

        // 调用真实的后端接口
        const success: boolean = await this.$roadLawyerService.uploadRuleSource(
          {
            id: this.documentId,
            file: file,
          }
        );

        if (!success) {
          throw new Error(`文件 "${file.name}" 上传失败`);
        }

        completedFiles++;
      }

      this.uploadProgress = 100;

      // 等待一下让用户看到100%进度
      await new Promise((resolve): NodeJS.Timeout => setTimeout(resolve, 500));
    } catch (error) {
      console.error("上传失败:", error);
      throw error;
    } finally {
      // 确保在任何情况下都清理定时器
      if (this.progressTimer) {
        clearInterval(this.progressTimer);
        this.progressTimer = null;
      }
    }
  }

  handleCancel(): void {
    this.resetState();
    this.emitCancel();
  }

  handleComplete(): void {
    this.resetState();
    this.emitComplete();
  }

  resetState(): void {
    // 清理进度定时器
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
      this.progressTimer = null;
    }

    this.selectedFiles = [];
    this.uploading = false;
    this.uploadSuccess = false;
    this.uploadProgress = 0;
    this.clearError();
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k: number = 1024;
    const sizes: string[] = ["B", "KB", "MB", "GB"];
    const i: number = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  @Watch("visible")
  onVisibleChange(newVal: boolean): void {
    if (!newVal) this.resetState();
  }

  // 组件销毁时清理异步任务
  beforeDestroy(): void {
    // 清理进度定时器
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
  }

  // Emit 装饰器方法
  @Emit("upload-success")
  emitUploadSuccess(data: UploadSuccessData): UploadSuccessData {
    return data;
  }

  @Emit("upload-error")
  emitUploadError(data: UploadErrorData): UploadErrorData {
    return data;
  }

  @Emit("cancel")
  emitCancel(): void {
    // 无需返回值
  }

  @Emit("complete")
  emitComplete(): void {
    // 无需返回值
  }
}
</script>

<style lang="less">
@import "~/assets/styles/lawyer.less";

.lawyer-upload-container {
  padding: 16px 0;

  // 自定义 antd Upload 组件样式
  .ant-upload-dragger {
    height: 180px;

    .ant-upload-drag-icon {
      margin-bottom: 16px;

      .anticon {
        font-size: 48px;
        color: #1890ff;
      }
    }

    .ant-upload-text {
      font-size: 16px;
      color: #333;
      margin-bottom: 8px;
      font-weight: 500;
    }

    .ant-upload-hint {
      color: #999;
      font-size: 14px;
    }
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
</style>
