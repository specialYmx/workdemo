<template>
  <div class="document-compare-wrapper" ref="documentCompareContainer">
    <div class="lawyer-compare-page">
      <header class="lawyer-compare-header">
        <div class="lawyer-header-content">
          <div class="lawyer-title-row">
            <h3>{{ document.title }}</h3>
            <!-- 文档标签区域 -->
            <div class="lawyer-document-tags">
              <a-tag
                v-if="displayTag"
                color="orange"
                @click="showTagEditModal"
                class="lawyer-editable-tag"
              >
                {{ displayTag }}
                <a-icon type="edit" class="lawyer-tag-edit-icon" />
              </a-tag>
              <a-tag
                v-else
                color="orange"
                @click="showTagEditModal"
                class="lawyer-editable-tag lawyer-empty-tag"
              >
                点击设置分类
                <a-icon type="plus" class="lawyer-tag-edit-icon" />
              </a-tag>
            </div>
          </div>
        </div>
        <div class="lawyer-header-actions">
          <div v-if="shouldShowWarning" class="lawyer-version-warning">
            {{ getReviewWarningMessage() }}
          </div>
          <a-button class="lawyer-back-btn" @click="goBack">
            <a-icon type="arrow-left" />
            返回
          </a-button>
        </div>
      </header>

      <div class="lawyer-compare-main-container">
        <!-- 文档列 -->
        <div
          v-for="(col, index) in documentColumns"
          :key="index"
          class="lawyer-document-column"
        >
          <div class="lawyer-column-header">
            {{ col.title }}
            （<span v-if="col.version">{{ col.version }}</span
            ><span v-if="col.version && col.date"> - </span
            ><span v-if="col.date">{{ col.date }}</span
            >）
          </div>
          <div class="lawyer-column-content">
            <v-md-preview :text="formatContentForMarkdown(col.content)" />
          </div>
        </div>

        <!-- 审阅内容 -->
        <div class="review-content-column">
          <div class="lawyer-column-header">
            审阅内容
            <span class="version-info">
              (V{{ Number(document.oldFileVersion || 1) }} vs V{{
                Number(document.newFileVersion || 1)
              }})
            </span>
          </div>

          <div v-if="!hasSpecialInfo" class="review-summary">
            <a-icon type="exclamation-circle" class="summary-icon" />
            共有
            <span class="change-count">{{ document.changes.length }}</span>
            大类变动
          </div>

          <div class="review-content">
            <div v-if="document.changes.length === 0" class="no-changes">
              暂无数据
            </div>

            <div
              v-for="(change, index) in document.changes"
              :key="index"
              class="change-item"
            >
              <!-- 处理特殊信息类型 -->
              <div v-if="change.type === 'info'" class="info-message">
                <a-icon type="info-circle" class="info-icon" />
                <span v-if="change.position === '无旧版文件'">
                  无旧版文档数据
                </span>
                <span v-else-if="change.position === '无新版文件'">
                  无新版文档数据
                </span>
                <span v-else>{{ change.position }}</span>
              </div>

              <!-- 正常变更内容 -->
              <div v-else>
                <div class="change-title">
                  {{ change.sectionDisplay || change.position || "" }}
                </div>

                <div class="change-detail">
                  <div v-if="change.type === 'add'" class="change-text">
                    新增内容：<span class="highlight-text">{{
                      change.newText
                    }}</span>
                  </div>
                  <div v-else-if="change.type === 'delete'" class="change-text">
                    删除了"<span class="deleted-text">{{ change.oldText }}</span
                    >"
                  </div>
                  <div v-else-if="change.type === 'modify'" class="change-text">
                    修改内容：<span class="highlight-text">{{
                      change.newText
                    }}</span
                    >，原内容："{{ change.oldText }}"
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 审核按钮固定在右下角 -->
      <div v-if="shouldShowReviewButtons" class="tx-r">
        <a-button
          class="ml-8"
          v-for="(action, index) in reviewActions"
          :key="index"
          :type="action.type"
          @click="action.handler"
        >
          {{ action.text }}
        </a-button>
      </div>

      <!-- 标签编辑模态框 -->
      <a-modal
        title="编辑文档分类和施行日期"
        :visible="tagEditVisible"
        @ok="handleTagEditConfirm"
        @cancel="handleTagEditCancel"
        :width="600"
        okText="确认"
        cancelText="取消"
        :getContainer="() => $refs.documentCompareContainer"
      >
        <div class="lawyer-tag-edit-content">
          <!-- 标签分类选择 -->
          <div class="lawyer-tag-select-row">
            <label>选择分类</label>
            <a-cascader
              v-model="tempSelectedTagPath"
              :options="tagOptions"
              placeholder="全部分类"
              :show-search="true"
              :change-on-select="true"
              style="width: 300px"
            />
          </div>

          <!-- 施行日期选择 -->
          <div class="lawyer-tag-select-row">
            <label>施行日期</label>
            <a-date-picker
              v-model="tempEffectDate"
              format="YYYY-MM-DD"
              placeholder="请选择施行日期"
              style="width: 300px"
            />
          </div>
        </div>
      </a-modal>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Emit } from "nuxt-property-decorator";
