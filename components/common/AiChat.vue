<!-- ai对话框 -->
<template>
  <a-card :title="title" style="line-height: 40px" class="card">
    <slot name="cardExtra" />
    <div class="audio-wrapper">
      <div class="chatList" :style="`width: ${width}; height: ${chartHeight}`">
        <div
          id="chatScroll"
          ref="chatContainer"
          class="chat-scroll"
          :style="`overflow:${isMove == true ? 'auto' : 'hidden'}`"
          @mouseenter="mouseenter"
          @mouseleave="mouseleave"
        >
          <div
            v-for="item in chatList"
            :id="item.id"
            :key="item.id"
            class="flex"
            :class="`${item.isSelf ? 'reverse' : ''}`"
          >
            <a-avatar
              v-if="isShowAvatar"
              class=""
              :class="item.isSelf ? 'ml-8' : 'mr-8'"
              :icon="item.isSelf ? 'user' : 'user'"
            />
            <span
              :id="`${'chatData_' + item.id}`"
              class="chatContent"
              :class="`${item.isSelf ? 'isColor' : 'noColor'}`"
            >
              <img v-if="!item.isLoading && item.isPic" :src="item.label" style="width: 100%" />
              <v-md-preview
                v-else-if="!item.isLoading && !item.isPic"
                :text="item.label"
                class="markdown-body"
              ></v-md-preview>
              <template v-else>
                <a-spin size="small" :loading="item.isLoading" /> 正在思考中...
              </template>
            </span>
          </div>
        </div>
      </div>
      <div v-if="oldFooterStyle" class="footers">
        <a-input
          v-model.trim="textarea"
          class="ipt"
          placeholder="请输入提问内容，按回车进行提问"
          @pressEnter="onEnter($event.target.value)"
        ></a-input>
        <a-button
          type="primary"
          :disabled="sendDisabled"
          class="sendButton"
          @click="onEnter(textarea)"
          >发送</a-button
        >
      </div>
      <a-row v-else class="reportFooter">
        <a-row>
          <a-textarea
            v-model.trim="textarea"
            placeholder="请输入提问内容"
            :auto-size="{ minRows: 2, maxRows: 6 }"
            class="reportFooterInput"
            @pressEnter="pressEnter($event)"
          />
        </a-row>
        <a-row class="reportFooterButton">
          <a-col v-if="isShowNetwork" :span="20" class="tx-l">
            <a-tooltip title="按需搜索网页">
              <a-button
                size="small"
                :class="enableNetworkQuery ? 'netButton' : ''"
                shape="round"
                ghost
                @click="changeEnableNetwork"
              >
                🌐联网搜索
              </a-button>
            </a-tooltip>
          </a-col>
          <a-col :span="4" class="tx-r">
            <a-tooltip title="请输入你的问题">
              <a-button
                class="sendButton"
                size="small"
                type="primary"
                shape="circle"
                icon="arrow-up"
                :disabled="sendDisabled"
                @click="onEnter(textarea)"
              />
              <!-- 发送
                </a-button> -->
            </a-tooltip>
          </a-col>
        </a-row>
      </a-row>
      <div v-if="!oldFooterStyle" class="tx-c tip">本回答由AI生成，内容仅供参考，请仔细甄别。</div>
    </div>
  </a-card>
