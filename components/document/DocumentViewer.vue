<template>
  <div class="document-viewer-wrapper" ref="documentViewerContainer">
    <div class="lawyer-document-page">
      <!-- 主要内容区 -->
      <div class="lawyer-main-layout">
        <!-- 左侧：文档查看器 -->
        <div class="lawyer-document-left">
          <a-card
            class="lawyer-document-viewer lawyer-chart-card"
            :bordered="false"
          >
            <!-- 文档头部信息 -->
            <div class="lawyer-document-header">
              <div class="lawyer-header-row">
                <div class="lawyer-document-info">
                  <!-- 标题和状态标签 -->
                  <div class="lawyer-title-with-status">
                    <h1>{{ document.title }}</h1>
                    <a-tag
                      :color="document.isRevoke ? 'red' : 'green'"
                      @click="handleStatusTagClick"
                      :class="[
                        'lawyer-editable-status',
                        'lawyer-inline-status',
                        { 'lawyer-status-disabled': document.isRevoke },
                      ]"
                    >
                      {{ document.timeLiness || "未知" }}
                      <a-icon
                        v-if="!document.isRevoke"
                        type="edit"
                        class="lawyer-status-edit-icon"
                      />
                    </a-tag>
                  </div>

                  <!-- 文档元数据 -->
                  <div class="lawyer-document-meta">
                    <span
                      v-for="(item, index) in documentMetaItems"
                      :key="index"
                    >
                      <a-icon :type="item.icon" /> {{ item.content }}
                    </span>
                  </div>
                </div>

                <div class="lawyer-header-actions">
                  <a-button class="lawyer-back-btn" @click="goBack">
                    <a-icon type="arrow-left" />
                    返回
                  </a-button>
                  <a-button type="primary" @click="downloadDocument">
                    下载
                  </a-button>
                </div>
              </div>
            </div>

            <!-- 文档内容 -->
            <DivTextSearch>
              <div
                class="lawyer-document-content lawyer-scrollable"
                ref="documentContent"
                tabindex="0"
              >
                <div v-html="document.content"></div>
              </div>
            </DivTextSearch>
          </a-card>
        </div>

        <!-- 右侧：文档智能问答 -->
        <div class="lawyer-document-right">
          <DocumentAIChat :document="document" />
        </div>
      </div>

      <!-- 废止状态编辑模态框 -->
      <a-modal
        title="编辑文档状态"
        :visible="revokeStatusVisible"
        @ok="handleRevokeStatusConfirm"
        @cancel="handleRevokeStatusCancel"
        :width="400"
        okText="确认"
        cancelText="取消"
        :getContainer="() => $refs.documentViewerContainer"
      >
        <div class="lawyer-revoke-status-content">
          <div class="lawyer-status-row">
            <label>文档状态</label>
            <div class="lawyer-status-switch-container">
              <a-switch
                v-model="tempIsRevoke"
                :checked-children="'已废止'"
                :un-checked-children="'未废止'"
                size="default"
              />
              <span class="lawyer-status-text">
                {{ tempIsRevoke ? "已废止" : "未废止" }}
              </span>
            </div>
          </div>

          <!-- 废止说明 -->
          <div class="lawyer-status-description">
            <p v-if="tempIsRevoke" class="lawyer-revoke-tip">
              <a-icon
                type="exclamation-circle"
                style="color: #ff4d4f; margin-right: 8px"
              />
              设置为已废止后，该文档将标记为无效状态
            </p>
            <p v-else class="lawyer-active-tip">
              <a-icon
                type="check-circle"
                style="color: #52c41a; margin-right: 8px"
              />
              文档当前为有效状态
            </p>
          </div>
        </div>
      </a-modal>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch, Emit } from "nuxt-property-decorator";
