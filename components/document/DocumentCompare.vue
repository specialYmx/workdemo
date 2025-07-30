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
          <div
            v-if="document.status === 'pending' && !canReview"
            class="lawyer-version-warning"
          >
            当前版本(V{{ document.newFileVersion || 0 }})高于系统最高版本(V{{
              document.currentMaxFileVersion || 0
            }})，请先更新系统版本
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
            （<span v-if="col.version"> {{ col.version }}- </span>
            <span v-if="col.date"> {{ col.date }} </span>）
          </div>
          <div class="lawyer-column-content">
            <div v-html="formatContentDisplay(col.content)"></div>
          </div>
        </div>

        <!-- 修改记录 -->
        <div class="lawyer-changelog-column">
          <div class="lawyer-column-header">
            审阅内容
            <span class="lawyer-version-compare"
              >（V{{ document.oldFileVersion || "暂无" }} vs V{{
                document.newFileVersion || "暂无"
              }}）</span
            >
          </div>
          <div class="lawyer-column-content">
            <div class="lawyer-change-summary">
              共有 <strong>{{ document.changes.length }}</strong> 处变动
            </div>

            <div v-if="document.changes.length === 0" class="lawyer-no-changes">
              暂无修改记录或正在加载中...
            </div>

            <div
              v-for="(change, index) in document.changes"
              :key="index"
              class="lawyer-changelog-item"
            >
              <div class="lawyer-change-location">
                {{
                  (change.section ? `第${change.section}章` : "") +
                  " " +
                  (change.position || "")
                }}
              </div>
              <div class="lawyer-change-content">
                <div v-if="change.type === 'add'" class="lawyer-content-text">
                  <div>
                    添加内容：<span class="lawyer-content-highlight">{{
                      change.newText
                    }}</span>
                  </div>
                </div>
                <div
                  v-else-if="change.type === 'delete'"
                  class="lawyer-content-text"
                >
                  <div>删除内容：{{ change.oldText }}</div>
                </div>
                <template v-else>
                  <div class="lawyer-content-text">
                    <div>原内容："{{ change.oldText }}"</div>
                    <div>
                      修改为："<span class="lawyer-content-highlight">{{
                        change.newText
                      }}</span
                      >"
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 审核按钮固定在右下角 -->
      <div v-if="document.status === 'pending' && canReview" class="tx-r">
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

      <!-- 审核意见弹窗 -->
      <a-modal
        v-model="reviewModalVisible"
        :title="reviewAction === 'approve' ? '通过审核' : '驳回文档'"
        :okText="reviewAction === 'approve' ? '确认通过' : '确认驳回'"
        okType="primary"
        cancelText="取消"
        @ok="submitReview"
        :getContainer="() => $refs.documentCompareContainer"
      >
        <a-form-item label="审核意见">
          <a-textarea
            v-model="reviewComment"
            :rows="4"
            :placeholder="
              reviewAction === 'approve'
                ? '请输入通过意见（选填）'
                : '请输入驳回原因（必填）'
            "
          />
        </a-form-item>
      </a-modal>

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
// @ts-nocheck
import { Component, Vue, Prop, Emit } from "nuxt-property-decorator";
import { cascaderOptions } from "~/enum/Category";

interface ReviewAction {
  text: string;
  icon: string;
  type: string;
  handler: () => void;
}

interface DocumentColumn {
  title: string;
  version?: string;
  date?: string;
  content: string;
  contentClass: string;
}

@Component({})
export default class DocumentCompare extends Vue {
  @Prop({ required: true }) document: any;

  // 审核相关
  reviewModalVisible = false;
  reviewAction = "";
  reviewComment = "";

  // 标签编辑相关
  tagEditVisible = false;
  tempSelectedTagPath: string[] = [];
  tempEffectDate: string | null = null;

  // 标签选项数据
  tagOptions = cascaderOptions;

