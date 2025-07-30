<template>
  <div class="db-page-wrapper">
    <div class="lawyer-page-container">
      <!-- 整体卡片容器 -->
      <div class="lawyer-main-card">
        <!-- 页面标题 -->
        <h1 class="lawyer-page-title">人工审核与数据管理</h1>

        <!-- 搜索筛选和操作区域 -->
        <div class="lawyer-controls-row">
          <a-input-search
            placeholder="搜索标题、文号、来源..."
            v-model="searchText"
            @search="onSearch"
            class="lawyer-search-input"
          />

          <div class="lawyer-status-tags">
            <span
              v-for="option in statusOptions"
              :key="option.value"
              :class="[
                'lawyer-status-tag',
                { 'lawyer-status-tag-active': filterStatus === option.value },
              ]"
              @click="onStatusTagClick(option.value)"
            >
              {{ option.label }}
            </span>
          </div>

          <a-select
            v-model="filterType"
            placeholder="请选择分类"
            class="lawyer-filter-select"
            @change="onFilterChange"
            allowClear
          >
            <a-select-option value="">全部分类</a-select-option>
            <a-select-option
              v-for="option in typeOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </a-select-option>
          </a-select>

          <a-button
            @click="exportData"
            class="lawyer-btn-export"
            :disabled="selectedRowKeys.length === 0"
          >
            导出选中数据 ({{ selectedRowKeys.length }})
          </a-button>
        </div>

        <!-- 统计信息 -->
        <div class="lawyer-stats-info">
          总计: <strong>{{ totalDocuments }}</strong> 条 / 待审核:
          <strong>{{ pendingCount }}</strong> 条 / 已选中:
          <strong>{{ selectedRowKeys.length }}</strong> 条
          <a-tooltip placement="right">
            <template slot="title">
              <span>版本规则：文件版本高于系统最高版本时，不允许审核操作</span>
            </template>
            <a-icon
              type="info-circle"
              style="margin-left: 8px; color: #1890ff"
            />
          </a-tooltip>
        </div>

        <!-- 文档列表表格 -->
        <div class="lawyer-table-wrapper">
          <a-table
            :columns="columns"
            :data-source="documents"
            :pagination="currentPagination"
            :loading="tableLoading"
            :rowKey="(record) => record.id"
            :row-selection="rowSelection"
            @change="handleTableChange"
          >
            <!-- 标题列插槽 -->
            <template slot="ruleName" slot-scope="text, record">
              <div>
                <div>{{ record.ruleName }}</div>
                <div style="color: #999; font-size: 12px">
                  文号：{{ record.docNo || "无" }}
                </div>
              </div>
            </template>

            <!-- 分类列插槽 -->
            <span slot="type" slot-scope="text">
              {{ text || "未分类" }}
            </span>

            <!-- 状态列插槽 -->
            <span slot="status" slot-scope="text">
              <span :class="['lawyer-status-text', `status-${text}`]">
                {{ getCheckStatusText(text) }}
              </span>
            </span>

            <!-- 提交时间列插槽 -->
            <span slot="createdTime" slot-scope="text">
              {{ formatTime(text) }}
            </span>

            <!-- 施行日期列插槽 -->
            <span slot="publishTime" slot-scope="text">
              {{ formatTime(text) }}
            </span>

            <!-- 操作列插槽 -->
            <span slot="action" slot-scope="text, record">
              <div class="lawyer-action-links">
                <a @click="viewDocument(record)" class="lawyer-link-view">
                  查看
                </a>
                <template
                  v-if="
                    (record.checkStatus === '待审核' ||
                      record.checkStatus === null) &&
                    canReviewItem(record)
                  "
                >
                  <a
                    @click="approveDocument(record)"
                    class="lawyer-link-approve"
                  >
                    通过
                  </a>
                  <a @click="rejectDocument(record)" class="lawyer-link-reject">
                    驳回
                  </a>
                </template>
                <span
                  v-else-if="
                    record.checkStatus === '待审核' ||
                    record.checkStatus === null
                  "
                  class="lawyer-version-notice"
                  >版本受限</span
                >
              </div>
            </span>

            <!-- 自定义筛选下拉框 -->
            <div
              slot="filterDropdown"
              slot-scope="{
                setSelectedKeys,
                selectedKeys,
                confirm,
                clearFilters,
                column,
              }"
              style="padding: 8px"
            >
              <a-input
                ref="searchInput"
                :placeholder="`搜索 ${column.title}`"
                :value="selectedKeys[0]"
                @change="
                  (e) => setSelectedKeys(e.target.value ? [e.target.value] : [])
                "
                @pressEnter="
                  () => handleSearch(selectedKeys, confirm, column.dataIndex)
                "
                style="width: 188px; margin-bottom: 8px; display: block"
              />
              <a-button
                type="primary"
                @click="
                  () => handleSearch(selectedKeys, confirm, column.dataIndex)
                "
                icon="search"
                size="small"
                style="width: 90px; margin-right: 8px"
              >
                搜索
              </a-button>
              <a-button
                @click="() => handleReset(clearFilters)"
                size="small"
                style="width: 90px"
              >
                重置
              </a-button>
            </div>
            <a-icon
              slot="filterIcon"
              slot-scope="filtered"
              type="search"
              :style="{ color: filtered ? '#1890ff' : undefined }"
            />
          </a-table>
        </div>
      </div>

      <!-- 审核意见弹窗 -->
      <a-modal
        v-model="reviewModalVisible"
        :title="reviewAction === 'approve' ? '通过审核' : '驳回文档'"
        @ok="submitReview"
      >
        <a-form-item label="审核意见">
          <a-textarea
            v-model="reviewComment"
            :rows="4"
            :placeholder="
              reviewAction === 'approve'
                ? '请输入通过意见（选填）'
                : '请输入驳回原因（必填）'
            "
          />
        </a-form-item>
      </a-modal>
    </div>
  </div>
