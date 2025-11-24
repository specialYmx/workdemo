<template>
  <div class="knowledge-page-wrapper">
    <div>
      <!-- 整体内容容器 -->
      <div class="lawyer-content-wrapper">
        <!-- 搜索和筛选区域 -->
        <lawyer-knowledge-filter-options
          :category-name="categoryName"
          :search-text.sync="searchText"
          :search-buttons="searchButtons"
          :timeliness-filter.sync="timelinessFilter"
          :effectiveness-level-filter.sync="effectivenessLevelFilter"
          :topic-category.sync="topicCategory"
          :filter-source.sync="filterSource"
          :publish-date.sync="publishDate"
          :sort-order.sync="sortOrder"
          :document-number-filter.sync="documentNumberFilter"
          :department-filter.sync="departmentFilter"
          :is-appendix-filter.sync="isAppendixFilter"
          :website-options="websiteOptions"
          :topic-category-options="topicCategoryOptions"
          :department-options="departmentOptions"
          @search="onExactSearch"
          @show-add-document-modal="showAddDocumentModal"
          @filter-change="onFilterChange"
          @search-input-clear="onSearchInputClear"
          :isAdmin="isAdmin"
          @show-export-modal="showExportModal"
        />

        <!-- 文档列表 -->
        <lawyer-knowledge-document-list
          :loading="listLoading"
          :documents="allDocuments"
          :current-page="currentPage"
          :total-documents="totalDocuments"
          :page-size="pageSize"
          :doc-actions="documentActions"
          @page-change="onPageChange"
          @show-size-change="onShowSizeChange"
          :search-keyword="searchKeyword"
        />
      </div>

      <!-- 文档上传组件 -->
      <lawyer-common-file-upload-modal
        :visible="uploadModalVisible"
        :title="uploadModalTitle"
        :document-id="currentUploadDocId"
        :document-title="currentUploadDocTitle"
        :category-name="categoryName"
        :time-liness-options="timelinessOptions"
        :website-options="websiteOptions"
        :category-options="topicCategoryOptions"
        :department-options="departmentOptions"
        :config="uploadConfig"
        @cancel="handleUploadCancel"
        @complete="handleUploadComplete"
        @upload-success="handleUploadSuccess"
      />

      <!-- 导出Word模态框 -->
      <a-modal
        v-model="exportModalVisible"
        title="导出Word文档"
        :width="400"
        @ok="handleExportConfirm"
        @cancel="handleExportCancel"
      >
        <div style="padding: 20px 0">
          <p style="margin-bottom: 16px; color: rgba(0, 0, 0, 0.65)">请选择要导出的册数：</p>
          <a-checkbox-group v-model="selectedCopies">
            <a-checkbox value="上"> 上册 </a-checkbox>
            <a-checkbox value="下"> 下册 </a-checkbox>
          </a-checkbox-group>
        </div>
      </a-modal>
    </div>
  </div>
</template>

