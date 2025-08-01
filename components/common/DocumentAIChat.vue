<template>
  <a-card class="document-ai-chat-card" :bordered="false">
    <div slot="title" class="ai-card-title">
      <span class="main-title">文档智能问答</span>
      <span class="ai-subtitle">针对当前文档内容智能问答</span>
    </div>

    <div class="ai-content">
      <!-- AI对话区域 -->
      <div class="ai-chat">
        <div class="ai-messages" ref="aiMessages">
          <div
            v-for="(msg, index) in aiMessages"
            :key="index"
            :class="[
              'ai-message',
              msg.isUser ? 'ai-message-user' : 'ai-message-ai',
            ]"
          >
            <div class="ai-message-content">
              <div v-if="msg.isUser" class="message-text">
                {{ msg.content }}
              </div>
              <div v-else-if="msg.isWelcome" class="message-text ai-response">
                <p>{{ msg.content }}</p>
              </div>
              <div v-else class="message-text ai-response markdown-content">
                <v-md-preview :text="msg.content" />
              </div>
            </div>
          </div>

          <!-- 加载指示器 -->
          <div v-if="aiLoading" class="ai-loading-indicator">
            <div class="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span class="loading-text">AI正在思考中</span>
          </div>
        </div>

        <!-- 输入框区域 -->
        <div class="ai-input-area">
          <div class="custom-input-container">
            <!-- 主输入框 -->
            <div class="main-input-wrapper">
              <a-textarea
                v-model="aiQuestion"
                placeholder="请输入您的问题..."
                :auto-size="{ minRows: 3, maxRows: 6 }"
                :disabled="aiLoading"
                @pressEnter="handleEnterPress"
                class="main-textarea"
              />
            </div>

            <!-- 底部工具栏 -->
            <div class="input-toolbar">
              <!-- 左侧：联网搜索按钮 -->
              <div class="toolbar-left">
                <a-tooltip
                  :title="enableNetworkQuery ? '' : '点击开启联网搜索'"
                  placement="top"
                >
                  <a-button
                    :type="enableNetworkQuery ? 'primary' : 'default'"
                    size="small"
                    @click="toggleNetworkQuery"
                    :class="[
                      'network-btn',
                      { 'network-btn-active': enableNetworkQuery },
                    ]"
                  >
                    <a-icon type="global" />
                    联网搜索
                  </a-button>
                </a-tooltip>
              </div>

              <!-- 右侧：发送按钮 -->
              <div class="toolbar-right">
                <a-button
                  type="primary"
                  size="small"
                  @click="handleSend"
                  :loading="aiLoading"
                  :disabled="!aiQuestion.trim() || aiLoading"
                  class="send-btn"
                >
                  发送
                </a-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </a-card>
</template>

<script lang="ts">
// @ts-nocheck
import { Component, Vue, Prop } from "nuxt-property-decorator";
import api from "~/api";
import marked from "marked";

interface AiMessage {
  content: string;
  isUser: boolean;
  isWelcome?: boolean; // 标识是否为欢迎消息
}

@Component
export default class DocumentAIChat extends Vue {
  @Prop({ required: true }) document: any;

  // AI助手相关状态
  aiQuestion = "";
  aiLoading = false;
  aiMessages: AiMessage[] = [];
  enableNetworkQuery = false;

  // 组件挂载时初始化欢迎消息
  mounted() {
    this.initWelcomeMessage();
  }

  // 初始化欢迎消息
  initWelcomeMessage(): void {
    const welcomeMessage = `您好！我是法律AI助手，可以帮助您解读《${this.document.title}》的内容。您可以向我提问关于这个文档的任何问题，比如：
请随时向我提问！`;

    this.aiMessages.push({
      content: welcomeMessage,
      isUser: false,
      isWelcome: true, // 标识为欢迎消息
    });
  }

