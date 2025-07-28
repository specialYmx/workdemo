<template>
  <div class="document-viewer-wrapper" ref="documentViewerContainer">
    <div class="lawyer-document-page">
      <!-- 页面头部 -->
      <header
        class="lawyer-document-header lawyer-flex lawyer-justify-between lawyer-items-center"
      >
        <div
          class="lawyer-header-left lawyer-flex lawyer-items-center lawyer-gap-md"
        >
          <div class="lawyer-document-info">
            <!-- 标题和状态标签在同一行，标签紧挨着标题 -->
            <div class="lawyer-title-with-status">
              <h1>{{ document.title }}</h1>
              <a-tag
                :color="document.isRevoke ? 'red' : 'green'"
                @click="showRevokeStatusModal"
                class="lawyer-editable-status lawyer-inline-status"
              >
                {{ document.isRevoke ? "已废止" : "未废止" }}
                <a-icon type="edit" class="lawyer-status-edit-icon" />
              </a-tag>
            </div>

            <div class="lawyer-document-meta lawyer-flex lawyer-gap-lg">
              <span v-for="(item, index) in documentMetaItems" :key="index">
                <a-icon :type="item.icon" /> {{ item.content }}
              </span>
            </div>
          </div>
        </div>

        <div class="lawyer-header-actions lawyer-flex lawyer-gap-sm">
          <a-button class="lawyer-back-btn" @click="goBack">
            <a-icon type="arrow-left" />
            返回
          </a-button>

          <a-button icon="download" @click="downloadDocument"> 下载 </a-button>
        </div>
      </header>

      <!-- 主要内容区 -->
      <div class="lawyer-main-layout lawyer-flex">
        <!-- 文档查看器 -->
        <a-card
          class="lawyer-document-viewer lawyer-chart-card"
          :bordered="false"
        >
          <DivTextSearch>
            <div
              class="lawyer-document-content lawyer-markdown-content lawyer-scrollable"
              ref="documentContent"
              tabindex="0"
            >
              <div v-html="document.content"></div>
            </div>
          </DivTextSearch>
        </a-card>

        <!-- 侧边栏 - AI助手 -->
        <a-card
          class="lawyer-document-sidebar lawyer-chart-card"
          :bordered="false"
        >
          <div class="lawyer-sidebar-section">
            <h3 class="lawyer-section-title">AI助手</h3>

            <!-- 常见问题区域 -->
            <div class="lawyer-ai-chat">
              <div class="lawyer-ai-messages" ref="aiMessages">
                <div class="lawyer-ai-message lawyer-ai-message-system">
                  <div class="lawyer-ai-message-content">
                    <p>
                      您好，我是您的法律AI助手。有关于《{{
                        document.title
                      }}》的任何问题，请随时提问。
                    </p>
                  </div>
                </div>
                <div
                  v-for="(msg, index) in aiMessages"
                  :key="index"
                  :class="[
                    'lawyer-ai-message',
                    msg.isUser
                      ? 'lawyer-ai-message-user'
                      : 'lawyer-ai-message-ai',
                  ]"
                >
                  <div class="lawyer-ai-message-content">
                    <p>{{ msg.content }}</p>
                  </div>
                </div>
              </div>

              <div class="lawyer-ai-input">
                <div class="lawyer-common-questions">
                  <div class="lawyer-question-chips">
                    <a-tag
                      v-for="(question, index) in commonQuestions"
                      :key="index"
                      class="lawyer-question-chip"
                      @click="askCommonQuestion(question)"
                    >
                      {{ question }}
                    </a-tag>
                  </div>
                </div>
                <a-input-search
                  placeholder="向AI提问关于此文档的问题..."
                  v-model="aiQuestion"
                  @search="askAi"
                  enterButton="发送"
                  :loading="aiLoading"
                />
              </div>
            </div>
          </div>
        </a-card>
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
          111
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
// @ts-nocheck
import { Component, Vue, Prop, Watch, Emit } from "nuxt-property-decorator";
import DivTextSearch from "@/components/common/DivTextSearch.vue";

interface TocItem {
  text: string;
  level: number;
}

interface AiMessage {
  content: string;
  isUser: boolean;
}

interface DocumentAction {
  icon: string;
  text?: string;
  handler: () => void;
}

interface MetaItem {
  icon: string;
  content: string;
}

@Component({
  components: {
    DivTextSearch,
  },
})
export default class DocumentViewer extends Vue {
  @Prop({ required: true }) document: any;
  @Prop({ default: () => [] }) relatedDocuments: any[];

  // AI助手相关
  aiQuestion = "";
  aiLoading = false;
  aiMessages: AiMessage[] = [];

  // 废止状态编辑相关
  revokeStatusVisible = false;
  tempIsRevoke = false;

  // 常见问题
  commonQuestions = [
    "这个法规的主要内容是什么？",
    "什么情况下适用该法规？",
    "法规中的关键定义",
    "该法规与其他法律的关系",
    "法规的生效时间",
  ];

