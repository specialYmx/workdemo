<template>
  <div class="lawyer-document-page">
    <!-- 页面头部 -->
    <header
      class="lawyer-document-header lawyer-flex lawyer-justify-between lawyer-items-center"
    >
      <div
        class="lawyer-header-left lawyer-flex lawyer-items-center lawyer-gap-md"
      >
        <a-button class="lawyer-back-btn" @click="goBack">
          <a-icon type="arrow-left" />
          返回
        </a-button>

        <div class="lawyer-document-info">
          <h1>{{ document.title }}</h1>
          <div class="lawyer-document-meta lawyer-flex lawyer-gap-lg">
            <span v-for="(item, index) in documentMetaItems" :key="index">
              <a-icon :type="item.icon" /> {{ item.content }}
            </span>
          </div>
        </div>
      </div>

      <div class="lawyer-header-actions lawyer-flex lawyer-gap-sm">
        <!-- 目录按钮 -->
        <a-popover
          placement="bottomRight"
          trigger="click"
          v-model="tocVisible"
          :overlayClassName="'lawyer-toc-popover'"
        >
          <template slot="content">
            <div class="lawyer-toc-container">
              <h3>文档目录</h3>
              <div class="lawyer-toc-list">
                <a
                  v-for="(item, index) in tocItems"
                  :key="index"
                  href="javascript:void(0)"
                  class="lawyer-toc-item"
                  @click="scrollToHeading(item.text)"
                  :style="{ paddingLeft: `${item.level * 12}px` }"
                >
                  {{ item.text }}
                </a>
              </div>
            </div>
          </template>
          <a-button icon="bars">目录</a-button>
        </a-popover>

        <a-button
          v-for="(action, index) in documentActions"
          :key="index"
          :icon="action.icon"
          @click="action.handler"
        >
          {{ action.text }}
        </a-button>
      </div>
    </header>

    <!-- 主要内容区 -->
    <div class="lawyer-main-layout lawyer-flex">
      <!-- 文档查看器 -->
      <div class="lawyer-document-viewer">
        <div
          class="lawyer-viewer-toolbar lawyer-flex lawyer-justify-between lawyer-items-center lawyer-sticky-toolbar"
        >
          <div
            class="lawyer-toolbar-left lawyer-flex lawyer-items-center lawyer-gap-sm"
          >
            <a-input-search
              placeholder="搜索文档内容"
              style="width: 250px"
              v-model="searchText"
              @search="searchInDocument"
            />
            <span v-if="searchMatchCount > 0" class="lawyer-search-count">
              {{ searchCurrentMatch }}/{{ searchMatchCount }}
            </span>
          </div>

          <div
            class="lawyer-toolbar-right lawyer-flex lawyer-items-center lawyer-gap-sm"
          >
            <div
              class="lawyer-zoom-controls lawyer-flex lawyer-items-center lawyer-gap-sm"
            >
              <a-button class="lawyer-zoom-btn" @click="zoomOut">
                <a-icon type="minus" />
              </a-button>
              <span class="lawyer-zoom-level">{{ zoomLevel }}%</span>
              <a-button class="lawyer-zoom-btn" @click="zoomIn">
                <a-icon type="plus" />
              </a-button>
            </div>
          </div>
        </div>

        <div
          class="lawyer-document-content lawyer-markdown-content lawyer-scrollable"
          :style="{ fontSize: `${(zoomLevel / 100) * 16}px` }"
          ref="documentContent"
        >
          <div v-html="document.content"></div>
        </div>
      </div>

      <!-- 侧边栏 - AI助手 -->
      <div class="lawyer-document-sidebar">
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
      </div>
    </div>
  </div>
</template>

<script lang="ts">
// @ts-nocheck
import { Component, Vue, Prop } from "nuxt-property-decorator";

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

@Component
export default class DocumentViewer extends Vue {
  @Prop({ required: true }) document: any;
  @Prop({ default: () => [] }) relatedDocuments: any[];

  // 搜索和缩放
  searchText = "";
  zoomLevel = 100;
  currentSearchQuery = ""; // 当前搜索的文本
  searchStartPosition = true; // 是否从文档开头开始搜索
  searchMatchCount = 0; // 匹配计数
  searchCurrentMatch = 0; // 当前匹配索引

  // 目录相关
  tocItems: TocItem[] = [];
  tocVisible = false;

  // AI助手相关
  aiQuestion = "";
  aiLoading = false;
  aiMessages: AiMessage[] = [];

  // 常见问题
  commonQuestions = [
    "这个法规的主要内容是什么？",
    "什么情况下适用该法规？",
    "法规中的关键定义",
    "该法规与其他法律的关系",
    "法规的生效时间",
  ];

