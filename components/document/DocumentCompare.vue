<template>
  <div class="document-compare-wrapper">
    <div class="lawyer-compare-page">
      <header class="lawyer-compare-header">
        <a-button class="lawyer-back-btn" @click="goBack">
          <a-icon type="arrow-left" />
          返回
        </a-button>
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
          <template v-if="document.status === 'pending'">
            <a-button
              v-for="(action, index) in reviewActions"
              :key="index"
              :type="action.type"
              :class="action.class"
              @click="action.handler"
            >
              <a-icon :type="action.icon" />
              {{ action.text }}
            </a-button>
          </template>
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
            <span class="lawyer-version-info" v-if="col.date">{{
              col.date
            }}</span>
          </div>
          <div class="lawyer-column-content">
            <div v-html="col.content"></div>
          </div>
        </div>

        <!-- 修改记录 -->
        <div class="lawyer-changelog-column">
          <div class="lawyer-column-header">审阅内容</div>
          <div class="lawyer-column-content">
            <div class="lawyer-change-summary">
              共有 <strong>{{ document.changes.length }}</strong> 处修改
            </div>

            <div
              v-for="(change, index) in document.changes"
              :key="index"
              class="lawyer-changelog-item"
            >
              <div class="lawyer-change-location">
                第 {{ change.section }} 章 第 {{ change.position }} 条
              </div>
              <div class="lawyer-change-content">
                <div v-if="change.type === 'add'" class="lawyer-content-text">
                  <span class="lawyer-content-label">添加内容：</span>
                  {{ change.newText }}
                </div>
                <div
                  v-else-if="change.type === 'delete'"
                  class="lawyer-content-text"
                >
                  <span class="lawyer-content-label">删除内容：</span>
                  {{ change.oldText }}
                </div>
                <template v-else>
                  <div class="lawyer-content-text">
                    <span class="lawyer-content-label">原内容：</span>
                    {{ change.oldText }}
                  </div>
                  <div class="lawyer-content-text">
                    <span class="lawyer-content-label">修改内容：</span>
                    {{ change.newText }}
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 审核意见弹窗 -->
      <a-modal
        v-model="reviewModalVisible"
        :title="reviewAction === 'approve' ? '通过审核' : '驳回文档'"
        :okText="reviewAction === 'approve' ? '确认通过' : '确认驳回'"
        okType="primary"
        cancelText="取消"
        @ok="submitReview"
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
      <TagEditModal
        :visible="tagEditVisible"
        title="编辑文档分类"
        :current-tags="document.tags || []"
        :current-status="document.status"
        :show-document-status="false"
        :allow-parent-select="true"
        @confirm="handleTagEditConfirm"
        @cancel="handleTagEditCancel"
      />
    </div>
  </div>
</template>

<script lang="ts">
// @ts-nocheck
import { Component, Vue, Prop, Emit } from "nuxt-property-decorator";
import TagEditModal from "@/components/common/TagEditModal.vue";

interface ReviewAction {
  text: string;
  icon: string;
  type: string;
  class: string;
  handler: () => void;
}

interface DocumentColumn {
  title: string;
  version?: string;
  date?: string;
  content: string;
  contentClass: string;
}

@Component({
  components: {
    TagEditModal,
  },
})
export default class DocumentCompare extends Vue {
  @Prop({ required: true }) document: any;

  // 审核相关
  reviewModalVisible = false;
  reviewAction = "";
  reviewComment = "";

