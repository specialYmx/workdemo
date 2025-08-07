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
            <div>
              <div v-if="msg.isUser">
                {{ msg.content }}
              </div>
              <div v-else-if="msg.isWelcome" class="ai-response">
                <p>{{ getMessageContent(msg.content) }}</p>
              </div>
              <div v-else class="ai-response lawyer-markdown-content">
                <v-md-preview :text="getMessageContent(msg.content)" />
              </div>
            </div>
          </div>

          <!-- 加载指示器 -->
          <div v-if="showThinking" class="ai-loading-indicator">
            <a-spin size="small" />
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

              <!-- 右侧：发送/停止按钮 -->
              <div class="toolbar-right">
                <a-button
                  v-if="!aiLoading"
                  type="primary"
                  size="small"
                  @click="handleSend"
                  :disabled="!aiQuestion.trim()"
                  class="send-btn"
                >
                  发送
                </a-button>
                <a-button
                  v-else
                  type="danger"
                  size="small"
                  @click="handleStop"
                  class="stop-btn"
                >
                  <a-icon type="stop" />
                  停止
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
import { Component, Vue, Prop } from "nuxt-property-decorator";
import api from "~/api";
import { DocumentViewerData, AiMessage } from "~/model/LawyerModel";

@Component
export default class DocumentAIChat extends Vue {
  @Prop({ required: true }) document!: DocumentViewerData;

  // AI助手相关状态
  aiQuestion: string = "";
  aiLoading: boolean = false;
  aiMessages: AiMessage[] = [];
  enableNetworkQuery: boolean = false;
  showThinking: boolean = false; // 控制"AI正在思考中"提示的显示

  // 流式请求控制器
  private abortController: AbortController | null = null;

  // 组件挂载时初始化欢迎消息
  mounted(): void {
    try {
      this.initWelcomeMessage();
    } catch (error) {
      console.error("初始化欢迎消息时出错:", error);
    }
  }

  // 组件销毁时清理资源
  beforeDestroy(): void {
    try {
      this.cancelCurrentRequest();
    } catch (error) {
      console.error("清理资源时出错:", error);
    }
  }

  // 错误处理方法
  errorCaptured(err: Error, vm: Vue, info: string): boolean {
    console.error("组件捕获到错误:", err, info);
    // 防止错误向上传播导致整个应用崩溃
    return false;
  }

  // 初始化欢迎消息
  initWelcomeMessage(): void {
    const welcomeMessage: string = `您好！我是文档AI助手。您可以向我提问关于这个文档的任何问题，请随时向我提问！`;

    this.aiMessages.push({
      content: welcomeMessage,
      isUser: false,
      isWelcome: true, // 标识为欢迎消息
    });
  }