  // 向AI提问
  async askAi(question: string): Promise<void> {
    if (!question.trim() || this.aiLoading) return;

    try {
      // 添加用户问题到消息列表
      this.addUserMessage(question);

      // 清空输入框
      this.aiQuestion = "";

      // 设置加载状态
      this.aiLoading = true;

      // 准备请求参数
      //   const params = {
      //     searchId: this.document.id,
      //     userId: this.$store.state.auth.id,
      //     question: question,
      //     enableNetworkQuery: this.enableNetworkQuery
      //   };
      const params = {
        enableNetworkQuery: false,
        question: "总结下文章要点",
        reportId: "6350789",
        userId: "DJ101015",
      };
      // 获取基础URL和token
      const baseURL = this.$axios.defaults.baseURL;
      const token = this.$store.state.auth.token;
      const userId = this.$store.state.auth.id;

      // 使用fetch进行流式请求
      const response = await fetch(
        `http://10.14.10.64:2023/roadshow/ai/research/discussion`,
        {
          method: "POST",
          headers: {
            userId: userId,
            Authorization: "Bearer " + token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(params),
        }
      );

      console.log("🚀 ~ DocumentAIChat ~ askAi ~ response:", response);

      // 先尝试解析响应体检查业务状态码
      try {
        const result = await response.clone().json();
        console.log("🚀 ~ DocumentAIChat ~ askAi ~ result:", result);

        // 检查业务状态码，如果不是 200 说明业务失败
        if (result.status && result.status !== 200) {
          throw new Error(result.message || "业务处理失败");
        }

        // 如果有数据，直接返回结果
        if (result.data) {
          this.aiMessages.push({
            content: result.data,
            isUser: false,
          });
          return;
        }

        // 如果解析成功但没有数据，继续流式处理
        console.log("JSON解析成功但无数据，继续流式处理");
      } catch (jsonError) {
        // JSON 解析失败，说明接口返回格式有问题
        console.error("JSON解析失败:", jsonError);
        console.log("响应内容可能不是有效的JSON格式，接口可能有问题");
        throw new Error("服务器响应格式异常，请稍后重试");
      }

      // 处理流式数据
      await this.processStreamResponse(response);
    } catch (error) {
      console.error("AI问答请求失败:", error);
      this.$message.error("AI问答服务暂时不可用，请稍后重试");

      // 添加错误消息
      this.aiMessages.push({
        content: "抱歉，AI服务暂时不可用，请稍后重试。",
        isUser: false,
      });
    } finally {
      this.aiLoading = false;
      this.scrollToBottom();
    }
  }

  // 处理流式响应
  async processStreamResponse(response: Response): Promise<void> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("无法读取响应流");
    }

    const decoder = new TextDecoder();
    let buffer = "";
    let aiMessage: AiMessage | null = null;
    let isFirstContent = true; // 标记是否是第一次接收到内容

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        // 解码数据块
        buffer += decoder.decode(value, { stream: true });

        // 按行分割数据
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // 保留最后一个不完整的行