import { cascaderOptions } from "~/enum/Category";
import {
  DocumentCompareData,
  ReviewAction,
  DocumentColumn,
  CascaderOption,
  ReviewSubmitData,
} from "~/model/LawyerModel";

@Component({})
export default class DocumentCompare extends Vue {
  @Prop({ required: true }) document!: DocumentCompareData;

  // 标签编辑相关
  tagEditVisible: boolean = false;
  tempSelectedTagPath: string[] = [];
  tempEffectDate: string | null = null;

  // 标签选项数据
  tagOptions: CascaderOption[] = cascaderOptions;

  // 显示标签（合并为单个标签）
  get displayTag(): string {
    const tags: string[] = this.document.tags || [];
    if (tags.length === 0) return "";
    if (tags.length === 1) return tags[0];
    return `${tags[0]}/${tags[1]}`;
  }

  // 审核操作按钮
  get reviewActions(): ReviewAction[] {
    return [
      {
        text: "通过",
        type: "primary",
        handler: this.handleApprove,
      },
      {
        text: "驳回",
        type: "danger",
        handler: this.handleReject,
      },
    ];
  }

  // 是否显示审核按钮
  get shouldShowReviewButtons(): boolean {
    // 首先检查文档的审核状态是否为'待审核'
    const isPendingStatus =
      this.document.checkStatus === "待审核" ||
      (this.document.checkStatus === undefined &&
        this.document.status === "pending");
    console.log("🚀 ~ DocumentCompare ~ this.document:", this.document);

    // 只有在待审核状态下才进一步检查其他条件
    return isPendingStatus && this.canReview;
  }

  // 是否显示警告信息
  get shouldShowWarning(): boolean {
    // 首先检查文档的审核状态是否为'待审核'
    const isPendingStatus =
      this.document.checkStatus === "待审核" ||
      (this.document.checkStatus === undefined &&
        this.document.status === "pending");

    // 只有在待审核状态下且不能审核时才显示警告
    return isPendingStatus && !this.canReview;
  }

  // 是否有特殊信息（无旧版文件或无新版文件）
  get hasSpecialInfo(): boolean {
    return this.document.changes.some((change) => change.type === "info");
  }

  // 是否允许审核操作
  get canReview(): boolean {
    // 检查文档版本是否允许审核
    const newFileVersion: number = this.document.newFileVersion || 0;
    const currentMaxFileVersion: number =
      this.document.currentMaxFileVersion || 0;

    // 检查文档内容是否加载失败
    const hasContentError = this.documentColumns.some(
      (col) =>
        col.content === "error" || col.content === "加载失败，请刷新页面重试"
    );

    return newFileVersion <= currentMaxFileVersion && !hasContentError;
  }

