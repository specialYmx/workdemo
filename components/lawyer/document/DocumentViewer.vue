<template>
  <div ref="documentViewerContainer" class="document-viewer-wrapper">
    <div class="lawyer-document-page">
      <!-- 主要内容区 -->
      <div
        ref="mainLayout"
        class="lawyer-main-layout"
        :class="{ 'lawyer-main-layout-resizing': isResizing }"
      >
        <!-- 左侧：文档查看器 -->
        <div class="lawyer-document-left">
          <a-card class="lawyer-document-viewer lawyer-chart-card" :bordered="false">
            <!-- 文档头部信息 -->
            <div class="lawyer-document-header">
              <div class="lawyer-header-row">
                <div class="lawyer-document-info">
                  <!-- 标题和状态标签 -->
                  <div class="lawyer-title-with-status">
                    <h1>{{ document.title }}</h1>
                    <a-tag
                      :color="document.isRevoke ? 'red' : 'green'"
                      :class="['lawyer-editable-status', 'lawyer-inline-status']"
                      @click="handleStatusTagClick"
                    >
                      {{ document.timeLiness || '未知' }}
                      <a-icon type="edit" class="lawyer-status-edit-icon" />
                    </a-tag>
                  </div>
                </div>

                <div class="lawyer-header-actions">
                  <a-button class="lawyer-back-btn" @click="goBack">
                    <a-icon type="arrow-left" />
                    返回
                  </a-button>
                  <a-button v-if="showDownloadButton" type="primary" @click="downloadDocument">
                    下载
                  </a-button>
                </div>
              </div>
              <!-- 文档元数据 -->
              <div class="lawyer-document-meta">
                <span v-for="item in documentMetaItems" :key="item.icon">
                  <a-icon :type="item.icon" /> {{ item.content }}
                </span>
              </div>
            </div>

            <!-- 文档内容 -->
            <!-- 如果是 iframe 模式，不需要文本搜索功能 -->
            <template v-if="document.dataSource !== '2' && document.iframeUrl">
              <iframe
                :src="document.iframeUrl"
                class="lawyer-iframe-preview"
                frameborder="0"
                sandbox="allow-same-origin allow-scripts"
              ></iframe>
            </template>
            <!-- 否则使用 markdown 预览，并ai-chat包含文本搜索功能 -->
            <lawyer-common-div-text-search v-else>
              <div
                ref="documentContent"
                class="lawyer-document-content lawyer-scrollable lawyer-markdown-content"
                tabindex="0"
              >
                <auth-markdown-preview :text="document.content" :enable-image-auth="true" />
              </div>
            </lawyer-common-div-text-search>
          </a-card>
        </div>

        <div
          v-if="!isMobileViewport"
          class="lawyer-resize-handle"
          :class="{ 'lawyer-resize-handle-active': isResizing }"
          @mousedown="startResize"
          @dblclick="resetPanelWidth"
        ></div>

        <!-- 右侧：文档智能问答 -->
        <div class="lawyer-document-right" :style="rightPanelStyle">
          <common-ai-chat
            ref="aiChat"
            title="文档智能问答"
            :is-show-network="true"
            :response-chat-list="responseChatList"
            :is-fetch="true"
            :fetch-headers="fetchHeaders"
            :fetch-params="fetchParams"
            :fetch-url="fetchUrl"
            :old-footer-style="false"
            :fetch-split-txt="splitTxt"
            :chart-height="'100%'"
            width="100%"
            @beforeBtnEnter="beforeBtnEnter"
            @onBtnEnter="onBtnEnter"
          />
        </div>

        <div
          v-if="isResizing"
          class="lawyer-resize-mask"
          @mousemove="handleResizeMouseMove"
          @mouseup="stopResize"
        ></div>
      </div>

      <lawyer-document-edit-modal
        :visible="editModalVisible"
        :document="document"
        :field-config="fieldConfig"
        :tag-options="tagOptions"
        :website-options="websiteOptions"
        :department-options="departmentOptions"
        :get-container="getModalContainer"
        @cancel="handleEditCancel"
        @success="handleEditSuccess"
      />
    </div>
  </div>
</template>