  // 文档操作按钮
  get documentActions(): DocumentAction[] {
    return [
      {
        icon: "printer",
        text: "打印",
        handler: this.printDocument,
      },
      {
        icon: "download",
        text: "下载",
        handler: this.downloadDocument,
      },
    ];
  }

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
    this.$emit("go-back");
  }

  // 放大
  zoomIn(): void {
    if (this.zoomLevel < 200) {
      this.zoomLevel += 10;
    }
  }

  // 缩小
  zoomOut(): void {
    if (this.zoomLevel > 70) {
      this.zoomLevel -= 10;
    }
  }

  // 文档内搜索
  searchInDocument(value: string): void {
    if (!value) return;
    // 如果是新的搜索词或重置过搜索状态，重置搜索位置
    if (this.currentSearchQuery !== value) {
      this.currentSearchQuery = value;
      this.searchStartPosition = true;
      this.searchMatchCount = 0;
      this.searchCurrentMatch = 0;
    }

    // 获取文档内容区域
    const documentContentEl = this.$refs.documentContent;
    if (!documentContentEl) return;

    // 首先确保文档区域在视口中可见并且聚焦
    documentContentEl.scrollIntoView({ block: "nearest" });
    documentContentEl.focus();

    // 使用浏览器内置的查找功能，限定搜索范围在文档内容区域
    // 由于window.find不能完全限制搜索范围，我们需要监控搜索结果是否在文档内容区域内
    const found = window.find(
      value, // 搜索词
      false, // 不区分大小写
      false, // 不反向搜索
      true, // 循环搜索
      false, // 不限制搜索范围
      false, // 不匹配整个单词
      false // 不匹配大小写
    );

    // 如果找到了，检查选中内容是否在文档内容区域内
    if (found) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        // 检查选中区域是否在文档内容区域内
        if (!this.isSelectionInDocumentContent(range, documentContentEl)) {
          // 如果不在，继续搜索下一个匹配项
          return this.searchInDocument(value);
        }
      }
    }

    // 如果未找到或是第一次搜索
    if (!found && this.searchStartPosition) {
      // 表示真的没找到
      this.$message.warning(`未找到匹配内容: ${value}`);
      return;
    }

    // 如果未找到但不是第一次搜索，说明已经搜索到文档末尾，从头继续
    if (!found) {
      // 从头开始搜索
      this.searchStartPosition = true;
      // 重新执行搜索
      window.getSelection()?.removeAllRanges(); // 清除当前选择

      // 滚动到文档内容顶部
      if (documentContentEl) {
        documentContentEl.scrollTop = 0;
      }

      // 重新调用搜索但显示已回到开头的消息
      this.$message.info("搜索已回到文档开头");
      setTimeout(() => this.searchInDocument(value), 100);
      return;
    }

    // 找到了匹配项
    this.searchStartPosition = false;
    this.searchCurrentMatch++;

    // 如果是第一次找到匹配项，计算总匹配数
    if (this.searchMatchCount === 0) {
      this.calculateTotalMatches(value);
    }

    // 获取当前选中（高亮）的内容
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

    // 显示当前匹配索引
    if (this.searchMatchCount > 0) {
      if (this.searchCurrentMatch > this.searchMatchCount) {
        this.searchCurrentMatch = 1;
      }
    }
  }

  // 检查选中区域是否在文档内容区域内
  isSelectionInDocumentContent(
    range: Range,
    documentContentEl: HTMLElement
  ): boolean {
    // 检查range的公共祖先元素是否是文档内容区域的子元素
    let containerEl = range.commonAncestorContainer;

    // 如果containerEl是文本节点，获取其父元素
    if (containerEl.nodeType === Node.TEXT_NODE) {
      containerEl = containerEl.parentElement;
    }

    // 检查containerEl是否是documentContentEl的子元素
    return documentContentEl.contains(containerEl);
  }

  // 计算总匹配数
  calculateTotalMatches(value: string): void {
    if (!value) return;

    // 获取文档内容区域
    const documentContentEl = this.$refs.documentContent;
    if (!documentContentEl) return;

    // 保存当前选区
    const savedSelection = window.getSelection();
    let savedRange = null;
    if (savedSelection && savedSelection.rangeCount > 0) {
      savedRange = savedSelection.getRangeAt(0).cloneRange();
    }

    try {
      // 获取文档内容区域的内容，而不是整个document.content
      const contentDiv = documentContentEl.querySelector("div"); // 获取文档内容的div
      if (!contentDiv) return;

      // 获取文本内容
      const text = contentDiv.textContent || "";

      // 使用正则表达式计算匹配数
      const regex = new RegExp(
        value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "gi"
      );
      const matches = text.match(regex);
      this.searchMatchCount = matches ? matches.length : 0;
    } finally {
      // 恢复原选区
      if (savedRange && savedSelection) {
        savedSelection.removeAllRanges();
        savedSelection.addRange(savedRange);
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

  // 打印文档
  printDocument(): void {
    this.$message.info(`正在打印: ${this.document.title}`);
    // 实际项目中，这里应该实现打印功能
  }

  // 下载文档
  downloadDocument(): void {
    this.$message.info(`正在下载: ${this.document.title}`);
    // 实际项目中，这里应该实现下载功能
  }

  // 解析文档内容中的标题，生成目录
  extractTocItems(): void {
    if (!this.document.content) return;

    // 创建临时DOM元素来解析HTML内容
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = this.document.content;

    // 查找所有标题元素
    const headings = tempDiv.querySelectorAll("h1, h2, h3, h4, h5, h6");

    this.tocItems = Array.from(headings).map((heading) => {
      const level = parseInt(heading.tagName.substring(1)) - 1;
      return {
        text: heading.textContent,
        level: level,
      };
    });
  }

  // 滚动到指定标题
  scrollToHeading(headingText: string): void {
    const contentDiv = this.$refs.documentContent;
    if (!contentDiv) return;

    // 查找所有标题元素
    const headings = contentDiv.querySelectorAll("h1, h2, h3, h4, h5, h6");

    // 查找匹配文本的标题
    for (const heading of headings) {
      if (heading.textContent === headingText) {
        // 滚动到标题位置
        heading.scrollIntoView({ behavior: "smooth", block: "start" });

        // 添加高亮效果
        heading.classList.add("lawyer-highlight-heading");

        // 2秒后移除高亮效果
        setTimeout(() => {
          heading.classList.remove("lawyer-highlight-heading");
        }, 2000);

        // 关闭目录弹窗
        this.tocVisible = false;
        break;
      }
    }
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
    this.extractTocItems();

    // 添加滚动监听，可以用于实现阅读进度等功能
    const contentDiv = this.$refs.documentContent;
    if (contentDiv) {
      contentDiv.addEventListener("scroll", this.handleScroll);
    }
  }

  // 处理滚动事件
  handleScroll(): void {
    // 实际项目中，这里可以实现阅读进度跟踪等功能
  }

  // 组件销毁前清理
  beforeDestroy(): void {
    const contentDiv = this.$refs.documentContent;
    if (contentDiv) {
      contentDiv.removeEventListener("scroll", this.handleScroll);
    }
  }
}
</script>

<style lang="less" scoped>
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
  padding: 15px 20px;
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
    margin: 0 0 5px 0;
  }
}

