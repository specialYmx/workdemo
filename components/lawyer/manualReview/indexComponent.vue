<template>
  <div class="db-page-wrapper padding-10">
    <div class="lawyer-page-container">
      <!-- 整体卡片容器 -->
      <div class="lawyer-main-card">
        <a-row :gutter="16">
          <a-col :span="6">
            <!-- 页面标题 -->
            <h4 class="lawyer-page-title">人工审核与数据管理</h4>
          </a-col>
          <a-col :span="12" :offset="6" class="tx-r">
            <!-- 搜索筛选和操作区域 -->
            <div class="lawyer-controls-row">
              <a-input-search
                v-model.trim="searchText"
                placeholder="搜索标题、文号、来源..."
                class="lawyer-search-input"
                @search="onSearch"
              />

              <div class="lawyer-filter-cascader">
                <a-cascader
                  v-model="filterTypePath"
                  :options="categoryOptions"
                  placeholder="请选择分类"
                  :show-search="true"
                  :change-on-select="true"
                  allow-clear
                  style="width: 100%; text-align: left"
                  @change="onFilterChange"
                />
              </div>
              <a-button
                class="lawyer-btn-export"
                :disabled="selectedRowKeys.length === 0"
                @click="exportData"
              >
                导出选中数据 ({{ selectedRowKeys.length }})
              </a-button>
            </div>
          </a-col>
        </a-row>
        <!-- 文档列表表格 -->
        <div class="lawyer-table-wrapper">
          <!-- 暂无数据状态 -->
          <div v-if="!tableLoading && documents.length === 0" class="lawyer-empty-state">
            <a-empty description="暂无数据" />
          </div>

          <a-table
            v-else
            :columns="columns"
            :data-source="documents"
            :pagination="currentPagination"
            :loading="tableLoading"
            :row-key="record => record.id"
            :row-selection="rowSelection"
            @change="handleTableChange"
          >
            <!-- 标题列插槽 -->
            <template slot="ruleName" slot-scope="text, record">
              <div>
                <div>{{ record.ruleName }}</div>
                <div style="color: #999; font-size: 12px">
                  文号：{{ record.documentNo || '无' }}
                </div>
              </div>
            </template>

            <!-- 分类列插槽 -->
            <span slot="type" slot-scope="text">
              {{ text || '未分类' }}
            </span>

            <!-- 状态列插槽 -->
            <span slot="status" slot-scope="text">
              <span :class="getCheckStatusClass(text)">
                {{ text || '未知状态' }}
              </span>
            </span>

            <!-- 提交时间列插槽 -->
            <span slot="createdTime" slot-scope="text">
              {{ formatTime(text, 'yyyy-MM-dd hh:mm:ss') }}
            </span>

            <!-- 施行日期列插槽 -->
            <span slot="effectDate" slot-scope="text">
              {{ formatTime(text) }}
            </span>
            <!-- 操作列插槽 -->
            <span slot="action" slot-scope="text, record">
              <div class="lawyer-action-links">
                <a class="lawyer-link-view" @click="viewDocument(record)"> 查看 </a>
                <template v-if="canReviewItem(record)">
                  <a class="lawyer-link-approve" @click="approveDocument(record)"> 通过 </a>
                  <a class="lawyer-link-reject" @click="rejectDocument(record)"> 驳回 </a>
                </template>
              </div>
            </span>
          </a-table>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  import { Component, Vue, Watch } from 'nuxt-property-decorator';
  import { formatDate } from '~/utils/date';
  import {
    ToDoRuleItem,
    FilterOption,
    StatusMap,
    RowSelectionConfig,
    LegalCategoryItem,
    CascaderOption
  } from '~/model/LawyerModel';
  import { downloadFileWithMessage } from '~/utils/personal';
  import { CustomColumn, CustomPagination } from '~/model/CommonModel';

  @Component({ name: 'lawyer-manual-review-index-component' })
  export default class LawyerManualReviewIndexComponent extends Vue {
    // 搜索和筛选
    searchText: string = '';
    filterType: string = '';
    filterTypePath: string[] = [];
    // 表格加载状态
    tableLoading: boolean = false;
    // 表格勾选相关
    selectedRowKeys: string[] = [];
    selectedRows: ToDoRuleItem[] = [];
    // 表格筛选状态
    tableFilters: { [key: string]: string[] } = {};

    // 组件销毁标志
    private isDestroyed: boolean = false;
    // 初始化标志，避免重复加载数据
    private hasInitialized: boolean = false;
    // 当前分页状态（使用 CommonModel 的 CustomPagination）
    currentPagination: CustomPagination = {
      current: 1,
      pageSize: 10,
      total: 0,
      showTotal: (total: number) => `共 ${total} 条数据`,
      showSizeChanger: true,
      showQuickJumper: true,
      pageSizeOptions: ['10', '20', '50', '100']
    };

    // 文档类型选项（从接口获取）
    typeOptions: FilterOption[] = [];
    // 级联选择器选项
    categoryOptions: CascaderOption[] = [];

    // 表格行选择配置
    get rowSelection(): RowSelectionConfig<ToDoRuleItem> {
      return {
        selectedRowKeys: this.selectedRowKeys,
        onChange: this.onSelectChange,
        onSelectAll: this.onSelectAll,
        getCheckboxProps: (record: ToDoRuleItem) => ({
          disabled: false,
          name: record.id
        })
      };
    }

    // 表格列配置（使用 any 以避免对 CommonModel.ts 的依赖）
    get columns(): CustomColumn[] {
      return [
        {
          title: '标题/文号',
          key: 'ruleName',
          scopedSlots: {
            customRender: 'ruleName'
          }
        },
        {
          title: '分类',
          dataIndex: 'categoryMain',
          key: 'categoryMain',
          scopedSlots: {
            customRender: 'type'
          }
        },
        {
          title: '来源',
          dataIndex: 'legalSource',
          key: 'legalSource'
        },
        {
          title: '提交时间',
          dataIndex: 'createdTime',
          key: 'createdTime',
          width: 160,
          scopedSlots: { customRender: 'createdTime' },
          sorter: (a: ToDoRuleItem, b: ToDoRuleItem) => {
            const timeA = a.createdTime ? new Date(a.createdTime).getTime() : 0;
            const timeB = b.createdTime ? new Date(b.createdTime).getTime() : 0;
            return timeA - timeB;
          }
        },
        {
          title: '施行日期',
          dataIndex: 'effectDate',
          key: 'effectDate',
          width: 160,
          scopedSlots: { customRender: 'effectDate' },
          sorter: (a: ToDoRuleItem, b: ToDoRuleItem) => {
            const timeA = a.effectDate ? new Date(a.effectDate).getTime() : 0;
            const timeB = b.effectDate ? new Date(b.effectDate).getTime() : 0;
            return timeA - timeB;
          }
        },
        {
          title: '状态',
          dataIndex: 'checkStatus',
          key: 'checkStatus',
          scopedSlots: { customRender: 'status' },
          width: 120,
          filters: [
            { text: '待审核', value: '待审核' },
            { text: '已通过', value: '已通过' },
            { text: '已驳回', value: '已驳回' },
            { text: '已过期', value: '已过期' }
          ],
          filteredValue: this.tableFilters.checkStatus || null,
          onFilter: (value: string, record: ToDoRuleItem) => record.checkStatus === value
        },
        {
          key: 'action',
          scopedSlots: {
            customRender: 'action'
          },
          title: '操作',
          width: 180
        }
      ];
    }

    // 文档数据
    documents: ToDoRuleItem[] = [];

    // 生命周期钩子

    async mounted(): Promise<void> {
      // 设置初始筛选状态
      this.setInitialFilters();

      // 加载分类数据
      await this.loadCategoryOptions();

      // 加载文档数据
      await this.loadDocuments();

      // 标记初始化完成
      this.hasInitialized = true;
    }

    // 监听路由变化
    @Watch('$route', { immediate: true, deep: true })
    async onRouteChange(to, from): Promise<void> {
      // 防护：确保路由对象存在
      if (!to || !from) return;

      // 如果还未完成初始化，跳过路由变化处理，避免重复加载
      if (!this.hasInitialized) return;

      // 只有当筛选参数发生变化时才重新设置
      if (to.query.filter !== from.query.filter) {
        console.log('路由筛选参数变化:', from.query.filter, '->', to.query.filter);
        this.setInitialFilters();
        // 重新加载数据
        await this.loadDocuments();
      }
    }

    // 设置初始筛选状态
    setInitialFilters(): void {
      // 防护：如果组件已销毁，不执行操作
      if (this.isDestroyed) return;

      const filterParam = this.$route.query.filter as string;

      // 先清空之前的筛选状态，避免状态残留
      this.tableFilters = {};

      if (filterParam) {
        // 使用 $nextTick 确保DOM更新完成后再设置筛选

        // 再次检查组件是否已销毁
        if (this.isDestroyed) return;

        if (filterParam === 'completed') {
          // 从首页"查看历史记录"跳转过来，显示已通过和已驳回
          this.tableFilters = {
            checkStatus: ['已通过', '已驳回']
          };
        } else if (filterParam === 'pending') {
          // 从首页"查看全部"跳转过来，显示待审核
          this.tableFilters = {
            checkStatus: ['待审核']
          };
        } else {
          console.log('未知的筛选参数:', filterParam);
        }
      } else {
        console.log('清空筛选条件');
      }
    }

    // 组件销毁时的清理
    beforeDestroy(): void {
      this.isDestroyed = true;
    }

    // 加载分类数据 - 获取全部分类数据用于筛选
    async loadCategoryOptions(): Promise<void> {
      try {
        const categories: LegalCategoryItem[] = await this.$roadLawyerService.getLegalCategory({
          // 不传 id 参数，获取全部专题分类数据
        });

        if (categories && categories.length > 0) {
          // 生成级联选择器数据
          this.categoryOptions = this.convertToCascaderOptions(categories);
          // 保留扁平化数据用于兼容性
          this.typeOptions = this.convertToFilterOptions(categories);
        } else {
          console.warn('未获取到分类数据');
          this.categoryOptions = [];
          this.typeOptions = [];
        }
      } catch (error) {
        console.error('加载专题分类数据失败:', error);
        this.categoryOptions = [];
        this.typeOptions = [];
      }
    }

    // 将API数据转换为级联选择器格式
    convertToCascaderOptions(categories: LegalCategoryItem[]): CascaderOption[] {
      return categories.map(
        (category: LegalCategoryItem): CascaderOption => ({
          value: category.name, // 使用名称作为value，与后端API保持一致
          label: category.name,
          children: this.convertToCascaderOptions(category.children || [])
        })
      );
    }

    // 将API数据转换为筛选选项格式 - 扁平化所有分类
    convertToFilterOptions(categories: LegalCategoryItem[]): FilterOption[] {
      const options: FilterOption[] = [];

      const addCategory = (category: LegalCategoryItem) => {
        // 添加当前分类
        options.push({
          label: category.name,
          value: category.name
        });

        // 递归添加子分类
        if (category.children && category.children.length > 0) {
          category.children.forEach(child => addCategory(child));
        }
      };

      categories.forEach(category => addCategory(category));
      return options;
    }

    // 加载文档数据
    async loadDocuments(): Promise<void> {
      this.tableLoading = true;

      // 清除选中状态，避免操作过期数据
      this.selectedRowKeys = [];
      this.selectedRows = [];

      try {
        // 构建查询参数，包含分页信息
        const params = {
          condition: this.searchText || '',
          checkStatus: this.getApiCheckStatus(),
          category: this.filterType || '',
          page: this.currentPagination.current,
          pageSize: this.currentPagination.pageSize
        };

        console.log('查询参数:', params);

        // 调用后端分页接口
        const response = await this.$roadLawyerService.getRuleList(params, 'management');

        // 类型守卫：检查是否为分页响应结构
        if (Array.isArray(response)) {
          // 如果返回数组（向后兼容），直接使用
          this.documents = response;
          this.currentPagination = {
            ...this.currentPagination,
            total: response.length
          };
        } else if (response && typeof response === 'object' && 'success' in response) {
          // 如果返回分页响应结构
          if (response.success && response.data) {
            this.documents = response.data.records || [];
            this.currentPagination = {
              ...this.currentPagination,
              current: response.data.current || 1,
              pageSize: response.data.size || 10,
              total: response.data.total || 0
            };
          } else {
            console.error('获取数据失败:', response.message);
            this.documents = [];
            this.currentPagination = {
              ...this.currentPagination,
              total: 0
            };
          }
        } else {
          // 其他情况，设置为空
          this.documents = [];
          this.currentPagination = {
            ...this.currentPagination,
            total: 0
          };
        }
      } catch (error) {
        console.error('错误详情:', error);
        this.documents = [];
        this.currentPagination = {
          ...this.currentPagination,
          total: 0
        };
      } finally {
        this.tableLoading = false;
      }
    }

    // 搜索方法
    async onSearch(value: string): Promise<void> {
      this.searchText = value;
      // 搜索时重置到第一页
      this.currentPagination.current = 1;
      await this.loadDocuments();
    }

    // 筛选方法 - 处理级联选择器的值
    async onFilterChange(value: string[]): Promise<void> {
      // 级联选择器返回的是路径数组，取最后一个值作为筛选条件
      this.filterType = value && value.length > 0 ? value[value.length - 1] : '';
      this.filterTypePath = value || [];

      // 筛选时重置到第一页
      this.currentPagination.current = 1;
      await this.loadDocuments();
    }

    // 将表格筛选的状态值转换为API状态值（支持多选）
    getApiCheckStatus(): string[] {
      const checkStatusFilter = this.tableFilters.checkStatus;
      if (!checkStatusFilter || checkStatusFilter.length === 0) {
        return []; // 空数组表示不筛选状态
      }
      return checkStatusFilter; // 直接返回表格筛选的状态数组
    }

    // 表格变化事件
    async handleTableChange(
      pagination: CustomPagination,
      filters: Record<string, string[]>
    ): Promise<void> {
      // 更新分页信息
      this.currentPagination = {
        ...this.currentPagination,
        current: pagination.current,
        pageSize: pagination.pageSize
      };

      // 更新筛选状态
      this.tableFilters = filters || {};

      // 重新加载数据
      await this.loadDocuments();
    }

    // 刷新数据
    async refreshData(): Promise<void> {
      await this.loadDocuments();
      this.$message.success('数据已刷新');
    }

    // 获取审核状态样式类（使用全局样式）
    getCheckStatusClass(status: string | null): string {
      const classMap: StatusMap = {
        待审核: 'lawyer-status-pending',
        已通过: 'lawyer-status-approved',
        已驳回: 'lawyer-status-rejected',
        已过期: 'lawyer-status-rejected'
      };
      return classMap[status || ''] || 'lawyer-status-pending';
    }

    // 格式化时间显示
    formatTime(timeStr: string, format?: string): string {
      if (!timeStr) return '-';
      return formatDate(timeStr, format || 'yyyy-MM-dd');
    }

    get basePath(): string {
      const path = this.$route.path.split('/').filter(segment => segment)[0] || 'road';
      return `/${path}`;
    }

    // 查看文档
    viewDocument(document: ToDoRuleItem): void {
      this.$message.info(`查看文档: ${document.ruleName}`);
      // 跳转到文档比较详情页面
      this.$router.push({
        path: `manualReview/detail`,
        query: {
          id: document.id,
          pageTitle: document.ruleName,
          source: this.$route.path,
          checkStatus: document.checkStatus || '待审核' // 传递审核状态
        }
      });
    }

    // 检查是否允许审核该项目（状态检查和分类ID检查）
    canReviewItem(record: ToDoRuleItem): boolean {
      // 然后检查审核状态
      return record.checkStatus === '待审核';
    }

    // 审核通过
    approveDocument(document: ToDoRuleItem): void {
      // 首先检查 categoryId
      if (!document.categoryId) {
        this.$message.warning('该数据缺少分类信息，无法进行审核操作');
        return;
      }

      // 检查审核状态
      if (!this.canReviewItem(document)) {
        this.$message.warning('当前状态不允许审核');
        return;
      }

      this.$confirm({
        title: '确认通过',
        content: `确定要通过文档"${document.ruleName}"的审核吗？`,
        okText: '确认通过',
        cancelText: '取消',
        onOk: () => {
          this.submitReview('approve', document);
        }
      });
    }

    // 审核驳回
    rejectDocument(document: ToDoRuleItem): void {
      // 首先检查 categoryId
      if (!document.categoryId) {
        this.$message.warning('该数据缺少分类信息，无法进行审核操作');
        return;
      }

      // 检查审核状态
      if (!this.canReviewItem(document)) {
        this.$message.warning('当前状态不允许审核');
        return;
      }

      this.$confirm({
        title: '确认驳回',
        content: `确定要驳回文档"${document.ruleName}"吗？`,
        okText: '确认驳回',
        okType: 'danger',
        cancelText: '取消',
        onOk: () => {
          this.submitReview('reject', document);
        }
      });
    }

    // 提交审核
    async submitReview(action: string, document: ToDoRuleItem): Promise<void> {
      try {
        // 调用统一的审核接口，通过approvalComment传递状态
        await this.$roadLawyerService.approveToDoRule({
          id: document?.id || '',
          approvalComment: action === 'approve' ? '已通过' : '已驳回'
        });

        // 显示成功消息
        this.$message.success(action === 'approve' ? '审核已通过' : '文档已驳回');

        // 重新加载表格数据，确保数据一致性
        await this.loadDocuments();
      } catch (error) {
        console.error('审核操作失败:', error);
        this.$message.error('审核操作失败，请重试');
      }
    }

    // 表格行选择变化事件
    onSelectChange(selectedRowKeys: string[], selectedRows: ToDoRuleItem[]): void {
      console.log('选中行变化:', selectedRowKeys, selectedRows);
      this.selectedRowKeys = selectedRowKeys;
      this.selectedRows = selectedRows;
    }

    // 全选/取消全选
    onSelectAll(selected: boolean, selectedRows: ToDoRuleItem[], changeRows: ToDoRuleItem[]): void {
      console.log('全选变化:', selected, selectedRows, changeRows);
      if (selected) {
        this.selectedRowKeys = selectedRows.map((row: ToDoRuleItem) => row.id);
        this.selectedRows = selectedRows;
      } else {
        this.selectedRowKeys = [];
        this.selectedRows = [];
      }
    }

    // 导出数据
    async exportData(): Promise<void> {
      if (this.selectedRowKeys.length === 0) {
        this.$message.warning('请先选择要导出的数据');
        return;
      }

      this.$message.info(`正在导出 ${this.selectedRowKeys.length} 条数据，请稍候...`);

      try {
        // 使用真实的API调用，传入选中的ids数组
        const result = await this.$roadLawyerService.exportExcel({
          ids: this.selectedRowKeys
        });

        if (
          downloadFileWithMessage(result, {
            fileName: `人工审核数据_${this.selectedRowKeys.length}条.xlsx`,
            showMessage: true,
            messageService: this.$message
          })
        ) {
          // 下载成功，消息已在 downloadFileWithMessage 中处理
        } else {
          this.$message.error('导出失败，请重试');
        }
      } catch (error) {
        console.error('导出失败:', error);
        this.$message.error('导出失败，请重试');
      }
    }
  }