  // 检查审核状态并显示错误信息
  checkReviewStatusAndShowError(): boolean {
    const newFileVersion: number = this.document.newFileVersion || 0;
    const currentMaxFileVersion: number =
      this.document.currentMaxFileVersion || 0;
    const hasContentError = this.documentColumns.some(
      (col) =>
        col.content === "error" || col.content === "加载失败，请刷新页面重试"
    );

    if (hasContentError) {
      this.$message.error("文档内容加载失败，请刷新页面重试后再进行审核");
      return false;
    } else if (newFileVersion > currentMaxFileVersion) {
      this.$message.error("当前版本高于系统最高版本，不允许审核");
      return false;
    } else if (!this.canReview) {
      this.$message.error("当前状态不允许审核");
      return false;
    }
    return true;
  }

  // 获取审核警告信息
  getReviewWarningMessage(): string {
    const newFileVersion: number = this.document.newFileVersion || 0;
    const currentMaxFileVersion: number =
      this.document.currentMaxFileVersion || 0;
    const hasContentError = this.documentColumns.some(
      (col) =>
        col.content === "error" || col.content === "加载失败，请刷新页面重试"
    );

    if (hasContentError) {
      return "文档内容加载失败，请刷新页面重试";
    } else if (newFileVersion > currentMaxFileVersion) {
      return `当前版本(V${newFileVersion})高于系统最高版本(V${currentMaxFileVersion})，请先更新系统版本`;
    }
    return "当前状态不允许审核";
  }

  // 文档列数据
  get documentColumns(): DocumentColumn[] {
    return [
      {
        title: "修改前文档",
        version: this.document.oldFileVersion
          ? `V${this.document.oldFileVersion}`
          : undefined,
        date: this.document.oldPublishTime || "",
        content: this.document.originalContent || "暂无数据",
        contentClass: "lawyer-original-content",
      },
      {
        title: "修改后文档",
        version: this.document.newFileVersion
          ? `V${this.document.newFileVersion}`
          : undefined,
        date: this.document.modifiedDate || this.document.newPublishTime || "",
        content: this.document.newContent || "暂无数据",
        contentClass: "lawyer-new-content",
      },
    ];
  }

  // 格式化内容
  formatContentForMarkdown(content: string): string {
    if (!content) return "暂无数据";
    if (content === "error") return "加载失败，请刷新页面重试";
    if (content === "加载中...") return "暂无数据";
    if (content.trim() === "") return "暂无数据";

    // 如果内容已经包含HTML标签，先移除HTML标签
    if (content.includes("<")) {
      content = content.replace(/<[^>]*>/g, "");
    }

    // v-md-preview 可以直接处理纯文本，保持原始格式
    return content;
  }

  // 返回上一页
  goBack(): void {
    this.emitGoBack();
  }

  // 处理通过审核
  handleApprove(): void {
    // 检查是否允许审核
    if (!this.checkReviewStatusAndShowError()) {
      return;
    }

    this.$confirm({
      title: "确认通过",
      content: "确定要通过此文档的审核吗？",
      okText: "确认通过",
      cancelText: "取消",
      onOk: () => {
        this.emitSubmitReview({
          action: "approve",
          comment: "",
        });
      },
    });
  }

  // 处理驳回审核
  handleReject(): void {
    // 检查是否允许审核
    if (!this.checkReviewStatusAndShowError()) {
      return;
    }

    this.$confirm({
      title: "确认驳回",
      content: "确定要驳回此文档吗？",
      okText: "确认驳回",
      okType: "danger",
      cancelText: "取消",
      onOk: () => {
        this.emitSubmitReview({
          action: "reject",
          comment: "",
        });
      },
    });
  }