</template>
<script lang="ts">
  import { Component, Vue, Prop, Emit, Watch } from 'nuxt-property-decorator';
  import { v4 as uuidv4 } from 'uuid';
  import { ChatListType } from '~/model/chatModel';

  @Component
   class AiChatComponent extends Vue {
    @Prop({ default: 'AI问答' })
    public title: string;

    @Prop({
      default: 'calc(50vw - 68px)'
    })
    public width: string;

    @Prop({
      default: 'calc(100% - 104px)'
    })
    public chartHeight: string;

    @Prop({
      default: false
    })
    public isShowAvatar: boolean;

    // 是否采用以前footer样式
    @Prop({
      default: false
    })
    public oldFooterStyle: boolean;

    @Prop({
      default: false
    })
    public isShowNetwork: boolean;

    // 是否流式获取数据
    @Prop({
      default: false
    })
    public isFetch: boolean;

    // 流式请求header
    @Prop({
      default: () => {
        return {};
      }
    })
    public fetchHeaders: Record<string, string>;

    // 流式请求参数
    @Prop({
      default: () => {
        return {};
      }
    })
    public fetchParams: BodyInit;

    // 流式response 分割字符
    @Prop({
      default: '\n'
    })
    public fetchSplitTxt: string;

    // 流式请求url
    @Prop({
      default: ''
    })
    public fetchUrl: string;

    // AI响应数据
    @Prop({
      required: true
    })
    public responseChatList: ChatListType[];

    // 发送按钮初始状态
    @Prop({
      required: false
    })
    public isSendDisabled: boolean;

    isMove: boolean = false;
    // 是否联网搜索
    enableNetworkQuery: boolean = false;
    abortController: AbortController | null = null; // AbortController实例
    textarea: string = ''; // 用户输入的内容

    sendDisabled: boolean = false;

    chatList: ChatListType[] = [
      {
        label: '欢迎使用AI问答功能',
        id: uuidv4().replace(/-/g, ''),
        isSelf: false,
        isLoading: false
      }
    ];

    mounted() {
      this.sendDisabled = this.isSendDisabled;
    }

    pressEnter(event: KeyboardEvent) {
      console.log(event);
      // 检查是否按下Enter键
      if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey) {
        // 只有Enter: 阻止默认行为（换行）并发送消息
        event.preventDefault();
        this.onEnter(this.textarea);
      }
    }

    mouseenter(): void {
      this.isMove = true;
    }

    mouseleave(): void {
      this.isMove = false;
    }

    changeEnableNetwork() {
      this.enableNetworkQuery = !this.enableNetworkQuery;
    }

    async onEnter(event: string) {
      if (event && !this.sendDisabled) {
        try {
          this.chatList.push({
            label: event,
            id: uuidv4().replace(/-/g, ''),
            isSelf: true
          });

          this.chatList.push({
            label: ' ',
            id: uuidv4().replace(/-/g, ''),
            isSelf: false,
            isLoading: true
          });
          this.sendDisabled = true;
          this.$nextTick(() => {
            this.textarea = '';
          });
          if (this.isFetch) {
            await this.beforeBtnEnter(event);
            console.log(this.fetchParams);
            await this.fetchStreamData();
          } else {
            this.onBtnEnter(event);
          }
        } finally {
          this.sendDisabled = false;
        }
      }
    }

    async fetchStreamData() {
      try {
        const basePath = this.$route.path.split('/').filter(val => val)[0];
        const accessToken = localStorage.getItem('accessToken');
        const token = accessToken && JSON.parse(accessToken)[basePath];
        this.abortController = new AbortController();
        const response = await fetch(`${this.$axios.BASE_URL}${this.fetchUrl}`, {
          method: 'POST', // 这里明确设置 POST 方法
          headers: {
            ...this.fetchHeaders,
            Authorization: 'Bearer ' + token // 设置请求头
          },
          body: this.fetchParams, // 请求体
          signal: this.abortController.signal // 传递signal
        });

        if (!response.ok) {
          this.chatList[this.chatList.length - 1].isLoading = false;
          this.chatList[this.chatList.length - 1].label = '服务遇到问题，请联系管理员';
          this.sendDisabled = false;
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('Failed to get stream reader');
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value); // 将二进制数据解码为字符串

            const res = String(chunk).replace(/data:/g, '').split(this.fetchSplitTxt);

            res.forEach(item => {
              this.onBtnEnter(item);
            });
          }
        } catch (e) {
          console.error('Stream reading failed:', e);
        } finally {
          this.sendDisabled = false;
        }
      } catch (error) {
        console.error('Error fetching stream data:', error);
      } finally {
        this.sendDisabled = false;
      }
    }

    @Emit('onBtnEnter')
    onBtnEnter(event: string) {
      return event;
    }

    @Emit('beforeBtnEnter')
    beforeBtnEnter(event: string) {
      return {
        enableNetworkQuery: this.enableNetworkQuery,
        textContent: event
      };
    }

    @Watch('chatList.length')
    onNewMessageAdded(newLen, oldLen) {
      if (newLen > oldLen) {
        this.scrollToLatestMessage();
      }
    }

    scrollToLatestMessage() {
      this.$nextTick(() => {
        const container = this.$refs.chatContainer as HTMLDivElement;
        if (container) {
          container.scrollTo({
            top: container.scrollHeight, // 滚动到底部
            behavior: 'smooth' // 平滑滚动
          });
        }
      });
    }

    @Watch('responseChatList', { deep: true })
    onChangeResponseChatList(value: ChatListType[], _oldValue: ChatListType[]) {
      this.chatList = value;
    }

    beforeDestroy() {
      // 组件销毁时取消请求
      this.cancelRequest();
    }

    cancelRequest() {
      if (this.abortController) {
        this.abortController.abort(); // 取消请求
        this.abortController = null;
        // this.chatList[this.chatList.length - 1].isLoading = false
        //   this.chatList[this.chatList.length - 1].label =
        //     this.chatList[this.chatList.length - 1].label + '\n 用户停止请求'
        this.sendDisabled = false;
      }
    }
  }
  export default AiChatComponent