</script>

<style lang="less">
  @import '~/assets/styles/lawyer.less';

  .db-page-wrapper {
    overflow: hidden;
    height: 100%;

    // 整体卡片样式
    .lawyer-main-card {
      background: var(--lawyer-surface);
    }

    .lawyer-page-title {
      font-size: 20px;
      font-weight: 600;
      color: var(--lawyer-text);
      margin-bottom: 16px;
    }

    // 搜索筛选和操作区域（一行显示）
    .lawyer-controls-row {
      display: flex;
      gap: 12px;
      align-items: center;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .lawyer-search-input {
      width: 30%;
    }



    .lawyer-btn-export {
      margin-left: auto;
      background: #e6a23c;
      border-color: #e6a23c;
      color: white;

      &:hover {
        background: #d39531;
        border-color: #d39531;
        color: white;
      }
    }

    // 操作列表头样式
    .lawyer-action-header {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
    }

    // 表格包装器
    .lawyer-table-wrapper {
      margin-top: 24px;
      border-top: 1px solid var(--lawyer-border);
      padding-top: 24px;
    }

    // 操作链接组
    .lawyer-action-links {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .lawyer-link-view {
      color: #666;
      cursor: pointer;
      transition: color 0.2s ease;
      padding: 2px 6px;
      border-radius: 3px;

      &:hover {
        color: #333;
        background-color: #f5f5f5;
      }
    }

    .lawyer-link-approve {
      color: #52c41a;
      cursor: pointer;
      transition: all 0.2s ease;
      padding: 2px 6px;
      border-radius: 3px;

      &:hover {
        color: #389e0d;
        background-color: #f6ffed;
      }
    }

    .lawyer-link-reject {
      color: #ff4d4f;
      cursor: pointer;
      transition: all 0.2s ease;
      padding: 2px 6px;
      border-radius: 3px;

      &:hover {
        color: #cf1322;
        background-color: #fff2f0;
      }
    }

    /* 空状态样式 */
    .lawyer-empty-state {
      padding: 40px 20px;
      text-align: center;
    }
  }
</style>