</template>

<script lang="ts">
// @ts-nocheck
import { Component, Vue } from "nuxt-property-decorator";
import moment from "moment";
import { ToDoRuleItem } from "~/model/LawyerModel";
import { categoryOptions } from "~/enum/Category";
import { downloadFileWithMessage } from "~/utils/downloadHelper";

interface Document {
  id: string;
  title: string;
  version: string;
  docNumber?: string;
  changeType: string;
  type: string;
  submitter: string;
  submitTime: string;
  reviewer?: string;
  reviewTime?: string;
  status: string;
  source?: string;
}

@Component({})
export default class DbPage extends Vue {
  // 搜索和筛选
  searchText = "";
  filterStatus = "all";
  filterType = "";
  dateRange = [];
  // 表格加载状态
  tableLoading = false;

  // 表格勾选相关
  selectedRowKeys: string[] = [];
  selectedRows: ToDoRuleItem[] = [];

  // 当前分页状态
  currentPagination = {
    current: 1,
    pageSize: 10,
    total: 0,
  };

  // 审核弹窗
  reviewModalVisible = false;
  reviewAction = "approve";
  reviewComment = "";
  currentDocument: ToDoRuleItem | null = null;

  // 状态选项
  statusOptions = [
    { label: "全部状态", value: "all" },
    { label: "待审核", value: "pending" },
    { label: "已通过", value: "approved" },
    { label: "已驳回", value: "rejected" },
  ];

  // 文档类型选项（从常量文件导入）
  typeOptions = categoryOptions;

  // 表格行选择配置
  get rowSelection() {
    return {
      selectedRowKeys: this.selectedRowKeys,
      onChange: this.onSelectChange,
      onSelectAll: this.onSelectAll,
      getCheckboxProps: (record: ToDoRuleItem) => ({
        disabled: false,
        name: record.id,
      }),
    };
  }