        // 处理每一行数据
        for (const line of lines) {
          if (line.trim().startsWith("data:")) {
            const content = line.substring(5); // 移除 "data:" 前缀

            // 只有在有实际内容时才创建AI消息
            if (content.trim() && !aiMessage) {
              aiMessage = { content: "", isUser: false };
              this.aiMessages.push(aiMessage);
            }

            if (aiMessage && content.trim()) {
              // 第一次接收到内容时，隐藏加载提示
              if (isFirstContent) {
                this.aiLoading = false;
                isFirstContent = false;
              }

              aiMessage.content += content;

              // 使用 Vue.set 确保响应式更新
              this.$set(this.aiMessages, this.aiMessages.length - 1, aiMessage);

              // 滚动到底部
              this.$nextTick(() => {
                this.scrollToBottom();
              });
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  // 添加用户消息
  addUserMessage(content: string): void {
    this.aiMessages.push({
      content,
      isUser: true,
    });
    this.scrollToBottom();
  }

  // 滚动到底部
  scrollToBottom(): void {
    this.$nextTick(() => {
      const aiMessagesEl = this.$refs.aiMessages as HTMLElement;
      if (aiMessagesEl) {
        aiMessagesEl.scrollTop = aiMessagesEl.scrollHeight;
      }
    });
  }

  // 清空对话
  clearChat(): void {
    this.aiMessages = [];
    this.aiQuestion = "";
  }

  // 切换联网搜索
  toggleNetworkQuery(): void {
    this.enableNetworkQuery = !this.enableNetworkQuery;
  }

  // 将 Markdown 转换为 HTML
  markdownToHtml(content: string): string {
    if (!content) return "";

    try {
      // 配置 marked 选项
      marked.setOptions({
        breaks: true, // 支持换行符转换为 <br>
        gfm: true, // 启用 GitHub Flavored Markdown
        sanitize: false, // 不清理 HTML（因为我们信任 AI 的输出）
        smartLists: true, // 智能列表处理
        smartypants: true, // 智能标点符号
      });

      // 转换 markdown 为 HTML
      return marked(content);
    } catch (error) {
      console.error("Markdown 转换错误:", error);
      // 如果转换失败，返回原始内容
      return content.replace(/\n/g, "<br>");
    }
  }

  // 处理发送按钮点击
  handleSend(): void {
    if (this.aiQuestion.trim() && !this.aiLoading) {
      this.askAi(this.aiQuestion.trim());
    }
  }

  // 处理回车键
  handleEnterPress(e: KeyboardEvent): void {
    // Ctrl+Enter 或 Shift+Enter 换行，单独 Enter 发送
    if (!e.ctrlKey && !e.shiftKey) {
      e.preventDefault();
      this.handleSend();
    }
  }
}
</script>

<style lang="less">
.document-ai-chat-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  .ant-card-head {
    border-bottom: 1px solid #f0f0f0;
    padding: 0 16px;
  }

  .ant-card-body {
    flex: 1;
    padding: 10px 16px;
    display: flex;
    flex-direction: column;
    height: 95%; // 确保卡片主体占满足够高度
  }

  .ai-card-title {
    .main-title {
      font-size: 16px;
      font-weight: 500;
      margin-bottom: 2px;
    }

    .ai-subtitle {
      font-size: 12px;
      color: #8c8c8c;
    }
  }

  .ai-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    max-height: 99%;
  }

  // 输入框区域
  .ai-input-area {
    flex-shrink: 0; // 确保输入区域不会被压缩
    background-color: #fff;
    border-top: 1px solid #f0f0f0;
    padding-top: 10px;
    .custom-input-container {
      border: 1px solid #d9d9d9;
      border-radius: 8px;
      background: #fff;
      transition: border-color 0.3s, box-shadow 0.3s;

      &:hover {
        border-color: #40a9ff;
      }

      &:focus-within {
        border-color: #1890ff;
        box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
      }
    }

    .main-input-wrapper {
      padding: 12px 16px 8px 16px;

      .main-textarea {
        border: none !important;
        box-shadow: none !important;
        resize: none;
        font-size: 14px;
        line-height: 1.5;

        &:focus {
          border: none !important;
          box-shadow: none !important;
        }

        /deep/ .ant-input {
          border: none !important;
          box-shadow: none !important;
          padding: 0;

          &:focus {
            border: none !important;
            box-shadow: none !important;
          }
        }
      }
    }

    .input-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 16px 12px 16px;
      border-top: 1px solid #f0f0f0;

      .toolbar-left {
        .network-btn {
          border-radius: 6px;
          font-size: 12px;
          height: 28px;
          transition: all 0.3s ease;

          // 默认状态
          &.ant-btn {
            color: #666;
            border-color: #d9d9d9;
            background: #fff;
          }

          // 激活状态
          &.network-btn-active,
          &.ant-btn-primary {
            background: #1890ff;
            border-color: #1890ff;
            color: #fff;

            &:hover {
              background: #40a9ff;
              border-color: #40a9ff;
            }
          }

          // 悬停状态（非激活时）
          &:not(.network-btn-active):hover {
            color: #1890ff;
            border-color: #1890ff;
            background: #f0f8ff;
          }

          .anticon {
            margin-right: 4px;
          }
        }
      }

      .toolbar-right {
        .send-btn {
          border-radius: 6px;
          font-size: 12px;
          height: 28px;
          min-width: 60px;

          .anticon {
            margin-right: 4px;
          }

          &:disabled {
            opacity: 0.5;
          }
        }
      }
    }
  }