</script>
<style lang="less" scoped>
  .audio-wrapper {
    height: 100%;
  }
  .tip {
    line-height: normal;
    font-size: 12px;
    color: #7d828c;
  }
  // 滚动条
  ::-webkit-scrollbar {
    position: relative;
    width: 0.5em;
  }

  ::-webkit-scrollbar-track {
    position: relative;
    background-color: #f1f1f1;
  }
  ::-webkit-scrollbar-thumb {
    position: relative;
    background-color: rgb(201, 201, 201);
    border-radius: 16px;
  }
  .noColor {
    background: rgba(232, 232, 232, 1);
    :deep(p) {
      margin-bottom: 4px;
    }
  }
  :deep(.ant-card-head) {
    padding: 0 0 0 10px;
    .ant-card-head-title {
      padding: 0;
    }
  }
  :deep(.ant-card-body) {
    padding: 0;
    height: calc(100% - 50px);
  }

  :deep(.ant-card-extra) {
    padding: 0 10px 0 0;
  }

  .chatList {
    overflow: hidden;
    position: relative;
    // height: calc(100% - 45px);
    .chat-scroll {
      position: relative;
      height: 100%;
      overflow: hidden;
      padding: 0 10px;
      > div:first-child {
        margin-top: 10px;
      }
    }

    .flex {
      line-height: normal;
      margin: 0 0 10px 0;
      :deep(.ant-avatar) {
        flex-shrink: 0;
      }
    }
  }

  .isColor {
    background: rgba(290, 240, 120, 0.5);
  }

  .chatContent {
    display: inline-block;
    padding: 6px;
    border-radius: 8px;
    .markdown-body:deep(.github-markdown-body) {
      padding: 0 !important;
    }
  }

  .footers {
    display: flex;
    line-height: 30px;
    padding: 0 10px;
    .sendButton {
      margin-left: 6px;
    }
  }
  .reportFooter {
    margin-left: 4px;
    margin-right: 4px;
    padding: 10px 10px 0 10px;
    border-radius: 20px;
    border: 1px solid #ebeef2;
    background-color: #f3f4f6;
    box-sizing: border-box;
    /deep/textarea.ant-input {
      border: none;
      background: none;
      resize: none;
      overflow-y: scroll !important;
      height: 50px !important;
    }
    .reportFooterButton {
      text-align: right;

      .netButton {
        border: none !important;
        background: rgba(0, 122, 255, 0.2) !important;
        color: #4d6bfe !important;
      }
      :deep(.ant-btn-round.ant-btn-sm) {
        border-color: #6f6f6f;
        color: #a1a1a1;
        font-size: 12px;
      }
      :deep(.ant-btn-icon-only.ant-btn-sm) {
        font-size: 12px;
      }
    }
  }
  .reverse {
    flex-direction: row-reverse;
  }
</style>
