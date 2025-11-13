<template>
  <div ref="documentViewerContainer" class="document-viewer-wrapper">
    <div class="lawyer-document-page">
      <!-- 主要内容区 -->
      <div class="lawyer-main-layout">
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

                  <!-- 文档元数据 -->
                  <div class="lawyer-document-meta">
                    <span v-for="(item, index) in documentMetaItems" :key="index">
                      <a-icon :type="item.icon" /> {{ item.content }}
                    </span>
                  </div>
                </div>

                <div class="lawyer-header-actions">
                  <a-button class="lawyer-back-btn" @click="goBack">
                    <a-icon type="arrow-left" />
                    返回
                  </a-button>
                  <a-button type="primary" @click="downloadDocument"> 下载 </a-button>
                </div>
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
            <!-- 否则使用 markdown 预览，并包含文本搜索功能 -->
            <lawyer-common-div-text-search v-else>
              <div
                ref="documentContent"
                class="lawyer-document-content lawyer-scrollable lawyer-markdown-content"
                tabindex="0"
              >
                <v-md-preview :text="document.content" />
              </div>
            </lawyer-common-div-text-search>
          </a-card>
        </div>

        <!-- 右侧：文档智能问答 -->
        <div class="lawyer-document-right">
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
            width="calc(40vw - 40px)"
            @beforeBtnEnter="beforeBtnEnter"
            @onBtnEnter="onBtnEnter"
          />
        </div>
      </div>

      <!-- 编辑文档信息模态框 -->
      <a-modal
        title="编辑文档信息"
        :visible="editModalVisible"
        :width="1000"
        ok-text="确认"
        cancel-text="取消"
        :dialog-style="{ top: '20px' }"
        class="modalBodyH152"
        :get-container="() => $refs.documentViewerContainer"
        @ok="handleEditConfirm"
        @cancel="handleEditCancel"
      >
        <div class="lawyer-edit-content">
          <a-form-model
            ref="form"
            :model="formData"
            :label-col="{ span: 5 }"
            :wrapper-col="{ span: 19 }"
          >
            <!-- 时效性 -->
            <a-form-model-item v-if="fieldConfig.showTimeliness" label="时效性" prop="timeLiness">
              <a-select v-model="formData.timeLiness" placeholder="请选择时效性">
                <a-select-option value="待生效">待生效</a-select-option>
                <a-select-option value="已施行">已施行</a-select-option>
                <a-select-option value="已修订">已修订</a-select-option>
                <a-select-option value="已废止">已废止</a-select-option>
              </a-select>
            </a-form-model-item>

            <!-- 分类 -->
            <a-form-model-item v-if="fieldConfig.showCategory" label="分类" prop="categoryPath">
              <a-cascader
                v-model="formData.categoryPath"
                :options="tagOptions"
                placeholder="请选择分类"
                :show-search="true"
                :change-on-select="true"
                style="width: 100%"
              />
            </a-form-model-item>

            <!-- 发布时间 -->
            <a-form-model-item
              v-if="fieldConfig.showPublishDate"
              label="发布时间"
              prop="publishDate"
            >
              <a-date-picker
                v-model="formData.publishDate"
                style="width: 100%"
                placeholder="请选择发布时间"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
            </a-form-model-item>

            <!-- 发文字号 -->
            <a-form-model-item v-if="fieldConfig.showDocumentNo" label="发文字号" prop="documentNo">
              <a-input v-model="formData.documentNo" placeholder="请输入发文字号" />
            </a-form-model-item>
            <!-- 是否附录 -->
            <a-form-model-item v-if="fieldConfig.showAppendix" label="是否附录" prop="appendix">
              <a-switch v-model="formData.appendix" />
              <span style="margin-left: 8px; color: #666; font-size: 12px">
                {{ formData.appendix ? '是' : '否' }}
              </span>
            </a-form-model-item>

            <!-- 效力位阶 -->
            <a-form-model-item
              v-if="fieldConfig.showEffectivenessLevel"
              label="效力位阶"
              prop="effectivenessLevel"
            >
              <a-select v-model="formData.effectivenessLevel" placeholder="请选择效力位阶">
                <a-select-option value="法律法规">法律法规</a-select-option>
                <a-select-option value="部门规章规范性文件">部门规章规范性文件</a-select-option>
                <a-select-option value="自律规则">自律规则</a-select-option>
                <a-select-option value="其他">其他</a-select-option>
              </a-select>
            </a-form-model-item>

            <!-- 来源 -->
            <a-form-model-item v-if="fieldConfig.showSource" label="来源" prop="legalSource">
              <a-select v-model="formData.legalSource" placeholder="请选择来源">
                <a-select-option
                  v-for="option in websiteOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </a-select-option>
              </a-select>
            </a-form-model-item>

            <!-- 生效时间 -->
            <a-form-model-item v-if="fieldConfig.showEffectDate" label="生效时间" prop="effectDate">
              <a-date-picker
                v-model="formData.effectDate"
                style="width: 100%"
                placeholder="请选择生效时间"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
            </a-form-model-item>

            <!-- 责任部门 -->
            <a-form-model-item v-if="fieldConfig.showDepartment" label="责任部门" prop="department">
              <a-select
                v-model="formData.department"
                mode="multiple"
                placeholder="请选择责任部门"
                :allow-clear="true"
                :max-tag-count="2"
                max-tag-placeholder="..."
              >
                <a-select-option
                  v-for="option in departmentOptions"
                  :key="option.id"
                  :value="option.value"
                >
                  {{ option.label }}
                </a-select-option>
              </a-select>
            </a-form-model-item>
          </a-form-model>
        </div>
      </a-modal>
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
  import { getFetchFormat } from '~/utils/aiFetchFormat';
  import CommonAiChat from '~/components/common/AiChat.vue';

  @Component({
    name: 'document-viewer',
    components: {
      CommonAiChat
    }
  })
  class DocumentViewer extends Vue {
    @Prop({ required: true }) document!: DocumentViewerData;

    // AI助手相关
    responseChatList: ChatListType[] = [];
    fetchHeaders: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    fetchParams: BodyInit | null = null;
    fetchUrl: string = api.lawyer.getAIRobotAnswer;
    splitTxt: string = `End\n\n`;
    tempText: string = '';

    // 编辑状态相关
    editModalVisible: boolean = false;
    isAdmin: boolean = false;

    // 表单数据
    formData: {
      timeLiness?: string;
      effectivenessLevel?: string;
      categoryPath?: string[];
      legalSource?: string;
      publishDate?: string;
      effectDate?: string;
      department?: string[];
      documentNo?: string;
      appendix?: boolean;
    } = {
      timeLiness: undefined,
      effectivenessLevel: undefined,
      categoryPath: [],
      legalSource: undefined,
      publishDate: undefined,
      effectDate: undefined,
      department: [],
      documentNo: undefined,
      appendix: false
    };

    // 标签分类相关
    tagOptions: CascaderOption[] = [];
    websiteOptions: WebsiteOption[] = [];
    departmentOptions: DepartmentOption[] = []; // 存储部门数据

    // 组件挂载时初始化欢迎消息
    async mounted(): Promise<void> {
      this.initWelcomeMessage();
      await this.checkAdminPermission();
      await this.loadCategoryOptions();
      await this.loadWebsiteOptions();
      await this.loadDepartmentData();
    }

    // 检查管理员权限
    async checkAdminPermission(): Promise<void> {
      try {
        this.isAdmin = await this.$roadLawyerService.getAdmin({
          empId: this.$store.state.auth.id
        });
      } catch (error) {
        console.error('检查管理员权限失败:', error);
        this.isAdmin = false;
      }
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
            processedCategories = categories[0].children || [];
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

    // 加载部门数据
    async loadDepartmentData(): Promise<void> {
      try {
        const response = await this.$roadLawyerService.getDepartmentData({
          current: 1,
          size: 999
        });
        if (response.length) {
          this.departmentOptions = response.map(dept => ({
            value: dept.name,
            label: dept.name,
            id: dept.id
          }));
        } else {
          console.warn('获取部门数据为空');
          this.departmentOptions = [];
        }
      } catch (error) {
        console.error('加载部门数据失败:', error);
        this.departmentOptions = [];
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
        showDepartment: true,
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

    // 返回上一页
    goBack(): void {
      this.emitGoBack();
    }

    // 处理状态标签点击
    handleStatusTagClick(): void {
      // 只有管理员才能点击编辑
      // if (!this.isAdmin) {
      //     this.$message.warning('只有管理员才能编辑文档信息')
      //     return
      // }
      this.showEditModal();
    }

    // 显示编辑模态框
    showEditModal(): void {
      console.log('🚀 ~ DocumentViewer ~ showEditModal ~ this.document:', this.document);

      // 初始化表单数据
      this.fillFormData();
      this.editModalVisible = true;
    }

    // 填充表单数据（用于回显）
    fillFormData(): void {
      // 回显时效性
      this.formData.timeLiness = this.document.timeLiness || undefined;

      // 回显效力位阶
      this.formData.effectivenessLevel = this.document.effectivenessLevel || undefined;

      // 回显分类
      this.formData.categoryPath = [];

      // 尝试从不同的字段获取分类信息
      // 优先使用categoryId字段（如果存在）
      if (this.document.categoryId) {
        // 如果有categoryId，需要找到完整的分类路径
        const categoryPath = this.getCategoryPathById(this.document.categoryId);
        this.formData.categoryPath = categoryPath;
      } else if (this.document.categoryMain) {
        // 新逻辑：categoryMain现在是最终选择的分类名称，不再是父级
        // 根据categoryMain的名称获取对应的分类ID和完整路径
        const categoryPath = this.getCategoryPathByName(this.document.categoryMain);
        this.formData.categoryPath = categoryPath;
      } else if (this.document.topicCategory) {
        // 如果有topicCategory字段，尝试根据名称获取完整路径
        const categoryPath = this.getCategoryPathByName(this.document.topicCategory);
        this.formData.categoryPath = categoryPath;
      } else if (this.document.tags && this.document.tags.length > 0) {
        // 如果tags字段存在，直接使用（假设已经是ID）
        this.formData.categoryPath = [...this.document.tags];
      }
      // 回显来源
      this.formData.legalSource = this.document.legalSource || this.document.publisher || undefined;

      // 回显发布时间 - 确保不是无效的日期字符串
      const publishDate = this.document.date;
      this.formData.publishDate = publishDate || undefined;

      // 回显生效时间 - 确保不是无效的日期字符串
      const effectiveDate = this.document.effectiveDate;
      this.formData.effectDate = effectiveDate || undefined;
      // 回显责任部门
      if (this.document.department) {
        // 兼容字符串和数组格式
        if (Array.isArray(this.document.department)) {
          this.formData.department = this.document.department;
        } else if (typeof this.document.department === 'string') {
          // 如果是字符串，转换为数组（支持逗号分隔的字符串）
          this.formData.department = this.document.department
            .split(',')
            .map((dept: string) => dept.trim())
            .filter((dept: string) => dept);
        } else {
          this.formData.department = [];
        }
      } else {
        this.formData.department = [];
      }

      // 回显发文字号 - 确保不是无效值
      const fileNumber = this.document.fileNumber;
      if (
        fileNumber &&
        fileNumber !== '暂无' &&
        fileNumber !== 'undefined' &&
        fileNumber !== 'null'
      ) {
        this.formData.documentNo = fileNumber;
      } else {
        this.formData.documentNo = undefined;
      }

      // 回显是否附录
      this.formData.appendix = !!this.document.appendix;
    }

    // 处理编辑确认
    async handleEditConfirm(): Promise<void> {
      let hideLoading = null;
      try {
        hideLoading = this.$message.loading('正在更新文档信息...', 0);

        // 准备更新参数 - 参考新增参数配置
        const updateParams = {
          searchId: this.document.id,
          appendix: this.formData.appendix,
          timeLiness: this.formData.timeLiness,
          effectivenessLevel: this.formData.effectivenessLevel,
          legalSource: this.formData.legalSource,
          publishDateStr: this.formData.publishDate,
          effectDateStr: this.formData.effectDate,
          department: this.formData.department,
          documentNo: this.formData.documentNo,
          categoryId: '',
          categoryMain: ''
        };

        // 处理分类路径 - 根据新的后端逻辑调整
        if (this.formData.categoryPath && this.formData.categoryPath.length > 0) {
          // 新逻辑：categoryMain是最终选择的分类名称，categoryId是最终选择的分类ID
          const lastCategoryId = this.formData.categoryPath[this.formData.categoryPath.length - 1];
          updateParams.categoryId = lastCategoryId;
          updateParams.categoryMain = this.getCategoryNameById(lastCategoryId);

          // 根据新逻辑，不再需要设置categorySub，因为categoryMain已经是最终选择的分类
        }

        console.log('编辑更新参数:', updateParams);

        const result = await this.$roadLawyerService.updateRuleSourceDetail(updateParams);

        if (!result.success) {
          throw new Error(result.message || '更新失败');
        }

        if (hideLoading) {
          hideLoading();
        }

        // 更新文档状态 - 传递所有更新的字段
        this.emitUpdateDocumentStatus({
          timeLiness: this.formData.timeLiness || '已施行',
          categoryMain: updateParams.categoryMain,
          categoryId: updateParams.categoryId,
          effectivenessLevel: this.formData.effectivenessLevel,
          effectDate: this.formData.effectDate,
          legalSource: this.formData.legalSource,
          department: this.formData.department,
          documentNo: this.formData.documentNo,
          appendix: this.formData.appendix,
          publishDateStr: this.formData.publishDate
        });

        this.$message.success(`文档信息已更新`);
        this.editModalVisible = false;
      } catch (error) {
        if (hideLoading) {
          hideLoading();
        }
        console.error('更新文档信息失败:', error);
        this.$message.error('更新文档信息失败，请重试');
      }
    }

    // 处理编辑取消
    handleEditCancel(): void {
      this.editModalVisible = false;
    }

    // 根据分类ID获取分类名称
    getCategoryNameById(categoryId: string): string {
      const findCategoryName = (options: CascaderOption[], id: string): string => {
        for (const option of options) {
          if (option.value === id) {
            return option.label;
          }
          if (option.children && option.children.length > 0) {
            const childName = findCategoryName(option.children, id);
            if (childName) {
              return childName;
            }
          }
        }
        return '';
      };
      return findCategoryName(this.tagOptions, categoryId);
    }

    // 根据分类ID获取完整的分类路径（包含所有父级）
    getCategoryPathById(categoryId: string): string[] {
      const findCategoryPath = (
        options: CascaderOption[],
        id: string,
        path: string[] = []
      ): string[] => {
        for (const option of options) {
          const currentPath = [...path, option.value];
          if (option.value === id) {
            return currentPath;
          }
          if (option.children && option.children.length > 0) {
            const childPath = findCategoryPath(option.children, id, currentPath);
            if (childPath.length > 0) {
              return childPath;
            }
          }
        }
        return [];
      };
      return findCategoryPath(this.tagOptions, categoryId);
    }

    // 根据分类名称获取完整的分类路径（包含所有父级）
    getCategoryPathByName(categoryName: string): string[] {
      const findCategoryPath = (
        options: CascaderOption[],
        name: string,
        path: string[] = []
      ): string[] => {
        for (const option of options) {
          const currentPath = [...path, option.value];
          if (option.label === name) {
            return currentPath;
          }
          if (option.children && option.children.length > 0) {
            const childPath = findCategoryPath(option.children, name, currentPath);
            if (childPath.length > 0) {
              return childPath;
            }
          }
        }
        return [];
      };
      return findCategoryPath(this.tagOptions, categoryName);
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
      department?: string | string[];
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
      department?: string | string[];
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
      padding: 16px;
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
      gap: 16px;
      min-height: 0; // 允许flex子项收缩
      overflow: hidden; // 防止主布局产生滚动条

      // 响应式布局 - 只在真正的移动设备上切换为垂直布局
      @media (max-width: 768px) {
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
      min-height: 0; // 允许内容滚动

      @media (max-width: 768px) {
        height: 60vh; // 小屏幕时限制高度
        min-height: 400px; // 确保最小高度
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
        // 桌面端保持固定宽度
        width: 40%;
      }
    }
  }
</style>