  // 取消当前请求
  cancelCurrentRequest(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
      this.aiLoading = false;
      this.showThinking = false;
    }
  }

  // 向AI提问
  async askAi(question: string): Promise<void> {
    if (!question.trim() || this.aiLoading) return;

    try {
      // 取消之前的请求
      this.cancelCurrentRequest();

      // 创建新的请求控制器
      this.abortController = new AbortController();

      // 添加用户问题到消息列表
      this.addUserMessage(question);

      // 清空输入框
      this.aiQuestion = "";

      // 设置加载状态
      this.aiLoading = true;
      this.showThinking = true;
      // 准备请求参数 - 使用 FormData 格式
      const formData: FormData = new FormData();
      formData.append("searchId", this.document.id);
      formData.append("userId", this.$store.state.auth.id);
      formData.append("question", question);
      formData.append("enableNetworkQuery", this.enableNetworkQuery.toString());
      // 获取基础URL和token
      const baseURL: string = this.$axios.defaults.baseURL;
      const token: string = this.$store.state.auth.token;
      const userId: string = this.$store.state.auth.id;

      // 使用fetch进行流式请求
      const response: Response = await fetch(
        `${baseURL}${api.lawyer.getAIRobotAnswer}`,
        {
          method: "POST",
          headers: {
            userId: userId,
            Authorization: "Bearer " + token,
            // 注意：使用 FormData 时不要设置 Content-Type，让浏览器自动设置
          },
          body: formData,
          signal: this.abortController?.signal, // 添加取消信号
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // 创建AI消息对象
      const aiMessage: AiMessage = { content: "", isUser: false };
      this.aiMessages.push(aiMessage);

      // 处理流式数据
      await this.processStreamResponse(response, aiMessage);
    } catch (error) {
      // 检查是否是用户主动取消的请求
      if (error.name === "AbortError") {
        console.log("AI请求已被用户取消");
        return; // 用户主动取消，不显示错误信息
      }

      console.error("AI问答请求失败:", error);
      this.$message.error("AI问答服务暂时不可用，请稍后重试");

      // 添加错误消息
      this.aiMessages.push({
        content: "抱歉，AI服务暂时不可用，请稍后重试。",
        isUser: false,
      });
    } finally {
      this.aiLoading = false;
      this.showThinking = false;
      this.abortController = null; // 清理控制器
      this.scrollToBottom();
    }
  }

  // 处理流式响应
  async processStreamResponse(
    response: Response,
    aiMessage: AiMessage
  ): Promise<void> {
    const reader: ReadableStreamDefaultReader<Uint8Array> | undefined =
      response.body?.getReader();
    if (!reader) {
      throw new Error("无法读取响应流");
    }

    const decoder: TextDecoder = new TextDecoder();
    let buffer: string = "";
    let isFirstContent: boolean = true; // 标记是否是第一次接收到内容

    try {
      while (true) {
        // 检查是否已被取消
        if (this.abortController?.signal.aborted) {
          throw new DOMException("Request was aborted", "AbortError");
        }

        const { done, value } = await reader.read();

        if (done) break;

        // 解码数据块
        buffer += decoder.decode(value, { stream: true });

        // 按行分割数据
        const lines: string[] = buffer.split("\n");
        buffer = lines.pop() || ""; // 保留最后一个不完整的行

        // 处理每一行数据
        for (const line of lines) {
          if (line.trim().startsWith("data:")) {
            const content: string = line.substring(5); // 移除 "data:" 前缀

            // 第一次接收到内容时，隐藏"AI正在思考中"提示
            if (isFirstContent && content.trim()) {
              this.showThinking = false;
              isFirstContent = false;
            }

            aiMessage.content += this.formatTextWithNewlines(content);

            // 强制更新视图
            this.$forceUpdate();

            // 滚动到底部
            this.$nextTick(() => {
              this.scrollToBottom();
            });
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  // 添加用户消息
  addUserMessage(content: string): void {
    try {
      this.aiMessages.push({
        content: this.getMessageContent(content),
        isUser: true,
      });
      this.scrollToBottom();
    } catch (error) {
      console.error("添加用户消息时出错:", error);
    }
  }

  // 滚动到底部
  scrollToBottom(): void {
    try {
      this.$nextTick(() => {
        const aiMessagesEl = this.$refs.aiMessages as HTMLElement;
        if (aiMessagesEl && aiMessagesEl.scrollTo) {
          aiMessagesEl.scrollTop = aiMessagesEl.scrollHeight;
        }
      });
    } catch (error) {
      console.error("滚动到底部时出错:", error);
    }
  }

  // 清空对话
  clearChat(): void {
    // 取消当前请求
    this.cancelCurrentRequest();

    this.aiMessages = [];
    this.aiQuestion = "";
  }

  // 切换联网搜索
  toggleNetworkQuery(): void {
    this.enableNetworkQuery = !this.enableNetworkQuery;
  }

  // 处理发送按钮点击
  handleSend(): void {
    if (this.aiQuestion.trim() && !this.aiLoading) {
      this.askAi(this.aiQuestion.trim());
    }
  }

  // 处理停止按钮点击
  handleStop(): void {
    this.cancelCurrentRequest();
    this.$message.info("已停止AI回答");
  }

  // 处理回车键
  handleEnterPress(e: KeyboardEvent): void {
    // Ctrl+Enter 或 Shift+Enter 换行，单独 Enter 发送
    if (!e.ctrlKey && !e.shiftKey) {
      e.preventDefault();
      this.handleSend();
    }
  }
  // 格式化文本换行（处理中文序号格式）
  formatTextWithNewlines(text: string): string {
    if (!text) return "";

    // 扩展正则，支持：一、二、... 1. 2. ... （一） （二） ... 1、 2、 ...
    const pattern =
      /([一二三四五六七八九十]+、|（[一二三四五六七八九十]+）|\d+[.、])/g;

    // 替换并规范化换行
    return text.replace(pattern, "\n$1").replace(/\n+/g, "\n\n"); // 合并多个换行
  }

  // 安全获取消息内容，确保返回字符串类型
  getMessageContent(content: string | object): string {
    try {
      // 统一转换为字符串
      let textContent = "";

      if (!content) {
        textContent = "";
      } else if (typeof content === "string") {
        textContent = content;
      } else if (typeof content === "object") {
        textContent = JSON.stringify(content, null, 2);
      } else {
        // 处理 number, boolean 等其他类型
        textContent = String(content);
      }

      // 应用换行格式化
      return this.formatTextWithNewlines(textContent);
    } catch (error) {
      console.error("处理消息内容时出错:", error);
      return "消息内容格式异常";
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
    max-height: 98%;
  }

  // 输入框区域
  .ai-input-area {
    border-top: 1px solid #f0f0f0;
    padding-top: 10px;
    .custom-input-container {
      border: 1px solid #d9d9d9;
      border-radius: 8px;
      transition: border-color 0.3s, box-shadow 0.3s;
      &:hover {
        border-color: var(--lawyer-primary);
      }
    }

    .main-input-wrapper {
      .main-textarea {
        border-radius: 8px;
        border: none;
        box-shadow: none;
        resize: none;
        font-size: 14px;
        line-height: 1.5;
        padding: 12px 16px 8px 16px;
        &:focus {
          border: none;
          box-shadow: none;
        }

        .ant-input {
          border: none;
          box-shadow: none;
          padding: 0;

          &:focus {
            border: none;
            box-shadow: none;
          }
        }
      }
    }

    .input-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 16px 12px 16px;
      border-radius: 0 0 8px 8px; // 下方圆角，与外层容器匹配
      // 统一图标样式
      .anticon {
        margin-right: 4px;
      }

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
        }
      }

      .toolbar-right {
        .send-btn,
        .stop-btn {
          border-radius: 6px;
          font-size: 12px;
          height: 28px;
          min-width: 60px;

          &:disabled {
            opacity: 0.5;
          }
        }

        .stop-btn {
          background: #ff4d4f;
          border-color: #ff4d4f;
          color: #fff;

          &:hover {
            background: #ff7875;
            border-color: #ff7875;
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
    padding-bottom: 10px;
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
    line-height: 1.5;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    margin: 0;
    word-wrap: break-word;

    &-user {
      background-color: #fff3dd;
      align-self: flex-end;
      border-bottom-right-radius: 3px;
    }

    &-ai {
      background-color: #eeeeee;
      align-self: flex-start;
      border-bottom-left-radius: 3px;
      p {
        margin: 0;
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
    border-radius: 8px;
    align-self: flex-start;
    max-width: 85%;
    .loading-text {
      font-size: 12px;
      color: #8c8c8c;
    }
  }
}
</style>