  // 显示标签（合并为单个标签）
  get displayTag(): string {
    const tags = this.document.tags || [];
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
        handler: this.showApproveModal,
      },
      {
        text: "驳回",
        type: "danger",
        handler: this.showRejectModal,
      },
    ];
  }

  // 是否允许审核操作
  get canReview(): boolean {
    // 检查文档版本是否允许审核
    const newFileVersion = this.document.newFileVersion || 0;
    const currentMaxFileVersion = this.document.currentMaxFileVersion || 0;
    return newFileVersion <= currentMaxFileVersion;
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
        content: this.document.originalContent || "加载中...",
        contentClass: "lawyer-original-content",
      },
      {
        title: "修改后文档",
        version: this.document.newFileVersion
          ? `V${this.document.newFileVersion}`
          : undefined,
        date: this.document.modifiedDate || this.document.newPublishTime || "",
        content: this.document.newContent || "加载中...",
        contentClass: "lawyer-new-content",
      },
    ];
  }

  // 格式化内容显示，将文本转换为HTML
  formatContentDisplay(content: string): string {
    if (!content) return '<p class="lawyer-empty-content">无内容</p>';
    if (content === "error")
      return '<p class="lawyer-error-content">加载失败，请刷新页面重试</p>';
    if (content.trim() === "")
      return '<p class="lawyer-empty-content">无内容</p>';

    // 如果内容已经包含HTML标签，则直接返回
    if (content.includes("<")) return content;

    // 简单处理：保留原始文本，让CSS处理换行
    return content;

    // 不再使用复杂的HTML转换，因为会破坏原始格式
    // return content
    //   .split('\n')
    //   .map(line => {
    //     // 处理标题
    //     if (line.trim().startsWith('第') && line.trim().includes('章')) {
    //       return `<h2>${line.trim()}</h2>`;
    //     }
    //     // 处理条款
    //     else if (line.trim().startsWith('第') && (line.trim().includes('条') || line.trim().includes('款'))) {
    //       return `<p><strong>${line.substring(0, line.indexOf(' '))}</strong>${line.substring(line.indexOf(' '))}</p>`;
    //     }
    //     // 普通段落
    //     else if (line.trim()) {
    //       return `<p>${line.trim()}</p>`;
    //     }
    //     // 空行也保留，转为<br>标签
    //     else {
    //       return '<br>';
    //     }
    //   })
    //   .join('');
  }

  // 返回上一页
  goBack(): void {
    this.emitGoBack();
  }

  // 显示通过审核弹窗
  showApproveModal(): void {
    this.reviewAction = "approve";
    this.reviewComment = "";
    this.reviewModalVisible = true;
  }

  // 显示驳回审核弹窗
  showRejectModal(): void {
    this.reviewAction = "reject";
    this.reviewComment = "";
    this.reviewModalVisible = true;
  }

  // 提交审核
  submitReview(): void {
    // 检查版本是否允许审核
    if (!this.canReview) {
      this.$message.error("当前版本高于系统最高版本，不允许审核");
      return;
    }

    if (this.reviewAction === "reject" && !this.reviewComment) {
      this.$message.error("驳回时必须填写意见");
      return;
    }

    this.emitSubmitReview({
      action: this.reviewAction,
      comment: this.reviewComment,
    });

    this.reviewModalVisible = false;
  }

  // 查找标签在级联选项中的路径
  findTagPath(tags: string[]): string[] {
    if (!tags || tags.length === 0) return [];

    // 如果有两个标签，尝试匹配父子关系
    if (tags.length >= 2) {
      const [firstTag, secondTag] = tags;
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
    const currentTag = tags[0];

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
    let tagDisplay = "";
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
  emitGoBack() {
    // 无需返回值
  }

  @Emit("submit-review")
  emitSubmitReview(data: { action: string; comment: string }) {
    return data;
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
    padding: 8px 10px;
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
  .lawyer-changelog-column {
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

  .lawyer-changelog-column {
    flex-basis: 300px;
    border-left: 1px solid var(--lawyer-border);
  }

  .lawyer-column-header {
    padding: 12px 20px;
    font-size: 16px;
    font-weight: 600;
    color: #333;
    border-bottom: 1px solid var(--lawyer-border-light);
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

  .lawyer-change-summary {
    white-space: initial;
    background-color: #f9f9f9;
    font-weight: 500;
    border-bottom: 1px solid var(--lawyer-border-light);
    color: var(--lawyer-text);
    font-size: 14px;

    strong {
      color: var(--lawyer-primary);
      font-weight: 600;
      margin: 0 4px;
    }
  }

  .lawyer-no-changes {
    padding: 30px 20px;
    text-align: center;
    color: #999;
    font-style: italic;
  }

  .lawyer-changelog-item {
    border-bottom: 1px solid var(--lawyer-border-light);
  }

  .lawyer-change-location {
    white-space: initial;
    font-weight: 700;
  }

  .lawyer-change-content {
    padding-left: 0;
  }

  .lawyer-content-text {
    line-height: 1.6;
    white-space: initial;
    color: #333;

    div {
      margin-bottom: 4px;
    }
  }

  .lawyer-content-highlight {
    background-color: #fffbe6;
    border-radius: 2px;
    padding: 0 2px;
  }

  .lawyer-version-compare {
    font-size: 14px;
    font-weight: normal;
    color: var(--lawyer-text-light);
    margin-left: 8px;
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