import DivTextSearch from "@/components/common/DivTextSearch.vue";
import DocumentAIChat from "@/components/common/DocumentAIChat.vue";
import { downloadFileWithMessage } from "~/utils/personal";
import {
  DocumentViewerData,
  RelatedDocumentItem,
  DocumentMetaItem,
  TagColorMap,
  StatusColorMap,
} from "~/model/LawyerModel";

@Component({
  components: {
    DivTextSearch,
    DocumentAIChat,
  },
})
export default class DocumentViewer extends Vue {
  @Prop({ required: true }) document!: DocumentViewerData;
  @Prop({ default: () => [] }) relatedDocuments!: RelatedDocumentItem[];

  // 废止状态编辑相关
  revokeStatusVisible: boolean = false;
  tempIsRevoke: boolean = false;

  // 文档元数据项
  get documentMetaItems(): DocumentMetaItem[] {
    return [
      {
        icon: "number",
        content: `文号：${this.document.fileNumber || "暂无"}`,
      },
      {
        icon: "bank",
        content: `发布机构：${this.document.publisher || "暂无"}`,
      },
      {
        icon: "calendar",
        content: `发布日期：${this.document.date || "暂无"}`,
      },
      {
        icon: "clock-circle",
        content: `生效日期：${this.document.effectiveDate || "暂无"}`,
      },
    ];
  }

  // 返回上一页
  goBack(): void {
    this.emitGoBack();
  }

  // 获取标签样式类
  getTagClass(tag: string): string {
    const tagColorMap: TagColorMap = {
      个人信息: "lawyer-tag-important",
      数据安全: "lawyer-tag-fund",
      隐私保护: "lawyer-tag-opinion",
      跨境数据: "lawyer-tag-solvency",
      公司治理: "lawyer-tag-governance",
      董事会管理: "lawyer-tag-supervision",
      监事会管理: "lawyer-tag-association",
      高管管理: "lawyer-tag-compliance",
      重要管理: "lawyer-tag-important",
      合规: "lawyer-tag-compliance",
      风控: "lawyer-tag-risk",
      保险产品: "lawyer-tag-fund",
      理财产品: "lawyer-tag-alternative",
      投资产品: "lawyer-tag-related",
    };
    return tagColorMap[tag] || "lawyer-tag-default";
  }

  // 处理状态标签点击
  handleStatusTagClick(): void {
    // 只有非已废止状态的文档才能点击
    if (!this.document.isRevoke) {
      this.showRevokeStatusModal();
    }
  }

  // 显示废止状态编辑模态框
  showRevokeStatusModal(): void {
    // 初始状态为false，让用户选择是否要将状态改为已废止
    this.tempIsRevoke = false;
    this.revokeStatusVisible = true;
  }

  // 处理废止状态编辑确认
  async handleRevokeStatusConfirm(): Promise<void> {
    try {
      // 如果用户打开了已废止开关，才调用接口
      if (this.tempIsRevoke) {
        this.$message.loading("正在更新文档状态...", 0);

        await this.$roadLawyerService.getRuleSourceDetail({
          searchId: this.document.id,
          isRevoke: true,
        });

        this.$message.destroy();

        // 更新为已废止状态
        this.document.isRevoke = true;
        this.document.timeLiness = "已废止";

        this.$message.success(`文档状态已更新为：已废止`);
      } else {
        // 用户关闭了开关，不调用接口，保持原状态
        this.$message.success("已取消状态修改");
      }

      this.revokeStatusVisible = false;
    } catch (error) {
      this.$message.destroy();
      console.error("更新文档状态失败:", error);
      this.$message.error("更新文档状态失败，请重试");
    }
  }

  // 处理废止状态编辑取消
  handleRevokeStatusCancel(): void {
    this.revokeStatusVisible = false;
  }