  // AI对话区域
  .ai-chat {
    display: flex;
    flex-direction: column;
    flex: 1;
    background: #fff;
    overflow-y: auto;
  }

  .ai-messages {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 10px;

    &:empty::before {
      content: "暂无对话记录，请开始提问...";
      color: #bfbfbf;
      font-size: 12px;
      text-align: center;
      padding: 30px 15px;
      display: block;
    }
  }

  .ai-message {
    max-width: 85%;
    padding: 10px 14px;
    border-radius: 8px;
    position: relative;
    line-height: 1.5;
    font-size: 13px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

    &-user {
      background-color: #fff3dd;

      align-self: flex-end;
      border-bottom-right-radius: 3px;
    }

    &-ai {
      background-color: #eeeeee;

      align-self: flex-start;
      border-bottom-left-radius: 3px;
    }

    .message-text {
      margin: 0;
      line-height: 1.5;
      word-wrap: break-word;

      &.ai-response {
        strong {
          font-weight: 600;
          color: #1890ff;
        }

        em {
          font-style: italic;
          color: #722ed1;
        }
      }

      // Markdown 内容样式
      &.markdown-content {
        // 覆盖 github-markdown-body 的默认 padding
        .github-markdown-body {
          padding: 0;
          font-size: inherit;
        }
        h1,
        h2,
        h3,
        h4,
        h5,
        h6 {
          margin: 16px 0 8px 0;
          font-weight: 600;
          line-height: 1.25;
          color: #1890ff;
        }

        h1 {
          font-size: 1.5em;
        }
        h2 {
          font-size: 1.3em;
        }
        h3 {
          font-size: 1.1em;
        }

        p {
          margin: 0;
          line-height: 1.6;
        }

        ul,
        ol {
          margin: 8px 0;
          padding-left: 20px;
        }

        li {
          margin: 4px 0;
          line-height: 1.5;
        }

        code {
          background: #f5f5f5;
          padding: 2px 4px;
          border-radius: 3px;
          font-family: "Courier New", monospace;
          font-size: 0.9em;
        }

        pre {
          background: #f5f5f5;
          padding: 12px;
          border-radius: 6px;
          overflow-x: auto;
          margin: 12px 0;

          code {
            background: none;
            padding: 0;
          }
        }

        blockquote {
          border-left: 4px solid #ddd;
          margin: 12px 0;
          padding: 8px 16px;
          background: #f9f9f9;
          color: #666;
        }

        table {
          border-collapse: collapse;
          width: 100%;
          margin: 12px 0;
        }

        th,
        td {
          border: 1px solid #ddd;
          padding: 8px 12px;
          text-align: left;
        }

        th {
          background: #f5f5f5;
          font-weight: 600;
        }
      }
    }
  }

  // 加载指示器
  .ai-loading-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    background-color: #eeeeee;
    border: 1px solid #d9d9d9;
    border-radius: 8px;
    align-self: flex-start;
    max-width: 85%;

    .loading-dots {
      display: flex;
      gap: 4px;

      span {
        width: 6px;
        height: 6px;
        background-color: #1890ff;
        border-radius: 50%;
        animation: loading-bounce 1.4s ease-in-out infinite both;

        &:nth-child(1) {
          animation-delay: -0.32s;
        }
        &:nth-child(2) {
          animation-delay: -0.16s;
        }
        &:nth-child(3) {
          animation-delay: 0s;
        }
      }
    }

    .loading-text {
      font-size: 12px;
      color: #8c8c8c;
    }
  }

  @keyframes loading-bounce {
    0%,
    80%,
    100% {
      transform: scale(0);
    }
    40% {
      transform: scale(1);
    }
  }
}
</style>