  // 标签编辑相关
  tagEditVisible = false;

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
        icon: "check",
        type: "primary",
        class: "lawyer-approve-btn",
        handler: this.showApproveModal,
      },
      {
        text: "驳回",
        icon: "close",
        type: "danger",
        class: "lawyer-reject-btn",
        handler: this.showRejectModal,
      },
    ];
  }

  // 文档列数据
  get documentColumns(): DocumentColumn[] {
    return [
      {
        title: "修改前文档",
        content:
          this.document.originalContent || this.generateLongContent("原始版本"),
        contentClass: "lawyer-original-content",
      },
      {
        title: "修改后文档",
        date: this.document.modifiedDate || "2024-01-15",
        content:
          this.document.newContent || this.generateLongContent("修订版本"),
        contentClass: "lawyer-new-content",
      },
    ];
  }

  // 生成长内容用于测试滚动
  generateLongContent(version: string): string {
    let content = `<h1 class="doc-title">关于保险资金股权投资有关事项的通知</h1>
    <p class="doc-meta">金融监管总局发布 · 2024年1月15日</p>
    
    <div class="doc-toc">
      <h2>目录</h2>
      <ol>
        <li>总则</li>
        <li>投资范围与比例</li>
        <li>投资管理与决策</li>
        <li>风险管理</li>
        <li>信息披露</li>
        <li>监督管理</li>
        <li>法律责任</li>
        <li>附则</li>
      </ol>
    </div>
    
    <h2>第一章 总则</h2>`;

    // 添加多个章节和条款，以确保内容足够长
    for (let i = 1; i <= 8; i++) {
      content += `<h2>第${i}章 ${this.getChapterTitle(i)}</h2>`;

      for (let j = 1; j <= 5; j++) {
        content += `<p class="doc-article"><strong>第${j}条</strong> ${this.getArticleContent(
          i,
          j,
          version
        )}</p>`;
      }
    }

    return content;
  }

  // 获取章节标题
  getChapterTitle(chapter: number): string {
    const titles = [
      "总则",
      "投资范围与比例",
      "投资管理与决策",
      "风险管理",
      "信息披露",
      "监督管理",
      "法律责任",
      "附则",
    ];
    return titles[chapter - 1] || `章节${chapter}`;
  }

  // 获取条款内容
  getArticleContent(chapter: number, article: number, version: string): string {
    const baseContent = `本条是关于${this.getChapterTitle(
      chapter
    )}的第${article}条规定，详细说明了保险资金股权投资的相关要求和规范。保险机构应当建立健全股权投资管理制度，明确决策程序和授权机制，加强投资风险管理，确保资金安全稳健运作。`;

    // 为修订版本添加一些差异
    if (version === "修订版本") {
      return (
        baseContent +
        `（修订后增加内容：保险机构开展股权投资，应当遵循合法合规、价值投资、风险可控和专业化运作的原则，审慎评估投资风险，合理确定投资规模。）`
      );
    }

    return baseContent;
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

  // 显示标签编辑模态框
  showTagEditModal(): void {
    this.tagEditVisible = true;
  }

  // 处理标签编辑确认
  handleTagEditConfirm(data: { tags: string[]; tagDisplay: string }): void {
    // 更新标签
    if (data.tags.length > 0) {
      this.document.tags = [...data.tags];
      this.$message.success(`已设置标签为: ${data.tagDisplay}`);
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
  height: 100vh;
  overflow: hidden;

  .lawyer-compare-page {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--lawyer-background);
    overflow: hidden;
  }

  .lawyer-compare-header {
    background: var(--lawyer-surface);
    padding: 8px 10px;
    border-bottom: 1px solid var(--lawyer-border);
    display: flex;
    align-items: center;
    flex-shrink: 0;
    z-index: 1000;

    .lawyer-header-content {
      margin-left: 24px;
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

  .lawyer-back-btn {
    padding: 8px 16px;
    border-radius: 6px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-weight: 500;
    transition: all 0.2s ease;

    &:hover {
      background: var(--lawyer-border-light);
      color: var(--lawyer-primary-dark);
      border-color: var(--lawyer-primary-light);
    }
  }

  .lawyer-header-actions {
    display: flex;
    gap: 12px;
  }

  .lawyer-approve-btn,
  .lawyer-reject-btn {
    color: white;
  }

  .lawyer-approve-btn {
    background-color: var(--lawyer-success);
    border-color: var(--lawyer-success);

    &:hover {
      background-color: #0f9b6c;
      border-color: #0f9b6c;
    }
  }

  .lawyer-reject-btn {
    background-color: var(--lawyer-danger);
    border-color: var(--lawyer-danger);

    &:hover {
      background-color: #d73737;
      border-color: #d73737;
    }
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
    background-color: #f5f5f5;
    border-bottom: 1px solid var(--lawyer-border-light);
  }

  .lawyer-version-info {
    color: var(--lawyer-text-light);
    font-weight: 400;
  }

  .lawyer-column-content {
    padding: 20px;
    overflow-y: auto;
    flex: 1; // 使用flex占据剩余空间
    min-height: 0; // 允许收缩
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
    padding: 14px 20px;
    background-color: #f9f9f9;
    font-weight: 500;
    border-bottom: 1px solid var(--lawyer-border-light);
    color: var(--lawyer-text);

    strong {
      color: var(--lawyer-primary);
      font-weight: 600;
      margin: 0 4px;
    }
  }

  .lawyer-changelog-item {
    padding: 15px 20px;
    border-bottom: 1px solid var(--lawyer-border-light);
  }

  .lawyer-change-location {
    color: var(--lawyer-primary);
    font-weight: 600;
    font-size: 15px;
    margin-bottom: 10px;
  }

  .lawyer-change-content {
    padding-left: 10px;
  }

  .lawyer-content-text {
    line-height: 1.6;
    margin-bottom: 8px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .lawyer-content-label {
    font-weight: 600;
    color: #333;
    display: inline-block;
    margin-right: 8px;
  }
}
</style>