<script lang="ts">
  import { Component, Vue, Prop, Emit } from 'nuxt-property-decorator';
  import { v4 as uuidv4 } from 'uuid';
  import { downloadFileWithMessage } from '~/utils/personal';
  import type {
    DocumentViewerData,
    DocumentMetaItem,
    CascaderOption,
    LegalCategoryItem,
    DepartmentOption,
    WebsiteOption
  } from '~/model/LawyerModel';
  import { ChatListType } from '~/model/chatModel';
  import api from '~/api';
  import { departmentOptions as departmentOptionEnums } from '~/enums/Lawyer';
  import { getFetchFormat } from '~/utils/aiFetchFormat';
  import CommonAiChat from '~/components/common/AiChat.vue';

  @Component({
    name: 'document-viewer',
    components: {
      CommonAiChat,
    }
  })
  class DocumentViewer extends Vue {
    @Prop({ required: true }) document!: DocumentViewerData;

    get showDownloadButton(): boolean {
      if (this.document.categoryId === '3') {
        return false;
      }
      const categoryText = `${this.document.assemblyCategoryMain || ''}`;
      return !categoryText.includes('制度库');
    }

    // AI助手相关
    responseChatList: ChatListType[] = [];
    fetchHeaders: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    fetchParams: BodyInit | null = null;
    fetchUrl: string = api.lawyer.getAIRobotAnswer;
    splitTxt: string = `End\n\n`;
    tempText: string = '';
    rightPanelWidthPercent: number = 40;
    minRightPanelWidthPercent: number = 15;
    maxRightPanelWidthPercent: number = 80;
    isResizing: boolean = false;
    isMobileViewport: boolean = false;
    boundResizeMouseMove = (event: MouseEvent): void => {
      this.handleResizeMouseMove(event);
    };

    boundResizeMouseUp = (): void => {
      this.stopResize();
    };

    boundWindowResize = (): void => {
      this.syncViewportState();
    };

    boundWindowBlur = (): void => {
      this.stopResize();
    };

    // 编辑状态相关
    editModalVisible: boolean = false;
    // 标签分类相关
    tagOptions: CascaderOption[] = [];
    websiteOptions: WebsiteOption[] = [];
    departmentOptions: DepartmentOption[] = [...departmentOptionEnums]; // 存储部门数据

    // 组件挂载时初始化欢迎消息
    async mounted(): Promise<void> {
      this.syncViewportState();
      window.addEventListener('resize', this.boundWindowResize);
      window.addEventListener('blur', this.boundWindowBlur);
      this.initWelcomeMessage();
      await this.loadCategoryOptions();
      await this.loadWebsiteOptions();
      // await this.loadDepartmentData();
    }

    beforeDestroy(): void {
      window.removeEventListener('resize', this.boundWindowResize);
      window.removeEventListener('blur', this.boundWindowBlur);
      this.removeResizeListeners();
      this.restoreBodyInteractionStyles();
    }

    // 加载网站来源数据
    async loadWebsiteOptions(): Promise<void> {
      try {
        const websiteRatioData = await this.$roadLawyerService.getWebSiteRatio();
        if (websiteRatioData && typeof websiteRatioData === 'object') {
          this.websiteOptions = Object.keys(websiteRatioData).map(
            (key: string): WebsiteOption => ({
              value: key,
              label: key
            })
          );
        }
      } catch (error) {
        console.error('加载网站来源数据失败:', error);
        this.websiteOptions = [];
      }
    }

    // 初始化欢迎消息
    initWelcomeMessage(): void {
      this.responseChatList = [
        {
          label: '您好！我是文档AI助手。您可以向我提问关于这个文档的任何问题，请随时向我提问！',
          id: uuidv4().replace(/-/g, ''),
          isSelf: false,
          isLoading: false
        }
      ];
    }

    // 根据路由确定分类ID
    getCategoryIdByRoute(): string | undefined {
      // 优先从路由参数获取来源页面信息
      const sourcePath = this.$route.query.source as string;
      const routePath = sourcePath || this.$route.path;
      if (routePath.includes('/institutionLibrary')) {
        return '3'; // 制度库
      } else if (routePath.includes('/punishmentCompilation')) {
        return '1'; // 处罚汇编
      } else if (routePath.includes('/regulationCompilation')) {
        return '2'; // 法规汇编
      } else if (routePath.includes('/newRegulationInterpretation')) {
        return '310'; // 新规解读
      } else if (routePath.includes('/researchCollection')) {
        return '311'; // 研究集锦
      } else if (routePath.includes('/legalComplianceQuarterly')) {
        return '312'; // 法律合规季刊
      }
      return undefined; // 大家智库页面使用全量数据
    }

    // 加载分类数据
    async loadCategoryOptions(): Promise<void> {
      try {
        const categoryId = this.getCategoryIdByRoute();
        const categories: LegalCategoryItem[] = await this.$roadLawyerService.getLegalCategory({
          id: categoryId
        });

        if (categories && categories.length > 0) {
          // 根据是否有categoryId决定数据处理方式
          let processedCategories = categories;
          if (categoryId) {
            // 有具体ID时，取第一个元素的children
            processedCategories = categories[0]?.children || [];
          }
          this.tagOptions = this.convertToCascaderOptions(processedCategories);
        } else {
          this.tagOptions = [];
        }
      } catch (error) {
        console.error('加载分类数据失败:', error);
        this.tagOptions = [];
      }
    }

    // 将API数据转换为级联选择器格式
    convertToCascaderOptions(categories: LegalCategoryItem[]): CascaderOption[] {
      return categories.map(
        (category: LegalCategoryItem): CascaderOption => ({
          value: category.id,
          label: category.name,
          children: this.convertToCascaderOptions(category.children || [])
        })
      );
    }

    // 根据当前路由判断页面类型，返回表单字段显示配置
    get fieldConfig(): {
      showTimeliness: boolean;
      showEffectivenessLevel: boolean;
      showCategory: boolean;
      showSource: boolean;
      showPublishDate: boolean;
      showEffectDate: boolean;
      showDocumentNo: boolean;
      showDepartment: boolean;
      showAppendix: boolean;
    } {
      const routePath = this.$route.path;
      // 优先从路由参数获取来源页面信息
      const sourcePath = this.$route.query.source as string;
      const finalPath = sourcePath || routePath;
      const showDepartmentInKnowledge = finalPath.includes('/lawyerKnowledge');

      // 新规解读、处罚汇编、研究集锦、法规合规季刊：只显示"分类"、"发布时间"
      if (
        finalPath.includes('/newRegulationInterpretation') ||
        finalPath.includes('/punishmentCompilation') ||
        finalPath.includes('/researchCollection') ||
        finalPath.includes('/legalComplianceQuarterly')
      ) {
        return {
          showTimeliness: false,
          showEffectivenessLevel: false,
          showCategory: true,
          showSource: false,
          showPublishDate: true,
          showEffectDate: false,
          showDocumentNo: false,
          showDepartment: false,
          showAppendix: false
        };
      }

      // 制度库：去掉"时效性"、"效力位阶"、"来源"
      if (finalPath.includes('/institutionLibrary')) {
        return {
          showTimeliness: false,
          showEffectivenessLevel: false,
          showCategory: true,
          showSource: false,
          showPublishDate: true,
          showEffectDate: true,
          showDocumentNo: true,
          showDepartment: true,
          showAppendix: true
        };
      }

      // 法规汇编、大家智库：保持所有字段
      return {
        showTimeliness: true,
        showEffectivenessLevel: true,
        showCategory: true,
        showSource: true,
        showPublishDate: true,
        showEffectDate: true,
        showDocumentNo: true,
        showDepartment: showDepartmentInKnowledge,
        showAppendix: true
      };
    }

    // 文档元数据项
    get documentMetaItems(): DocumentMetaItem[] {
      return [
        {
          icon: 'number',
          content: `文号：${this.document.fileNumber || '暂无'}`
        },
        {
          icon: 'bank',
          content: `发布机构：${this.document.publisher || '暂无'}`
        },
        {
          icon: 'calendar',
          content: `发布日期：${this.document.date || '暂无'}`
        },
        {
          icon: 'clock-circle',
          content: `生效日期：${this.document.effectiveDate || '暂无'}`
        }
      ];
    }

    get rightPanelStyle(): Record<string, string> {
      if (this.isMobileViewport) {
        return {};
      }

      return {
        width: `${this.rightPanelWidthPercent}%`,
        flex: '0 0 auto'
      };
    }

    syncViewportState(): void {
      this.isMobileViewport = window.innerWidth <= 768;
      if (this.isMobileViewport) {
        this.stopResize();
      }
    }

    startResize(event: MouseEvent): void {
      if (this.isMobileViewport) {
        return;
      }
      if (event.button !== 0) {
        return;
      }

      event.preventDefault();
      this.isResizing = true;
      this.addResizeListeners();
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    handleResizeMouseMove(event: MouseEvent): void {
      if (!this.isResizing) {
        return;
      }
      if ((event.buttons & 1) !== 1) {
        this.stopResize();
        return;
      }

      const mainLayout = this.$refs.mainLayout as HTMLElement | undefined;
      if (!mainLayout) {
        return;
      }

      const rect = mainLayout.getBoundingClientRect();
      if (rect.width <= 0) {
        return;
      }

      const rightWidthPx = rect.right - event.clientX;
      const widthPercent = (rightWidthPx / rect.width) * 100;
      this.rightPanelWidthPercent = Math.min(
        this.maxRightPanelWidthPercent,
        Math.max(this.minRightPanelWidthPercent, widthPercent)
      );
    }

    stopResize(): void {
      this.isResizing = false;
      this.removeResizeListeners();
      this.restoreBodyInteractionStyles();
    }

    resetPanelWidth(): void {
      this.rightPanelWidthPercent = 40;
    }

    addResizeListeners(): void {
      document.addEventListener('mousemove', this.boundResizeMouseMove);
      document.addEventListener('mouseup', this.boundResizeMouseUp);
    }

    removeResizeListeners(): void {
      document.removeEventListener('mousemove', this.boundResizeMouseMove);
      document.removeEventListener('mouseup', this.boundResizeMouseUp);
    }

    restoreBodyInteractionStyles(): void {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    // 返回上一页
    goBack(): void {
      this.emitGoBack();
    }

    // 处理状态标签点击
    handleStatusTagClick(): void {
      this.editModalVisible = true;
    }

    // 处理编辑取消
    handleEditCancel(): void {
      this.editModalVisible = false;
    }

    handleEditSuccess(statusData: {
      timeLiness: string;
      categoryMain?: string;
      categoryId?: string;
      effectivenessLevel?: string;
      effectDate?: string;
      legalSource?: string;
      department?: string[];
      documentNo?: string;
      appendix?: boolean;
      publishDateStr?: string;
    }): void {
      this.emitUpdateDocumentStatus(statusData);
      this.editModalVisible = false;
    }

    getModalContainer(): Element {
      return (this.$refs.documentViewerContainer as Element) || document.body;
    }

    // 下载文档
    async downloadDocument(): Promise<void> {
      let hideLoading = null;
      try {
        // 根据文档分类或来源页面决定文件格式：法规汇编下载 docx，其他下载 pdf
        const sourcePath = this.$route.query.source as string;
        const routePath = sourcePath || this.$route.path;
        const assemblyCategoryMain: string | undefined = this.document.assemblyCategoryMain;
        const isRegulationByAssembly =
          typeof assemblyCategoryMain === 'string' && assemblyCategoryMain.includes('法规汇编');
        const isRegulationByRoute = routePath.includes('/regulationCompilation');
        const isRegulation = isRegulationByAssembly || isRegulationByRoute;
        const fileExtension = isRegulation ? 'docx' : 'pdf';

        hideLoading = this.$message.loading(`正在准备下载: ${this.document.title}`, 0);

        const result = await this.$roadLawyerService.downloadRuleFile({
          searchId: this.document.id
        });

        if (hideLoading) {
          hideLoading();
        }

        downloadFileWithMessage(result, {
          fileName: `${this.document.title}.${fileExtension}`,
          showMessage: true,
          messageService: this.$message
        });
      } catch (error) {
        if (hideLoading) {
          hideLoading();
        }
        console.error('下载失败:', error);
        this.$message.error('下载失败，请检查网络连接后重试');
      }
    }

    // 发送请求前处理
    beforeBtnEnter(data: { textContent: string; enableNetworkQuery: boolean }) {
      // 准备请求参数 - 使用 JSON 格式
      const userId: string = this.$store.state.auth.id;

      this.fetchParams = JSON.stringify({
        searchId: this.document.id,
        userId,
        question: data.textContent,
        enableNetworkQuery: data.enableNetworkQuery
      });

      // 清空上条文本
      this.tempText = '';
    }

    // 处理响应数据
    onBtnEnter(item: string) {
      const aiChat = this.$refs.aiChat as any;
      const chatList = aiChat.chatList;
      const { tempTxt, newChatList } = getFetchFormat(item, this.tempText, chatList);
      this.tempText = tempTxt;
      this.responseChatList = newChatList;
    }

    // Emit 装饰器方法
    @Emit('go-back')
    emitGoBack(): void {
      // 无需返回值
    }

    @Emit('update-document-status')
    emitUpdateDocumentStatus(statusData: {
      timeLiness: string;
      categoryMain?: string;
      categoryId?: string;
      effectivenessLevel?: string;
      effectDate?: string;
      legalSource?: string;
      department?: string[];
      documentNo?: string;
      appendix?: boolean;
      publishDateStr?: string;
    }): {
      timeLiness: string;
      categoryMain?: string;
      categoryId?: string;
      effectivenessLevel?: string;
      effectDate?: string;
      legalSource?: string;
      department?: string[];
      documentNo?: string;
      appendix?: boolean;
      publishDateStr?: string;
    } {
      return statusData;
    }
  }
  export default DocumentViewer;
</script>

<style lang="less">
  @import '~/assets/styles/lawyer.less';

  .document-viewer-wrapper {
    // 基础布局
    .lawyer-document-page {
      height: calc(100vh - 160px);
      display: flex;
      flex-direction: column;
      background-color: var(--lawyer-background);
      box-sizing: border-box;
      overflow: hidden; // 防止页面级别的滚动条
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

    .lawyer-document-meta {
      font-size: 13px;
      color: var(--lawyer-text-light);
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      @media (max-width: 768px) {
        gap: 12px;
        font-size: 12px;
      }
    }

    // 主布局
    .lawyer-main-layout {
      display: flex;
      flex: 1;
      gap: 0;
      min-height: 0; // 允许flex子项收缩
      overflow: hidden; // 防止主布局产生滚动条

      // 响应式布局 - 只在真正的移动设备上切换为垂直布局
      @media (max-width: 768px) {
        flex-direction: column;
        gap: 12px;
      }
    }

    .lawyer-main-layout-resizing {
      cursor: col-resize;
    }

    // 左侧文档区域
    .lawyer-document-left {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0; // 防止flex子项溢出
      min-height: 0; // 允许内容滚动

      @media (max-width: 768px) {
        height: 60vh; // 小屏幕时限制高度
        min-height: 400px; // 确保最小高度
      }
    }

    .lawyer-resize-handle {
      flex: 0 0 14px;
      cursor: col-resize;
      position: relative;
      user-select: none;
      touch-action: none;

      @media (max-width: 768px) {
        display: none;
      }

      &::before {
        content: '';
        position: absolute;
        left: 50%;
        top: 0;
        bottom: 0;
        width: 2px;
        transform: translateX(-50%);
        background: var(--lawyer-border);
        border-radius: 2px;
        transition: background-color 0.2s ease;
      }

      &:hover::before,
      &.lawyer-resize-handle-active::before {
        background: #1890ff;
      }
    }

    .lawyer-resize-mask {
      position: fixed;
      inset: 0;
      z-index: 1000;
      cursor: col-resize;
      background: transparent;
      user-select: none;
    }

    // 文档查看器
    .lawyer-document-viewer {
      flex: 1;
      background: var(--lawyer-surface);
      display: flex;
      flex-direction: column;
      height: 100%;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      min-height: 0; // 允许内容滚动

      .ant-card-body {
        padding: 0;
        display: flex;
        flex-direction: column;
        height: 100%;
        flex: 1;
        min-height: 0; // 允许内容滚动
        overflow: hidden; // 防止卡片body的滚动条
      }
    }

    // 右侧AI问答区域
    .lawyer-document-right {
      background: #fff;
      flex: 0 0 auto;

      .card {
        border: none;
        height: calc(100vh - 310px);
      }

      min-height: 0; // 允许内容滚动
      overflow: hidden; // 防止右侧区域产生滚动条

      @media (max-width: 768px) {
        width: 100%;
        min-height: 500px; // 确保足够的最小高度
        height: auto; // 改为自适应高度
        flex: 1 1 auto;
      }
    }

    // 文档头部（在卡片内）
    .lawyer-document-header {
      padding: 8px;
      border-bottom: 1px solid var(--lawyer-border);
      background: var(--lawyer-surface);

      .lawyer-header-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
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
      height: 100%;
      overflow: hidden; // 移除滚动，避免与内层DivTextSearch冲突
      min-height: 0; // 确保可以滚动
      // 移除max-height，让它自然适应容器高度
    }

    .lawyer-iframe-preview {
      width: 100%;
      height: 100%;
      flex: 1;
      border: none;
      min-height: 0;
    }

    // 编辑弹窗样式
    .lawyer-edit-content {
      .ant-form-model-item {
        margin-bottom: 16px;
      }

      .ant-form-model-item-label {
        font-weight: 500;
        color: #333;
      }

      .ant-select,
      .ant-cascader,
      .ant-date-picker,
      .ant-input {
        width: 100%;
      }
    }

    // 针对浏览器缩放的特殊处理
    @media (min-width: 769px) {
      .lawyer-main-layout {
        // 确保在桌面端始终保持左右布局
        flex-direction: row !important;
      }

      .lawyer-document-left {
        // 桌面端不限制高度
        height: auto !important;
      }

      .lawyer-document-right {
        // 宽度由拖拽状态控制
        min-width: 0;
      }
    }
  }
</style>