  // 文档元数据项
  get documentMetaItems(): MetaItem[] {
    return [
      { icon: "file-text", content: this.document.category },
      { icon: "calendar", content: this.document.date },
      { icon: "number", content: `文号：${this.document.docNumber || "暂无"}` },
      {
        icon: "bank",
        content: `发布机构：${this.document.publisher || "暂无"}`,
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
    const tagColorMap: { [key: string]: string } = {
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

  // 显示废止状态编辑模态框
  showRevokeStatusModal(): void {
    this.tempIsRevoke = this.document.isRevoke || false;
    this.revokeStatusVisible = true;
  }

  // 处理废止状态编辑确认
  handleRevokeStatusConfirm(): void {
    // 更新废止状态
    this.document.isRevoke = this.tempIsRevoke;

    this.$message.success("文档状态更新成功");

    this.revokeStatusVisible = false;
  }

  // 处理废止状态编辑取消
  handleRevokeStatusCancel(): void {
    this.revokeStatusVisible = false;
  }

  // 使选中内容在视图中可见
  makeSelectionVisible(): void {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (range) {
        // 获取选中范围的边界矩形
        const rect = range.getBoundingClientRect();

        // 获取文档容器
        const contentDiv = this.$refs.documentContent;
        if (contentDiv) {
          // 判断选中内容是否在可视区域内
          const containerRect = contentDiv.getBoundingClientRect();

          // 如果选中内容不在可视区域内，滚动到该位置
          if (
            rect.top < containerRect.top ||
            rect.bottom > containerRect.bottom
          ) {
            // 使用scrollIntoView确保元素可见
            range.startContainer.parentElement?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }
        }
      }
    }
  }

  // 获取状态颜色
  getStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      已生效: "green",
      即将生效: "orange",
      废止: "red",
      征求意见中: "blue",
    };
    return colorMap[status] || "default";
  }

  // 下载文档
  downloadDocument(): void {
    this.$message.info(`正在下载: ${this.document.title}`);
    // 实际项目中，这里应该实现下载功能
  }

  // 点击常见问题
  askCommonQuestion(question: string): void {
    this.aiQuestion = question;
    this.askAi(question);
  }

  // 向AI提问
  askAi(question: string): void {
    if (!question) return;

    // 添加用户问题到消息列表
    this.aiMessages.push({
      content: question,
      isUser: true,
    });

    // 清空输入框
    this.aiQuestion = "";

    // 设置加载状态
    this.aiLoading = true;

    // 模拟AI回复延迟
    setTimeout(() => {
      // 根据问题生成AI回复
      let aiResponse = "";

      if (question.includes("主要内容")) {
        aiResponse = `《${this.document.title}》主要包含以下内容：\n1. 总则\n2. 投资范围与比例\n3. 投资管理与决策\n4. 风险管理\n5. 信息披露\n6. 监督管理\n7. 法律责任\n8. 附则`;
      } else if (question.includes("适用")) {
        aiResponse = `该法规适用于在中华人民共和国境内依法设立的保险公司及其保险资产管理公司等保险机构进行的保险资金运用活动。`;
      } else if (question.includes("关键定义")) {
        aiResponse = `本法规中的关键定义包括：\n- 保险资金：指保险公司依法设立的各项责任准备金、资本金、公积金、未分配利润等资金。\n- 投资管理人：指依法取得资格并受托管理保险资金的机构。\n- 托管人：指依法取得资格并接受委托保管保险资金投资资产的机构。`;
      } else if (question.includes("关系")) {
        aiResponse = `《${this.document.title}》与《中华人民共和国保险法》、《中华人民共和国公司法》等法律相互衔接，共同构成保险资金投资管理的法律框架。本法规是对保险资金投资活动的专门规定，在具体适用中应当与上位法保持一致。`;
      } else if (question.includes("生效时间")) {
        aiResponse = `《${this.document.title}》自2024年2月1日起施行。`;
      } else if (question.includes("什么") || question.includes("是什么")) {
        aiResponse = `《${this.document.title}》是规范保险资金股权投资管理的专门法规，旨在加强保险资金运用管理，防范投资风险，保护被保险人利益。该法规由金融监督管理总局制定，于2024年1月15日发布，2024年2月1日生效。`;
      } else {
        aiResponse = `关于您询问的"${question}"，《${this.document.title}》规定了保险资金股权投资应当遵循合法合规、价值投资、风险可控和专业化运作等原则。建议您查阅相关章节了解更详细内容。`;
      }

      // 添加AI回复到消息列表
      this.aiMessages.push({
        content: aiResponse,
        isUser: false,
      });

      // 取消加载状态
      this.aiLoading = false;

      // 滚动到最新消息
      this.$nextTick(() => {
        const aiMessagesEl = this.$refs.aiMessages;
        if (aiMessagesEl) {
          aiMessagesEl.scrollTop = aiMessagesEl.scrollHeight;
        }
      });
    }, 1000);
  }

  // 生命周期钩子
  mounted(): void {
    // 添加滚动监听，可以用于实现阅读进度等功能
    const contentDiv = this.$refs.documentContent;
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
  emitGoBack() {
    // 无需返回值
  }

  @Emit("open-related")
  emitOpenRelated(document: any) {
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
  }

  // 头部样式
  .lawyer-document-header {
    background: var(--lawyer-surface);
    padding: 10px 20px; // 减少上下padding从15px到10px
    border-bottom: 1px solid var(--lawyer-border);
    display: flex;
    justify-content: space-between;
    align-items: center;
    z-index: 100;
  }

  .lawyer-header-left {
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .lawyer-back-btn {
    display: flex;
    align-items: center;
  }

  // 文档信息样式
  .lawyer-document-info {
    h1 {
      font-size: 18px;
      color: var(--lawyer-text);
      margin: 0;
    }
  }

  // 标题和状态标签同行布局
  .lawyer-title-with-status {
    display: flex;
    align-items: baseline;
    gap: 12px;
    margin-bottom: 4px; // 减少底部间距

    h1 {
      margin: 0;
      line-height: 1.2; // 减少行高
    }

    .lawyer-inline-status {
      flex-shrink: 0;
      font-size: 11px; // 稍微小一点的字体
      padding: 2px 6px; // 减少内边距
      margin-left: 4px; // 紧挨着标题
    }

    // 响应式：小屏幕时保持同行
    @media (max-width: 768px) {
      flex-wrap: wrap;
      gap: 8px;
    }
  }

  // 文档标签样式
  .lawyer-document-status {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    flex-wrap: wrap;

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

  .lawyer-edit-tag-btn {
    font-size: 12px;
    height: 24px;
    padding: 0 8px;
    border-color: #d9d9d9;
    color: var(--lawyer-text-light);

    &:hover {
      border-color: var(--lawyer-primary);
      color: var(--lawyer-primary);
    }
  }

  .lawyer-document-meta {
    font-size: 13px;
    color: var(--lawyer-text-light);
    display: flex;
    gap: 20px;
    margin-top: 6px; // 减少上边距

    .anticon {
      margin-right: 5px;
    }
  }

  .lawyer-header-actions {
    display: flex;
    gap: 8px;
  }

  // 主布局
  .lawyer-main-layout {
    display: flex;
    flex: 1;
    overflow: hidden;
    padding: 16px;
    gap: 16px;
  }

  // 文档查看器
  .lawyer-document-viewer {
    flex: 1;
    background: var(--lawyer-surface);
    display: flex;
    flex-direction: column;
    height: 100%;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .lawyer-document-content {
    flex: 1;
    padding: 20px 24px; // 减少padding：上下20px，左右24px
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

  // 侧边栏样式
  .lawyer-document-sidebar {
    width: 400px;
    background: var(--lawyer-surface);
    padding: 20px;
    height: 100%;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    overflow-y: auto;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .lawyer-sidebar-section {
    margin-bottom: 20px;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
  }

  .lawyer-section-title {
    font-size: 16px;
    font-weight: 500;
    color: var(--lawyer-text);
    margin-bottom: 15px;
    position: relative;

    &::after {
      content: "";
      position: absolute;
      bottom: -5px;
      left: 0;
      width: 40px;
      height: 2px;
      background-color: var(--lawyer-primary);
    }
  }

  // AI助手样式
  .lawyer-ai-chat {
    display: flex;
    flex-direction: column;
    flex: 1;
    background: var(--lawyer-surface);
    border: 1px solid var(--lawyer-border);
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
    height: calc(100% - 40px);
  }

  .lawyer-common-questions {
    margin-bottom: 15px;
  }

  .lawyer-question-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 15px;
  }

  .lawyer-ai-messages {
    flex: 1;
    padding: 15px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 15px;
    background-color: #fcfcfc;
  }

  .lawyer-ai-message {
    max-width: 85%;
    padding: 12px 15px;
    border-radius: 10px;
    position: relative;
    line-height: 1.6;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

    &-system {
      background-color: rgba(var(--lawyer-primary-rgb), 0.05);
      border: 1px solid rgba(var(--lawyer-primary-rgb), 0.1);
      align-self: center;
      max-width: 95%;
      margin-bottom: 8px;
    }

    &-user {
      background-color: rgba(var(--lawyer-primary-rgb), 0.1);
      color: var(--lawyer-text);
      align-self: flex-end;
      border-bottom-right-radius: 4px;
    }

    &-ai {
      background-color: #f0f2f5;
      color: var(--lawyer-text);
      align-self: flex-start;
      white-space: pre-line;
      border-bottom-left-radius: 4px;
    }
  }

  .lawyer-ai-input {
    padding: 15px;
    border-top: 1px solid var(--lawyer-border);
    background-color: #fff;
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
    color: red;
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