<script lang="ts">
  import { Component, Vue } from 'nuxt-property-decorator';
  import type {
    KnowledgeDataItem,
    SearchButton,
    WebsiteOption,
    FilterOption,
    DocumentAction,
    KnowledgeUploadConfig,
    CascaderOption,
    RouteQuery,
    RuleSourceQueryParams,
    LegalCategoryItem,
    DepartmentOption
  } from '~/model/LawyerModel';
  import { downloadFileWithMessage } from '~/utils/personal';
  import { formatDate } from '~/utils/date';
  import { LawyerStoreModule } from '~/store/lawyer';

  @Component({ name: 'lawyer-knowledge-index-component' })
  class LawyerKnowledgeIndexComponent extends Vue {
    searchText: string = '';
    searchKeyword: string = '';
    searchLoading: boolean = false;
    filterSource: string = '';
    sortOrder: string = '';
    topicCategory: string[] = [];
    timelinessFilter: string = '';
    effectivenessLevelFilter: string = '';
    publishDate: string | null = '';
    isFavoritesMode: boolean = false;
    // 新增筛选条件
    isAppendixFilter: string = '';
    documentNumberFilter: string = '';
    departmentFilter: string = '';
    listLoading: boolean = true;
    currentPage: number = 1;
    pageSize: number = 10;
    totalDocuments: number = 0;
    allDocuments: KnowledgeDataItem[] = []; // 当前页数据
    websiteOptions: WebsiteOption[] = [];
    uploadModalVisible: boolean = false;
    currentUploadDocId: string = '';
    currentUploadDocTitle: string = '';
    isAdmin: boolean = false;
    categoryData: LegalCategoryItem[] = []; // 存储从接口获取的分类数据
    isAddMode: boolean = false; // 是否为新增模式
    departmentOptions: DepartmentOption[] = []; // 存储部门数据
    exportModalVisible: boolean = false; // 导出模态框显示状态
    selectedCopies: string[] = ['上', '下']; // 默认选中上册和下册

    get uploadConfig(): KnowledgeUploadConfig {
      return {
        multiple: false,
        maxFileSize: 500 * 1024 * 1024,
        maxFileCount: 1,
        autoUpload: false,
        acceptTypes: '.doc,.docx,.pdf',
        uploadText: '点击或拖拽文件到此区域上传',
        hintText: `仅支持PDF、DOC、DOCX 格式，文件大小不超过 500MB`
      };
    }

    get uploadModalTitle(): string {
      return this.isAddMode ? '新增文档' : `更新文档: ${this.currentUploadDocTitle}`;
    }

    get categoryName(): string {
      // 根据路由获取分类名称，用于显示
      const routePath = this.$route.path;

      // 路由路径与分类名称的映射
      const routeMap: Record<string, string> = {
        '/lawyerKnowledge': '大家智库',
        '/regulationCompilation': '法规汇编',
        '/punishmentCompilation': '处罚汇编',
        '/researchCollection': '研究集锦',
        '/legalComplianceQuarterly': '法律合规季刊',
        '/newRegulationInterpretation': '新规解读',
        '/institutionLibrary': '内部制度库', // 企业内部管理制度和规范文件
        '/policyLibrary': '政策库',
        '/caseLibrary': '案例库'
      };

      // 精确匹配路由路径
      if (routeMap[routePath] || routeMap[routePath.replace(/\/$/, '')]) {
        return routeMap[routePath] || routeMap[routePath.replace(/\/$/, '')];
      }

      // 模糊匹配（包含路径）
      for (const [path, name] of Object.entries(routeMap)) {
        if (routePath.includes(path)) {
          return name;
        }
      }

      // 默认返回
      return '大家智库';
    }

    get searchButtons(): SearchButton[] {
      return [
        {
          text: '搜索',
          icon: 'search',
          type: 'primary',
          loading: this.searchLoading,
          isActive: false,
          handler: this.onSearch
        },
        {
          text: '精确搜索',
          icon: 'search',
          type: 'default',
          loading: this.searchLoading,
          isActive: false,
          handler: this.onExactSearch
        },
        {
          text: '我的收藏',
          icon: 'star',
          isActive: this.isFavoritesMode,
          handler: this.toggleFavorites
        }
      ];
    }

    get topicCategoryOptions(): CascaderOption[] {
      return this.convertToCascaderOptions(this.categoryData);
    }

    get documentActions(): Record<string, DocumentAction[]> {
      const actions: Record<string, DocumentAction[]> = {};
      this.allDocuments.forEach(doc => {
        actions[doc.id] = this.getDocActions(doc);
      });
      return actions;
    }

    get timelinessOptions(): FilterOption[] {
      return [
        { value: '待生效', label: '待生效' },
        { value: '已施行', label: '已施行' },
        { value: '已修订', label: '已修订' },
        { value: '已废止', label: '已废止' }
      ];
    }

    created(): void {
      // 根据不同页面设置默认排序方式：
      this.sortOrder = this.getDefaultSortOrderByRoute();
    }

    async mounted(): Promise<void> {
      await this.checkAdminPermission();
      await this.loadWebsiteOptions();
      await this.loadLegalCategory();
      await this.loadDepartmentData();
      this.loadDocuments();
    }

    async activated(): Promise<void> {
      // 检查当前页面路径是否需要刷新
      const currentPath = this.$route.path;
      const refreshFlags = LawyerStoreModule?.refreshFlags;

      if (refreshFlags && refreshFlags[currentPath]) {
        console.log(`检测到 ${this.categoryName} 需要刷新数据`);
        await this.loadDocuments();

        // 清除刷新标记
        LawyerStoreModule.clearPageRefresh(currentPath);
        this.$message.success('数据已更新');
      }
    }

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

    isDocumentFavorite(doc: KnowledgeDataItem): boolean {
      return doc.isCollect || false;
    }

    async onSearch(): Promise<void> {
      this.searchLoading = true;
      try {
        this.searchKeyword = this.searchText;
        await this.loadDocuments('normal');
      } catch (error) {
        console.error('搜索失败:', error);
      } finally {
        this.searchLoading = false;
      }
    }

    async onExactSearch(): Promise<void> {
      this.searchLoading = true;
      try {
        this.currentPage = 1;
        this.searchKeyword = this.searchText;
        await this.loadDocuments('exact');
      } catch (error) {
        console.error('精确搜索失败:', error);
      } finally {
        this.searchLoading = false;
      }
    }

    async onFilterChange(): Promise<void> {
      this.currentPage = 1;
      await this.loadDocuments('exact');
    }

    onSearchInputClear(): void {
      // 处理输入框清空事件
      this.searchText = '';
      this.searchKeyword = '';
      // 自动执行搜索以显示所有结果
      this.loadDocuments('default');
    }

    async toggleFavorites(): Promise<void> {
      this.isFavoritesMode = !this.isFavoritesMode;
      this.currentPage = 1;
      await this.loadDocuments();
      this.$message.info(this.isFavoritesMode ? '已切换至收藏夹' : '已退出收藏夹模式');
    }

    getDocActions(doc: KnowledgeDataItem): DocumentAction[] {
      const isFavorite: boolean = this.isDocumentFavorite(doc);
      const actions: DocumentAction[] = [
        {
          text: '查看',
          type: 'primary',
          handler: () => this.viewDocument(doc)
        },
        {
          text: '下载',
          handler: () => this.downloadDocument(doc)
        }
      ];

      // 只有在非收藏模式下才显示收藏按钮
      if (!this.isFavoritesMode) {
        actions.push({
          type: isFavorite ? 'primary' : 'default',
          text: isFavorite ? '取消收藏' : '收藏',
          handler: () => this.collectDocument(doc)
        });
      }

      // 只有管理员才能看到上传更新和移除按钮
      // if (this.isAdmin) {
      actions.push(
        {
          text: '上传更新',
          class: 'lawyer-btn-upload',
          handler: () => this.uploadDocument(doc.id, doc.ruleName)
        },
        {
          text: '移除',
          type: 'danger',
          handler: () => this.removeDocument(doc)
        }
      );
      // }

      return actions;
    }

    async viewDocument(doc: KnowledgeDataItem): Promise<void> {
      this.$message.info(`正在打开: ${doc.ruleName}`);
      const isRevoke: boolean = !!(doc.revokeDateTimestamp || doc.revokeDateStr);
      const query: RouteQuery = {
        id: doc.id,
        pageTitle: doc.ruleName,
        source: this.$route.path, // 传递来源页面路径，用于详情页面正确获取专题分类
        ...(isRevoke ? { isRevoke: 'true' } : {})
      };

      // 只要数据来源不等于“2”，则获取预览链接以使用 iframe 预览
      if (doc.dataSource !== '2') {
        try {
          const previewUrl = await this.$roadLawyerService.getPreviewUrl({ id: doc.id });
          if (previewUrl) {
            query.iframeUrl = previewUrl;
          }
        } catch (error) {
          console.error('获取预览链接失败:', error);
        }
      }

      this.$router.push({
        path: '/lawyerKnowledge/detail',
        query
      });
    }

    async downloadDocument(doc: KnowledgeDataItem): Promise<void> {
      let hideLoading = null;
      try {
        // 根据文档分类或当前页面决定文件格式：法规汇编下载 docx，其他下载 pdf
        const assemblyCategoryMain: string | undefined = doc.assemblyCategoryMain;
        const isRegulationByAssembly =
          typeof assemblyCategoryMain === 'string' && assemblyCategoryMain.includes('法规汇编');
        const routePath = this.$route.path || '';
        const isRegulationByRoute = routePath.includes('/regulationCompilation');
        const isRegulationDoc = isRegulationByAssembly || isRegulationByRoute;
        const fileExtension = isRegulationDoc ? 'docx' : 'pdf';

        hideLoading = this.$message.loading(`正在准备下载: ${doc.ruleName}`, 0);

        const result = await this.$roadLawyerService.downloadRuleFile({
          searchId: doc.id
        });

        hideLoading();

        downloadFileWithMessage(result, {
          fileName: `${doc.ruleName}.${fileExtension}`,
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

    async collectDocument(doc: KnowledgeDataItem): Promise<void> {
      const isCurrentlyFavorite: boolean = this.isDocumentFavorite(doc);
      const newCollectStatus: boolean = !isCurrentlyFavorite;

      try {
        const params = {
          searchId: doc.id,
          empId: this.$store.state.auth.id,
          collect: newCollectStatus
        };
        const success = await this.$roadLawyerService.saveOrCancelCollect(params);
        if (success) {
          // 接口调用成功后再更新状态，确保响应式更新
          const docIndex = this.allDocuments.findIndex(item => item.id === doc.id);
          if (docIndex !== -1) {
            // 使用 Vue.set 或者直接修改数组元素来触发响应式更新
            this.$set(this.allDocuments[docIndex], 'isCollect', newCollectStatus);
          }

          if (newCollectStatus) {
            this.$message.success(`已收藏: ${doc.ruleName}`);
          } else {
            this.$message.info(`已取消收藏: ${doc.ruleName}`);
            if (this.isFavoritesMode) {
              // 在收藏模式下取消收藏时，从列表中移除该文档
              this.allDocuments.splice(docIndex, 1);
              this.totalDocuments = this.allDocuments.length;
            }
          }
        } else {
          this.$message.error('操作失败，请重试');
        }
      } catch (error) {
        console.error('收藏操作失败:', error);
        this.$message.error('操作失败，请重试');
      }
    }

    uploadDocument(docId: string, docTitle: string): void {
      this.isAddMode = false;
      this.uploadModalVisible = true;
      this.currentUploadDocId = docId;
      this.currentUploadDocTitle = docTitle;
    }

    showAddDocumentModal(): void {
      this.isAddMode = true;
      this.uploadModalVisible = true;
      this.currentUploadDocId = '';
      this.currentUploadDocTitle = '';
    }

    handleUploadCancel(): void {
      this.uploadModalVisible = false;
      this.currentUploadDocId = '';
      this.currentUploadDocTitle = '';
      this.isAddMode = false;
    }

    handleUploadComplete(): void {
      this.uploadModalVisible = false;
      this.currentUploadDocId = '';
      this.currentUploadDocTitle = '';
      this.isAddMode = false;
    }

    handleUploadSuccess(): void {
      this.loadDocuments();
    }

    showExportModal(): void {
      this.exportModalVisible = true;
      this.selectedCopies = ['上', '下']; // 重置为默认选中
    }

    handleExportCancel(): void {
      this.exportModalVisible = false;
    }

    async handleExportConfirm(): Promise<void> {
      if (this.selectedCopies.length === 0) {
        this.$message.warning('请至少选择一个册数');
        return;
      }

      let hideLoading = null;
      try {
        hideLoading = this.$message.loading(
          `正在导出，共${this.selectedCopies.length}册，请稍候...`,
          0
        );

        let successCount = 0;
        let failCount = 0;

        // 获取当前日期，格式为 YYYYMMDD
        const currentDate = formatDate(new Date(), 'yyyyMMdd');

        // 循环下载每一册
        for (const copy of this.selectedCopies) {
          try {
            const result = await this.$roadLawyerService.exportWord({
              copies: copy
            });

            if (result && result.data) {
              downloadFileWithMessage(result, {
                fileName: `保险资金运用相关法律法规及规范性文件汇编（${copy}册）_${currentDate}.docx`,
                showMessage: false, // 单个下载不显示提示，统一在最后显示
                messageService: this.$message
              });
              successCount++;
            } else {
              failCount++;
              console.error(`导出${copy}册失败：无返回数据`);
            }
          } catch (error) {
            failCount++;
            console.error(`导出${copy}册失败:`, error);
          }
        }

        if (hideLoading) {
          hideLoading();
        }

        // 显示最终结果
        if (successCount === this.selectedCopies.length) {
          this.$message.success(`成功导出${successCount}册`);
          this.exportModalVisible = false;
        } else if (successCount > 0) {
          this.$message.warning(`成功导出${successCount}册，失败${failCount}册`);
        } else {
          this.$message.error('导出失败，请重试');
        }
      } catch (error) {
        if (hideLoading) {
          hideLoading();
        }
        console.error('导出失败:', error);
        this.$message.error('导出失败，请检查网络连接后重试');
      }
    }

    removeDocument(doc: KnowledgeDataItem): void {
      this.$confirm({
        title: '确定要移除文档吗？',
        content: `文档"${doc.ruleName}"将被移除，此操作不可撤销。`,
        okText: '确认',
        cancelText: '取消',
        onOk: async () => {
          try {
            // 删除前检查当前页数据数量，判断是否需要跳转到前一页
            const isLastItemOnPage = this.allDocuments.length === 1;
            const shouldGoToPreviousPage = isLastItemOnPage && this.currentPage > 1;
            const success = await this.$roadLawyerService.deleteRuleSource({
              id: doc.id
            });
            if (success) {
              this.$message.success(`文档"${doc.ruleName}"已移除`);
              setTimeout(async () => {
                // 如果删除的是当前页最后一条数据且不是第一页，则跳转到前一页
                if (shouldGoToPreviousPage) {
                  this.currentPage -= 1;
                }
                await this.loadDocuments();
              }, 500);
            } else {
              this.$message.error('删除失败，请重试');
            }
          } catch (error) {
            console.error('删除文档失败:', error);
            this.$message.error('删除失败，请重试');
          }
        }
      });
    }

    async onPageChange(page: number): Promise<void> {
      this.currentPage = page;
      // 后端分页，需要重新请求API
      await this.loadDocuments();
    }

    async onShowSizeChange(_current: number, pageSize: number): Promise<void> {
      this.pageSize = pageSize;
      this.currentPage = 1;
      // 后端分页，需要重新请求API
      await this.loadDocuments();
    }

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

    async loadLegalCategory(): Promise<void> {
      try {
        // 根据当前路由动态确定分类ID
        const categoryId = this.getCategoryIdByRoute();
        const response = await this.$roadLawyerService.getLegalCategory({
          id: categoryId
        });
        if (response && response.length > 0) {
          // 大家智库页面获取全量数据，直接使用返回的数据
          // 其他页面取第一个元素的children作为分类数据
          if (!categoryId) {
            // 大家智库页面：全量数据
            this.categoryData = response;
          } else {
            // 其他页面：取第一个元素的children
            this.categoryData = response[0]?.children || [];
          }
        } else {
          console.warn(`获取专题分类数据为空，分类ID: ${categoryId || '全量'}`);
          this.categoryData = [];
        }
      } catch (error) {
        console.error('加载专题分类数据失败:', error);
        this.categoryData = [];
      }
    }

    async loadDepartmentData(): Promise<void> {
      try {
        const response = await this.$roadLawyerService.getDepartmentData({
          current: 1,
          size: 999
        });
        if (response?.length) {
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

    getCategoryIdByRoute(): string | undefined {
      // 根据当前路由确定分类ID
      const routePath = this.$route.path;
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

    // 根据当前路由为不同页面设置默认排序方式
    getDefaultSortOrderByRoute(): string {
      const routePath = this.$route.path || '';

      const publishDateDescDefaultRoutes: string[] = [
        '/regulationCompilation',
        '/punishmentCompilation',
        '/researchCollection',
        '/legalComplianceQuarterly',
        '/newRegulationInterpretation'
      ];
      if (publishDateDescDefaultRoutes.some(path => routePath.includes(path))) {
        return 'desc';
      }
      // 默认仍然按相关度排序（与原有行为一致）
      return '';
    }

    convertToCascaderOptions(categories: LegalCategoryItem[]): CascaderOption[] {
      return categories.map(
        (category: LegalCategoryItem): CascaderOption => ({
          value: category.id,
          label: category.name,
          children: this.convertToCascaderOptions(category.children || [])
        })
      );
    }

    async loadDocuments(searchType: 'normal' | 'exact' | 'default' = 'exact'): Promise<void> {
      this.listLoading = true;
      try {
        const params: RuleSourceQueryParams = {
          empId: this.$store.state.auth.id,
          // 添加分页参数
          page: this.currentPage,
          pageSize: this.pageSize
        };

        // 根据搜索类型设置不同的参数
        if (this.searchText) {
          if (searchType === 'exact') {
            // 精确搜索：使用 keyWord 参数，不传 query
            params.keyWord = this.searchText;
          } else {
            // 普通搜索或默认：使用 query 参数，不传 keyWord
            params.query = this.searchText;
          }
        }
        if (this.timelinessFilter) {
          params.timeLiness = this.timelinessFilter;
        }
        if (this.effectivenessLevelFilter) {
          params.effectivenessLevel = this.effectivenessLevelFilter;
        }
        if (this.topicCategory && this.topicCategory.length > 0) {
          // 使用分类ID而不是名称，仅传递最后一级的 ID 作为筛选条件
          params.categoryId = this.topicCategory[this.topicCategory.length - 1];
        } else {
          // 当用户没有选择专题分类时，根据当前页面设置固定的categoryId
          const fixedCategoryId = this.getCategoryIdByRoute();
          if (fixedCategoryId) {
            params.categoryId = fixedCategoryId;
          }
        }
        if (this.filterSource) {
          params.legalSource = this.filterSource;
        }
        // 始终传递排序参数，空字符串表示按相关度排序
        params.publishDateSort = this.sortOrder;
        if (this.publishDate) {
          // 处理发布时间筛选
          params.publishDateStr = this.publishDate;
        }
        // 新增筛选参数
        if (this.isAppendixFilter === 'true') {
          params.appendix = true;
        } else if (this.isAppendixFilter === 'false') {
          params.appendix = false;
        }
        // 当isAppendixFilter为空字符串时，不传递appendix参数
        if (this.documentNumberFilter) {
          params.documentNo = this.documentNumberFilter;
        }
        if (this.departmentFilter) {
          params.department = this.departmentFilter;
        }
        params.collect = this.isFavoritesMode;
        const response = await this.$roadLawyerService.getRuleSourceList(params);
        // 根据分页数据结构处理响应
        if (response && response.success && response.data) {
          this.allDocuments = response.data.data || [];
          this.totalDocuments = response.data.totalSize || 0;
        } else {
          this.allDocuments = [];
          this.totalDocuments = 0;
        }
      } catch (error) {
        console.error('加载文档数据失败', error);
        this.$message.error('加载数据失败，请刷新页面重试');
        this.allDocuments = [];
        this.totalDocuments = 0;
      } finally {
        this.listLoading = false;
      }
    }
  }
  export default LawyerKnowledgeIndexComponent;
</script>

<style lang="less">
  @import '~/assets/styles/lawyer.less';

  .knowledge-page-wrapper {
    background-color: var(--lawyer-background);
    padding: 20px;

    .lawyer-content-wrapper {
      padding: 20px;
      border-radius: 8px;
      border: 1px solid var(--lawyer-border);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      margin-bottom: 24px;
      background-color: var(--lawyer-surface);
    }
  }
</style>