  // 使选中内容在视图中可见
  makeSelectionVisible(): void {
    const selection: Selection | null = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range: Range = selection.getRangeAt(0);
      if (range) {
        // 获取选中范围的边界矩形
        const rect: DOMRect = range.getBoundingClientRect();

        // 获取文档容器
        const contentDiv = this.$refs.documentContent as HTMLElement;
        if (contentDiv) {
          // 判断选中内容是否在可视区域内
          const containerRect: DOMRect = contentDiv.getBoundingClientRect();

          // 如果选中内容不在可视区域内，滚动到该位置
          if (
            rect.top < containerRect.top ||
            rect.bottom > containerRect.bottom
          ) {
            // 使用scrollIntoView确保元素可见
            const parentElement = range.startContainer.parentElement;
            if (parentElement) {
              parentElement.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
            }
          }
        }
      }
    }
  }

  // 获取状态颜色
  getStatusColor(status: string): string {
    const colorMap: StatusColorMap = {
      已生效: "green",
      即将生效: "orange",
      废止: "red",
      征求意见中: "blue",
    };
    return colorMap[status] || "default";
  }

  // 下载文档
  async downloadDocument(): Promise<void> {
    try {
      this.$message.loading(`正在准备下载: ${this.document.title}`, 0);

      const result = await this.$roadLawyerService.downloadRuleFile({
        id: this.document.id,
      });

      this.$message.destroy();

      if (result) {
        downloadFileWithMessage(result, {
          fileName: `${this.document.title}.pdf`,
          showMessage: true,
          messageService: this.$message,
        });
      }
    } catch (error) {
      this.$message.destroy();
      console.error("下载失败:", error);
      this.$message.error("下载失败，请检查网络连接后重试");
    }
  }

  // 生命周期钩子
  mounted(): void {
    // 添加滚动监听，可以用于实现阅读进度等功能
    const contentDiv = this.$refs.documentContent as HTMLElement;
    if (contentDiv) {
      contentDiv.addEventListener("scroll", this.handleScroll);
    }

    // 添加键盘快捷键支持
    window.addEventListener("keydown", this.handleKeyDown);
  }

  // 处理滚动事件
  handleScroll(): void {
    // 实际项目中，这里可以实现阅读进度跟踪等功能
  }

  // 处理键盘事件
  handleKeyDown(event: KeyboardEvent): void {
    // 键盘事件处理（搜索功能已移至 DivTextSearch 组件）
  }

  // 组件销毁前清理
  beforeDestroy(): void {
    const contentDiv = this.$refs.documentContent as HTMLElement;
    if (contentDiv) {
      contentDiv.removeEventListener("scroll", this.handleScroll);
    }
    window.removeEventListener("keydown", this.handleKeyDown);
  }

  // Emit 装饰器方法
  @Emit("go-back")
  emitGoBack(): void {
    // 无需返回值
  }

  @Emit("open-related")
  emitOpenRelated(document: RelatedDocumentItem): RelatedDocumentItem {
    return document;
  }
}
</script>