  // 表格列配置
  columns = [
    {
      title: "标题/文号",
      key: "ruleName",
      scopedSlots: {
        customRender: "ruleName",
        filterDropdown: "filterDropdown",
        filterIcon: "filterIcon",
      },
      onFilter: (value, record) =>
        record.ruleName.toLowerCase().includes(value.toLowerCase()) ||
        (record.categorySub &&
          record.categorySub.toLowerCase().includes(value.toLowerCase())),
      onFilterDropdownVisibleChange: (visible) => {
        if (visible) {
          setTimeout(() => {
            this.$refs.searchInput.focus();
          }, 100);
        }
      },
    },
    {
      title: "分类",
      dataIndex: "categoryMain",
      key: "categoryMain",
      scopedSlots: {
        customRender: "type",
        filterDropdown: "filterDropdown",
        filterIcon: "filterIcon",
      },
      width: 120,
      onFilter: (value, record) =>
        record.categoryMain.toLowerCase().includes(value.toLowerCase()),
      onFilterDropdownVisibleChange: (visible) => {
        if (visible) {
          setTimeout(() => {
            this.$refs.searchInput.focus();
          }, 100);
        }
      },
    },
    {
      title: "来源",
      dataIndex: "websiteName",
      key: "websiteName",
      width: 150,
      scopedSlots: {
        filterDropdown: "filterDropdown",
        filterIcon: "filterIcon",
      },
      onFilter: (value, record) =>
        record.websiteName &&
        record.websiteName.toLowerCase().includes(value.toLowerCase()),
      onFilterDropdownVisibleChange: (visible) => {
        if (visible) {
          setTimeout(() => {
            this.$refs.searchInput.focus();
          }, 100);
        }
      },
    },
    {
      title: "提交时间",
      dataIndex: "createdTime",
      key: "createdTime",
      width: 160,
      scopedSlots: { customRender: "createdTime" },
      sorter: (a, b) => new Date(a.createdTime) - new Date(b.createdTime),
    },
    {
      title: "施行日期",
      dataIndex: "publishTime",
      key: "publishTime",
      width: 160,
      scopedSlots: { customRender: "publishTime" },
      sorter: (a, b) =>
        new Date(a.publishTime || 0) - new Date(b.publishTime || 0),
    },
    {
      title: "状态",
      dataIndex: "checkStatus",
      key: "checkStatus",
      scopedSlots: { customRender: "status" },
      width: 120,
      filters: [
        { text: "待审核", value: "待审核" },
        { text: "已通过", value: "已通过" },
        { text: "已驳回", value: "已驳回" },
      ],
      onFilter: (value, record) => record.checkStatus === value,
    },
    {
      title: "操作",
      key: "action",
      scopedSlots: { customRender: "action" },
      fixed: "right",
      width: 180,
    },
  ];

  // 文档数据
  documents: ToDoRuleItem[] = [];

  head() {
    return {
      title: "人工审核 - 法律合规智能系统",
    };
  }

  // 生命周期钩子
  async mounted() {
    // 加载文档数据
    await this.loadDocuments();
  }

  // 加载文档数据
  async loadDocuments() {
    this.tableLoading = true;

    try {
      // 构建查询参数
      const params = {
        condition: this.searchText || "",
        checkStatus: this.getApiCheckStatus(this.filterStatus),
        category: this.filterType || "",
      };

      console.log("查询参数:", params);

      // 调用真实API获取数据
      const result = await this.$service.lawyer.getCheckRuleList(params);
      if (result && result.length > 0) {
        this.documents = result;
      } else {
        this.documents = [];
      }

      // 更新分页信息
      this.currentPagination = {
        current: 1,
        pageSize: 10,
        total: this.documents.length,
        showTotal: (total) => `共 ${total} 条数据`,
        showSizeChanger: true,
        showQuickJumper: true,
        pageSizeOptions: ["10", "20", "50", "100"],
      };
    } catch (error) {
      console.error("错误详情:", error);
      this.documents = [];
    } finally {
      this.tableLoading = false;
    }
  }

  // 获取待审核文档数量
  get pendingCount() {
    return this.documents.filter(
      (doc) => doc.checkStatus === "待审核" || doc.checkStatus === null
    ).length;
  }

  // 获取文档总数
  get totalDocuments() {
    return this.documents.length;
  }

  // 搜索方法
  async onSearch(value: string): Promise<void> {
    this.searchText = value;
    await this.loadDocuments();
  }

  // 筛选方法
  async onFilterChange(value: string): Promise<void> {
    this.filterType = value;
    await this.loadDocuments();
  }

  // 状态标签点击
  async onStatusTagClick(value: string): Promise<void> {
    this.filterStatus = this.filterStatus === value ? "all" : value;
    await this.loadDocuments();
  }

  // 将前端状态值转换为API状态值
  getApiCheckStatus(status: string): string {
    const statusMap: Record<string, string> = {
      all: "",
      pending: "待审核",
      approved: "已通过",
      rejected: "已驳回",
    };
    return statusMap[status] || "";
  }

  // 日期范围变化
  onDateRangeChange(dates: moment.Moment[], dateStrings: string[]): void {
    // 日期已经双向绑定到dateRange，这里可以加入额外处理
  }