  // 查找标签在级联选项中的路径
  findTagPath(tags: string[]): string[] {
    if (!tags || tags.length === 0) return [];

    // 如果有两个标签，尝试匹配父子关系
    if (tags.length >= 2) {
      const [firstTag, secondTag]: [string, string] = [tags[0], tags[1]];
      for (const option of this.tagOptions) {
        if (option.value === firstTag && option.children) {
          for (const child of option.children) {
            if (child.value === secondTag) {
              return [firstTag, secondTag];
            }
          }
        }
      }
    }

    // 如果只有一个标签或者没有找到匹配的父子关系
    const currentTag: string = tags[0];

    // 先检查是否为一级标签
    for (const option of this.tagOptions) {
      if (option.value === currentTag) {
        return [currentTag];
      }

      // 检查是否为二级标签
      if (option.children) {
        for (const child of option.children) {
          if (child.value === currentTag) {
            return [option.value, currentTag];
          }
        }
      }
    }

    return [];
  }

  // 显示标签编辑模态框
  showTagEditModal(): void {
    this.tempSelectedTagPath = this.findTagPath(this.document.tags || []);
    this.tempEffectDate = this.document.effectDate || null;
    this.tagEditVisible = true;
  }

  // 处理标签编辑确认
  handleTagEditConfirm(): void {
    // 生成显示标签
    let tagDisplay: string = "";
    if (this.tempSelectedTagPath.length === 1) {
      tagDisplay = this.tempSelectedTagPath[0];
    } else if (this.tempSelectedTagPath.length >= 2) {
      tagDisplay = `${this.tempSelectedTagPath[0]}/${this.tempSelectedTagPath[1]}`;
    }

    // 更新标签和施行日期
    this.document.tags = [...this.tempSelectedTagPath];
    this.document.effectDate = this.tempEffectDate;

    if (tagDisplay) {
      this.$message.success(`已设置标签为: ${tagDisplay}`);
    }

    this.tagEditVisible = false;
  }

  // 处理标签编辑取消
  handleTagEditCancel(): void {
    this.tagEditVisible = false;
  }

  // Emit 装饰器方法
  @Emit("go-back")
  emitGoBack(): void {
    // 无需返回值
  }

  @Emit("submit-review")
  emitSubmitReview(data: ReviewSubmitData): ReviewSubmitData & {
    categoryMain?: string;
    categorySub?: string;
    effectDateStr?: string | null;
  } {
    // 从当前文档的标签中获取分类信息
    const categoryMain =
      this.document.tags && this.document.tags.length > 0
        ? this.document.tags[0]
        : undefined;
    const categorySub =
      this.document.tags && this.document.tags.length > 1
        ? this.document.tags[1]
        : undefined;
    const effectDateStr = this.document.effectDate;

    return {
      ...data,
      categoryMain,
      categorySub,
      effectDateStr,
    };
  }
}
</script>