<style lang="less">
.document-viewer-wrapper {
  // 基础布局
  .lawyer-document-page {
    height: calc(100vh - 70px);
    display: flex;
    flex-direction: column;
    background-color: var(--lawyer-background);
    padding: 16px;
  }

  // 标题和状态标签同行布局
  .lawyer-title-with-status {
    display: flex;
    align-items: baseline;
    gap: 12px;
    margin-bottom: 8px;

    h1 {
      margin: 0;
      line-height: 1.2;
      font-size: 18px;
      color: var(--lawyer-text);
    }

    .lawyer-inline-status {
      flex-shrink: 0;
      font-size: 11px;
      padding: 2px 6px;
      margin-left: 4px;
    }

    // 响应式：小屏幕时保持同行
    @media (max-width: 768px) {
      flex-wrap: wrap;
      gap: 8px;
    }
  }

  // 可编辑状态标签样式
  .lawyer-editable-status {
    cursor: pointer;
    transition: all 0.3s;
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 4px;
    display: inline-flex;
    align-items: center;
    gap: 4px;

    &:hover {
      opacity: 0.8;
      transform: translateY(-1px);
    }

    .lawyer-status-edit-icon {
      font-size: 10px;
      opacity: 0.7;
    }

    // 禁用状态样式
    &.lawyer-status-disabled {
      cursor: not-allowed;
      opacity: 0.6;

      &:hover {
        opacity: 0.6;
        transform: none;
      }
    }
  }

  .lawyer-doc-tag {
    display: inline-block;
    padding: 4px 12px;
    border: 1px solid #ddd;
    border-radius: 3px;
    background-color: #fff;
    color: var(--lawyer-text-light);
    font-size: 12px;
    font-weight: 400;
    line-height: 1.2;
    white-space: nowrap;

    // 重要法规 - 红色
    &.lawyer-tag-important {
      border-color: #ff4d4f;
      color: #ff4d4f;
      background-color: rgba(255, 77, 79, 0.1);
    }

    // 资金运用 - 橙色
    &.lawyer-tag-fund {
      border-color: #fa8c16;
      color: #fa8c16;
      background-color: rgba(250, 140, 22, 0.1);
    }

    // 征求意见 - 蓝色
    &.lawyer-tag-opinion {
      border-color: #1890ff;
      color: #1890ff;
      background-color: rgba(24, 144, 255, 0.1);
    }

    // 主要标签 - 金色（类似原型图）
    &.lawyer-tag-primary {
      border-color: #ffd666;
      color: #d48806;
      background-color: #fff7e6;
      font-weight: 500;
    }

    // 偿付能力 - 紫色
    &.lawyer-tag-solvency {
      border-color: #722ed1;
      color: #722ed1;
      background-color: rgba(114, 46, 209, 0.1);
    }

    // 风险提示 - 红色
    &.lawyer-tag-risk {
      border-color: #ff4d4f;
      color: #ff4d4f;
      background-color: rgba(255, 77, 79, 0.1);
    }

    // 另类投资 - 青色
    &.lawyer-tag-alternative {
      border-color: #13c2c2;
      color: #13c2c2;
      background-color: rgba(19, 194, 194, 0.1);
    }

    // 机构监管 - 绿色
    &.lawyer-tag-supervision {
      border-color: #52c41a;
      color: #52c41a;
      background-color: rgba(82, 196, 26, 0.1);
    }

    // 公司治理 - 橙色
    &.lawyer-tag-governance {
      border-color: #fa8c16;
      color: #fa8c16;
      background-color: rgba(250, 140, 22, 0.1);
    }

    // 行业协会 - 蓝色
    &.lawyer-tag-association {
      border-color: #1890ff;
      color: #1890ff;
      background-color: rgba(24, 144, 255, 0.1);
    }

    // 风控合规 - 紫色
    &.lawyer-tag-compliance {
      border-color: #722ed1;
      color: #722ed1;
      background-color: rgba(114, 46, 209, 0.1);
    }

    // 关联交易 - 青色
    &.lawyer-tag-related {
      border-color: #13c2c2;
      color: #13c2c2;
      background-color: rgba(19, 194, 194, 0.1);
    }

    // 默认样式
    &.lawyer-tag-default {
      border-color: #d9d9d9;
      color: #595959;
      background-color: rgba(217, 217, 217, 0.1);
    }
  }

  .lawyer-document-meta {
    font-size: 13px;
    color: var(--lawyer-text-light);
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    margin-top: 6px;
    @media (max-width: 768px) {
      gap: 12px;
      font-size: 12px;
    }
  }

  // 主布局
  .lawyer-main-layout {
    display: flex;
    flex: 1;
    overflow: hidden;
    gap: 16px;

    // 响应式布局
    @media (max-width: 1200px) {
      flex-direction: column;
      gap: 12px;
    }
  }

  // 左侧文档区域
  .lawyer-document-left {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0; // 防止flex子项溢出

    @media (max-width: 1200px) {
      height: 60vh; // 小屏幕时限制高度
    }
  }

  // 右侧AI问答区域
  .lawyer-document-right {
    width: 400px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;

    @media (max-width: 1200px) {
      width: 100%;
      min-height: 500px; // 确保足够的最小高度
      height: auto; // 改为自适应高度
    }
  }

  // 文档查看器
  .lawyer-document-viewer {
    flex: 1;
    background: var(--lawyer-surface);
    display: flex;
    flex-direction: column;
    height: 100%;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

    .ant-card-body {
      padding: 0;
      display: flex;
      flex-direction: column;
      height: 100%;
    }
  }

  // 文档头部（在卡片内）
  .lawyer-document-header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--lawyer-border);
    background: var(--lawyer-surface);

    .lawyer-header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;

      .lawyer-header-actions {
        display: flex;
        gap: 8px;
        flex-shrink: 0;
        align-self: flex-start;

        .lawyer-back-btn {
          display: flex;
          align-items: center;
        }
      }
    }

    // 响应式布局
    @media (max-width: 768px) {
      .lawyer-header-row {
        flex-direction: column;
        gap: 12px;

        .lawyer-header-actions {
          align-self: flex-end;
        }
      }
    }
  }

  // 文档信息样式
  .lawyer-document-info {
    h1 {
      font-size: 18px;
      color: var(--lawyer-text);
      margin: 0;
    }
  }

  .lawyer-document-content {
    flex: 1;
    padding: 20px 24px;
    overflow-y: auto;
    height: 100%;
  }

  // 文档内容样式
  :deep(.lawyer-document-content) {
    h1.doc-title {
      font-size: 22px;
      text-align: center;
      margin-bottom: 16px;
      font-weight: 600;
    }

    p.doc-meta {
      text-align: center;
      color: var(--lawyer-text-light);
      margin-bottom: 30px;
    }

    .doc-toc {
      background: var(--lawyer-border-light);
      padding: 24px;
      border-radius: 8px;
      margin-bottom: 30px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

      h2 {
        margin-top: 0;
        margin-bottom: 12px;
        font-size: 18px;
      }
    }

    h2 {
      margin-top: 26px;
      margin-bottom: 18px;
      font-size: 20px;
      color: #333;
      border-bottom: 2px solid var(--lawyer-primary);
      padding-bottom: 10px;
    }

    p.doc-article {
      margin-bottom: 18px;
      text-indent: 28px;
      line-height: 26px;
      color: #333;
      letter-spacing: 0.3px;
    }

    /* 给条款编号添加颜色 */
    .doc-article strong:first-child {
      color: var(--lawyer-primary);
      font-weight: 600;
    }

    strong {
      font-weight: 600;
      color: #222;
    }

    /* 搜索结果高亮样式 */
    ::selection {
      background-color: rgba(var(--lawyer-primary-rgb), 0.3);
      color: var(--lawyer-text-dark);
    }
  }

  // 标签编辑模态框样式
  .lawyer-tag-edit-content {
    padding: 20px 0;
  }

  .lawyer-tag-select-row {
    display: flex;
    align-items: center;
    gap: 16px;

    label {
      font-weight: 500;
      color: var(--lawyer-text);
      min-width: 80px;
    }
  }

  // 废止状态编辑弹窗样式
  .lawyer-revoke-status-content {
    .lawyer-status-row {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;

      label {
        font-weight: 500;
        color: #333;
        min-width: 80px;
      }

      .lawyer-status-switch-container {
        display: flex;
        align-items: center;
        gap: 12px;

        .lawyer-status-text {
          font-size: 14px;
          color: #666;
          font-weight: 500;
        }
      }
    }

    .lawyer-status-description {
      padding: 12px;
      background-color: #fafafa;
      border-radius: 6px;
      border: 1px solid #f0f0f0;

      .lawyer-revoke-tip,
      .lawyer-active-tip {
        margin: 0;
        font-size: 13px;
        display: flex;
        align-items: center;
      }

      .lawyer-revoke-tip {
        color: #ff4d4f;
      }

      .lawyer-active-tip {
        color: #52c41a;
      }
    }
  }
}
</style>
