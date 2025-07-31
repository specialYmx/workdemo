<template>
  <a-card class="document-ai-chat-card" :bordered="false">
    <div slot="title" class="ai-card-title">
      <span>文档智能问答</span>
      <span class="ai-subtitle">针对当前文档内容智能问答</span>
    </div>

    <div class="ai-content">
      <!-- AI助手介绍 -->
      <div class="ai-notice">
        <p class="notice-text">
          您好！我是法律AI助手，可以帮助您解读《{{
            document.title
          }}》的内容。您可以：
        </p>
      </div>

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
              <div
                v-else
                class="message-text ai-response"
                v-html="formatAiContent(msg.content)"
              ></div>
            </div>
          </div>

          <!-- 加载指示器 -->
          <div v-if="aiLoading" class="ai-loading-indicator">
            <div class="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span class="loading-text">AI正在思考中...</span>
          </div>
        </div>

        <!-- 输入框区域 -->
        <div class="ai-input-area">
          <div class="input-row">
            <!-- 联网搜索开关 -->
            <div class="network-search-toggle">
              <a-switch
                v-model="enableNetworkQuery"
                size="small"
                checked-children=" 联网搜索"
                un-checked-children=" 联网搜索"
              >
              </a-switch>
            </div>

            <!-- 输入框 -->
            <div class="ai-input">
              <a-input-search
                placeholder="请输入您的问题，按回车进行提问"
                v-model="aiQuestion"
                @search="askAi"
                enterButton="发送"
                :loading="aiLoading"
                :disabled="aiLoading"
              />
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

interface AiMessage {
  content: string;
  isUser: boolean;
}

@Component
export default class DocumentAIChat extends Vue {
  @Prop({ required: true }) document: any;

  // AI助手相关状态
  aiQuestion = "";
  aiLoading = false;
  aiMessages: AiMessage[] = [];
  enableNetworkQuery = false;

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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // 创建AI消息对象
      const aiMessage: AiMessage = { content: "", isUser: false };
      this.aiMessages.push(aiMessage);

      // 处理流式数据
      await this.processStreamResponse(response, aiMessage);
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
  async processStreamResponse(
    response: Response,
    aiMessage: AiMessage
  ): Promise<void> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("无法读取响应流");
    }

    const decoder = new TextDecoder();
    let buffer = "";

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
            aiMessage.content += content;

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
    this.aiMessages.push({
      content,
      isUser: true,
    });
    this.scrollToBottom();
  }

  // 格式化AI回答内容
  formatAiContent(content: string): string {
    // 处理换行符
    return content
      .replace(/\n/g, "<br>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // 粗体
      .replace(/\*(.*?)\*/g, "<em>$1</em>"); // 斜体
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
}
</script>

<style lang="less" scoped>
.document-ai-chat-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  /deep/ .ant-card-head {
    border-bottom: 1px solid #f0f0f0;
    padding: 16px 20px;
  }

  /deep/ .ant-card-body {
    flex: 1;
    padding: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
}

.ai-card-title {
  display: flex;
  flex-direction: column;
  gap: 4px;

  span:first-child {
    font-size: 16px;
    font-weight: 500;
    color: #262626;
  }

  .ai-subtitle {
    font-size: 12px;
    color: #8c8c8c;
    font-weight: normal;
  }
}

.ai-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
  overflow: hidden;
  min-height: 0; // 重要：确保flex子项能正确收缩
}

// AI通知区域
.ai-notice {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
  flex-shrink: 0; // 防止被压缩

  .notice-text {
    margin: 0;
    color: #262626;
    font-size: 13px;
    line-height: 1.4;
  }
}

// 输入框区域
.ai-input-area {
  flex-shrink: 0; // 确保输入区域不会被压缩

  .input-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background-color: #fff;
    border-top: 1px solid #f0f0f0;
  }

  // 联网搜索开关
  .network-search-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;

    .toggle-label {
      font-size: 12px;
      color: #666;
      white-space: nowrap;
    }
  }
}

// AI对话区域
.ai-chat {
  display: flex;
  flex-direction: column;
  flex: 1;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
  min-height: 300px; // 确保最小高度
}

.ai-messages {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background-color: #fafafa;
  min-height: 180px; // 减小最小高度
  max-height: none; // 移除最大高度限制，让它自适应

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
    background-color: #e6f7ff;
    color: #262626;
    align-self: flex-end;
    border-bottom-right-radius: 3px;
  }

  &-ai {
    background-color: #fff;
    color: #262626;
    align-self: flex-start;
    border-bottom-left-radius: 3px;
    border: 1px solid #e8e8e8;
  }

  .message-text {
    margin: 0;
    line-height: 1.5;
    word-wrap: break-word;

    &.ai-response {
      /deep/ strong {
        font-weight: 600;
        color: #1890ff;
      }

      /deep/ em {
        font-style: italic;
        color: #722ed1;
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
  background-color: #fff;
  border: 1px solid #e8e8e8;
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

.ai-input {
  flex: 1; // 占据剩余空间

  /deep/ .ant-input-search {
    .ant-input {
      border-radius: 6px;
      font-size: 13px;
    }

    .ant-btn {
      border-radius: 0 6px 6px 0;
      font-size: 13px;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .ai-content {
    padding: 12px;
  }

  .ai-notice {
    padding: 10px;
    margin-bottom: 10px;

    .notice-text {
      font-size: 12px;
    }
  }

  .ai-chat {
    min-height: 250px;
  }

  .ai-messages {
    min-height: 120px;
    padding: 10px;
  }

  .ai-message {
    max-width: 90%;
    font-size: 12px;
    padding: 8px 12px;
  }

  .ai-input-area {
    .input-row {
      padding: 10px;
      gap: 10px;
    }

    .network-search-toggle {
      .toggle-label {
        font-size: 11px;
      }
    }
  }
}
</style>