<style lang="less">
.document-compare-wrapper {
  overflow: hidden;
  background: var(--lawyer-background);
  padding: 20px;
  .lawyer-compare-page {
    height: calc(100vh - 110px);
    display: flex;
    flex-direction: column;
    background: var(--lawyer-surface);
    padding: 10px;
    overflow: hidden;
    border-radius: 5px;
  }

  .lawyer-compare-header {
    background: var(--lawyer-surface);
    padding: 4px 10px;
    display: flex;
    align-items: center;
    flex-shrink: 0;
    z-index: 1000;

    .lawyer-header-content {
      margin-right: auto;

      .lawyer-title-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }

      h3 {
        margin: 0;
        font-weight: 600;
        font-size: 18px;
        flex: 1;
        min-width: 0; // 允许标题在必要时收缩
      }
      .lawyer-document-tags {
        display: flex;
        align-items: center;
        gap: 8px;

        .lawyer-editable-tag {
          cursor: pointer;
          transition: all 0.3s;
          font-size: 12px;
          padding: 4px;
          border-radius: 4px;
          display: inline-flex;
          align-items: center;
          gap: 4px;

          &:hover {
            opacity: 0.8;
            transform: translateY(-1px);
          }

          .lawyer-tag-edit-icon {
            font-size: 10px;
            opacity: 0.7;
          }

          &.lawyer-empty-tag {
            border-style: dashed;
            opacity: 0.8;
          }
        }
      }
    }
  }

  .lawyer-header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .lawyer-compare-main-container {
    display: flex;
    padding: 5px;
    gap: 24px;
    flex: 1;
    min-height: 0; // 关键：允许flex子项收缩
    overflow: hidden;
  }

  .lawyer-document-column,
  .review-content-column {
    background: var(--lawyer-surface);
    border: 1px solid var(--lawyer-border);
    border-radius: 8px;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.07);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 0; // 关键：允许flex子项收缩
  }

  .lawyer-document-column {
    flex: 1;
    position: relative;

    &.is-loading::after {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .review-content-column {
    flex-basis: 300px;
    border-left: 1px solid var(--lawyer-border);
  }

  .lawyer-column-header {
    padding: 8px 20px;
    font-size: 16px;
    font-weight: 600;
    border-bottom: 1px solid #d9d9d9;
  }

  .lawyer-column-content {
    padding: 20px;
    overflow-y: auto;
    flex: 1; // 使用flex占据剩余空间
    min-height: 0; // 允许收缩
    white-space: pre-wrap; // 保留换行符
    word-break: break-word; // 长单词换行

    h2,
    h3 {
      color: var(--lawyer-primary);
      font-weight: 600;
      margin-top: 16px;
    }

    h2 {
      font-size: 18px;
      margin-top: 20px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(var(--lawyer-primary-rgb), 0.2);
    }

    h3 {
      font-size: 16px;
    }
  }

  // 通用版本信息样式
  .version-info {
    font-size: 14px;
    color: #666;
    font-weight: normal;
    margin-left: 8px;
  }

  .review-summary {
    padding: 12px 20px;
    background-color: #fff7e6;
    border-bottom: 1px solid #d9d9d9;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #333;
  }

  .summary-icon {
    color: #fa8c16;
    font-size: 16px;
  }

  .change-count {
    color: #fa8c16;
    font-weight: 600;
  }

  .review-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px;
  }

  .no-changes {
    text-align: center;
    color: #999;
    font-style: italic;
    padding: 40px 20px;
  }

  .change-item {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .change-title {
    font-size: 16px;
    font-weight: 600;
    color: #333;
    margin-bottom: 8px;
    line-height: 1.4;
  }

  .change-detail {
    font-size: 14px;
    line-height: 1.6;
  }

  .change-text {
    color: #666;
  }

  .highlight-text {
    background-color: #fff2cc;
    padding: 2px 4px;
    border-radius: 2px;
    color: #333;
    font-weight: 500;
  }

  .deleted-text {
    color: #ff4d4f;
    text-decoration: line-through;
  }

  .info-message {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background-color: #f6ffed;
    border: 1px solid #b7eb8f;
    border-radius: 6px;
    color: #52c41a;
    font-size: 14px;

    .info-icon {
      font-size: 16px;
      color: #52c41a;
    }
  }

  .lawyer-empty-content {
    color: #999;
    font-style: italic;
    padding: 20px;
    text-align: center;
  }

  .lawyer-error-content {
    color: var(--lawyer-danger);
    font-weight: 600;
    padding: 20px;
    text-align: center;
    border: 1px dashed var(--lawyer-danger);
    margin: 20px;
    border-radius: 4px;
  }

  .lawyer-loading-spinner {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }

  .lawyer-version-warning {
    color: var(--lawyer-danger);
    font-size: 12px;
    margin-top: 8px;
  }

  // 标签编辑弹窗样式
  .lawyer-tag-edit-content {
    .lawyer-tag-select-row {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;

      label {
        font-weight: 500;
        color: #333;
        min-width: 80px;
      }
    }
  }
}
</style>