  // 表格变化事件
  handleTableChange(pagination, filters, sorter, extra): void {
    console.log("表格变化:", pagination, filters, sorter, extra);

    // 计算筛选后的数据数量
    let filteredCount = this.documents.length;

    // 如果有筛选条件，计算筛选后的数量
    if (filters && Object.keys(filters).length > 0) {
      let result = [...this.documents];

      // 应用筛选条件
      Object.keys(filters).forEach((key) => {
        const filterValues = filters[key];
        if (filterValues && filterValues.length > 0) {
          if (key === "titles") {
            // 标题搜索筛选
            const searchText = filterValues[0].toLowerCase();
            result = result.filter(
              (item) =>
                item.ruleName.toLowerCase().includes(searchText) ||
                (item.categorySub &&
                  item.categorySub.toLowerCase().includes(searchText))
            );
          } else if (key === "checkStatus") {
            result = result.filter((item) =>
              filterValues.includes(item.checkStatus)
            );
          } else if (key === "categoryMain") {
            result = result.filter((item) =>
              filterValues.includes(item.categoryMain)
            );
          } else if (key === "websiteName") {
            const searchText = filterValues[0].toLowerCase();
            result = result.filter(
              (item) =>
                item.websiteName &&
                item.websiteName.toLowerCase().includes(searchText)
            );
          }
        }
      });

      filteredCount = result.length;
    }

    // 更新分页状态
    this.currentPagination = {
      ...pagination,
      total: filteredCount,
      showTotal: (total) => `共 ${total} 条数据`,
      showSizeChanger: true,
      showQuickJumper: true,
      pageSizeOptions: ["10", "20", "50", "100"],
    };
  }

  // 处理搜索
  handleSearch(selectedKeys, confirm, dataIndex): void {
    confirm();
    console.log("搜索:", selectedKeys, dataIndex);
  }

  // 处理重置
  handleReset(clearFilters): void {
    clearFilters();
  }

  // 刷新数据
  async refreshData(): Promise<void> {
    await this.loadDocuments();
    this.$message.success("数据已刷新");
  }

  // 获取审核状态文本
  getCheckStatusText(status: string | null): string {
    // 如果状态已经是汉字，直接返回
    if (status === "待审核" || status === "已通过" || status === "已驳回") {
      return status;
    }
    // 兼容数字格式的状态
    const textMap: Record<string, string> = {
      "0": "待审核",
      "1": "已通过",
      "2": "已驳回",
    };
    return textMap[status] || "未知状态";
  }

  // 格式化时间显示
  formatTime(timeStr: string): string {
    if (!timeStr) return "-";
    return moment(timeStr).format("YYYY-MM-DD HH:mm");
  }

  // 查看文档
  viewDocument(document: ToDoRuleItem): void {
    this.$message.info(`查看文档: ${document.ruleName}`);
    // 实际项目中可能会跳转到文档比较页面
    this.$router.push({
      path: "/document-compare",
      query: {
        id: document.id,
        pageTitle: document.ruleName,
      },
    });
  }

  // 检查是否允许审核该项目
  canReviewItem(record: ToDoRuleItem): boolean {
    // 如果版本字段不存在，默认允许审核
    if (
      record.newFileVersion === undefined ||
      record.currentMaxFileVersion === undefined
    ) {
      return true;
    }

    const newVersion = record.newFileVersion || 0;
    const maxVersion = record.currentMaxFileVersion || 0;

    return newVersion <= maxVersion;
  }

  // 审核通过
  approveDocument(document: ToDoRuleItem): void {
    // 检查版本
    if (!this.canReviewItem(document)) {
      this.$message.warning("当前版本高于系统最高版本，不允许审核");
      return;
    }

    this.currentDocument = document;
    this.reviewAction = "approve";
    this.reviewComment = "";
    this.reviewModalVisible = true;
  }

  // 审核驳回
  rejectDocument(document: ToDoRuleItem): void {
    // 检查版本
    if (!this.canReviewItem(document)) {
      this.$message.warning("当前版本高于系统最高版本，不允许审核");
      return;
    }

    this.currentDocument = document;
    this.reviewAction = "reject";
    this.reviewComment = "";
    this.reviewModalVisible = true;
  }