.lawyer-document-meta {
  font-size: 13px;
  color: var(--lawyer-text-light);
  display: flex;
  gap: 20px;

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
}

// 文档查看器
.lawyer-document-viewer {
  flex: 1;
  background: var(--lawyer-surface);
  border-right: 1px solid var(--lawyer-border);
  display: flex;
  flex-direction: column;
}

// 工具栏
.lawyer-viewer-toolbar {
  padding: 10px 20px;
  border-bottom: 1px solid var(--lawyer-border);
  background: var(--lawyer-background);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.lawyer-toolbar-left,
.lawyer-toolbar-right {
  display: flex;
  align-items: center;
}

.lawyer-toolbar-left {
  gap: 8px;
}

.lawyer-toolbar-right {
  gap: 8px;
}

.lawyer-zoom-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.lawyer-zoom-level {
  padding: 0 8px;
  font-size: 12px;
  color: var(--lawyer-text-light);
}

.lawyer-document-content {
  flex: 1;
  padding: 40px;
  overflow-y: auto;
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

  .lawyer-highlight-heading {
    background-color: rgba(var(--lawyer-primary-rgb), 0.15);
    padding: 5px;
    border-radius: 4px;
    transition: background-color 0.5s ease;
  }
}

// 侧边栏样式
.lawyer-document-sidebar {
  width: 400px;
  background: var(--lawyer-surface);
  overflow-y: auto;
  padding: 20px;
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
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

// 目录样式
.lawyer-toc-container {
  width: 280px;
  max-height: 400px;
  overflow-y: auto;
  padding: 10px;

  h3 {
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
}

.lawyer-toc-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.lawyer-toc-item {
  color: var(--lawyer-text);
  text-decoration: none;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(var(--lawyer-primary-rgb), 0.1);
    color: var(--lawyer-primary);
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

// 搜索计数样式
.lawyer-search-count {
  font-size: 12px;
  color: #666;
  margin-left: 8px;
  min-width: 50px;
}

// 固定工具栏
.lawyer-sticky-toolbar {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--lawyer-background);
  border-bottom: 1px solid var(--lawyer-border);
}
</style>