  // 提交审核
  async submitReview(): Promise<void> {
    if (this.reviewAction === "reject" && !this.reviewComment) {
      this.$message.error("驳回文档必须填写驳回原因");
      return;
    }

    try {
      // 调用统一的审核接口，通过approvalComment传递状态
      await this.$service.lawyer.approveToDoRule({
        id: this.currentDocument?.id,
        approvalComment: this.reviewAction === "approve" ? "已通过" : "已驳回",
      });

      // 关闭弹窗并显示成功消息
      this.reviewModalVisible = false;
      this.$message.success(
        this.reviewAction === "approve" ? "审核已通过" : "文档已驳回"
      );

      // 重新加载表格数据，确保数据一致性
      await this.loadDocuments();
    } catch (error) {
      console.error("审核操作失败:", error);
      this.$message.error("审核操作失败，请重试");
    }
  }

  // 表格行选择变化事件
  onSelectChange(
    selectedRowKeys: string[],
    selectedRows: ToDoRuleItem[]
  ): void {
    console.log("选中行变化:", selectedRowKeys, selectedRows);
    this.selectedRowKeys = selectedRowKeys;
    this.selectedRows = selectedRows;
  }

  // 全选/取消全选
  onSelectAll(
    selected: boolean,
    selectedRows: ToDoRuleItem[],
    changeRows: ToDoRuleItem[]
  ): void {
    console.log("全选变化:", selected, selectedRows, changeRows);
    if (selected) {
      this.selectedRowKeys = selectedRows.map((row) => row.id);
      this.selectedRows = selectedRows;
    } else {
      this.selectedRowKeys = [];
      this.selectedRows = [];
    }
  }

  // 导出数据
  async exportData(): Promise<void> {
    if (this.selectedRowKeys.length === 0) {
      this.$message.warning("请先选择要导出的数据");
      return;
    }

    this.$message.info(
      `正在导出 ${this.selectedRowKeys.length} 条数据，请稍候...`
    );

    try {
      // 使用真实的API调用，传入选中的ids数组
      const result = await this.$service.lawyer.exportExcel({
        ids: this.selectedRowKeys,
      });

      if (
        downloadFileWithMessage(result, {
          fileName: `人工审核数据_${this.selectedRowKeys.length}条.xlsx`,
          showMessage: true,
          messageService: this.$message,
        })
      ) {
        // 下载成功，消息已在 downloadFileWithMessage 中处理
      } else {
        this.$message.error("导出失败，请重试");
      }
    } catch (error) {
      console.error("导出失败:", error);
      this.$message.error("导出失败，请重试");
    }
  }
}
</script>

<style lang="less">
.db-page-wrapper {
  // 整体卡片样式
  .lawyer-main-card {
    background: var(--lawyer-surface);
    border: 1px solid var(--lawyer-border);
    border-radius: 8px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
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
    width: 240px;
  }

  .lawyer-filter-select {
    width: 150px;
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

  // 统计信息
  .lawyer-stats-info {
    color: var(--lawyer-text-light);
    font-size: 14px;
    margin-top: 10px;

    strong {
      color: var(--lawyer-text);
      font-weight: 600;
    }
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
    text-decoration: none;
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
    text-decoration: none;
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
    text-decoration: none;
    cursor: pointer;
    transition: all 0.2s ease;
    padding: 2px 6px;
    border-radius: 3px;

    &:hover {
      color: #cf1322;
      background-color: #fff2f0;
    }
  }

  // 状态文字样式
  .lawyer-status-text {
    font-weight: 500;

    // 不同状态颜色
    &.status-pending {
      color: #fa8c16;
    }

    &.status-approved {
      color: #52c41a;
    }

    &.status-rejected {
      color: #ff4d4f;
    }
  }

  // 状态标签样式
  .lawyer-status-tags {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .lawyer-status-tag {
    display: inline-block;
    padding: 6px 16px;
    border: 1px solid #d9d9d9;
    border-radius: 3px;
    background-color: #fff;
    color: var(--lawyer-text-light);
    font-size: 14px;
    font-weight: 400;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
    user-select: none;

    &:hover {
      border-color: var(--lawyer-primary);
      color: var(--lawyer-primary);
    }

    &.lawyer-status-tag-active {
      background-color: var(--lawyer-primary);
      border-color: var(--lawyer-primary);
      color: white;
      font-weight: 500;
    }
  }

  .lawyer-version-notice {
    color: #999;
    font-size: 12px;
    font-style: italic;
  }
}
</style>
