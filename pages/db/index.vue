<template>
  <div class="lawyer-page-container">
    <!-- 页面头部卡片 -->
    <div class="lawyer-card lawyer-header-card">
      <div class="lawyer-card-header">
        <h1 class="lawyer-card-title">人工审核与数据管理</h1>
        <div>
          <a-select
            v-model="filterStatus"
            style="width: 150px"
            placeholder="审核状态"
            @change="onFilterChange"
          >
            <a-select-option
              v-for="option in statusOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </a-select-option>
          </a-select>

          <a-select
            v-model="filterType"
            style="width: 150px"
            placeholder="文档分类"
            @change="onFilterChange"
          >
            <a-select-option
              v-for="option in typeOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </a-select-option>
          </a-select>

          <a-button
            type="primary"
            icon="check"
            @click="batchApprove"
            :disabled="!hasSelection"
          >
            批量通过
          </a-button>
          <a-button
            type="danger"
            icon="close"
            @click="batchReject"
            :disabled="!hasSelection"
          >
            批量驳回
          </a-button>
          <a-button icon="download" @click="exportData"> 导出数据 </a-button>
        </div>
      </div>
    </div>

    <!-- 文档列表卡片 -->
    <div class="lawyer-card lawyer-table-card">
      <div class="lawyer-table-controls">
        <a-input-search
          placeholder="搜索标题、文号、来源..."
          style="width: 300px"
          v-model="searchText"
          @search="onSearch"
        />
        <div>
          总计: <strong>{{ totalDocuments }}</strong> 条 / 待审核:
          <strong>{{ pendingCount }}</strong> 条
        </div>
      </div>

      <a-table
        :columns="columns"
        :data-source="filteredDocuments"
        :pagination="{
          pageSize: 10,
          total: filteredDocuments.length,
          showTotal: (total) => `共 ${total} 条数据`,
        }"
        :loading="tableLoading"
        :rowKey="(record) => record.id"
        :rowSelection="{
          selectedRowKeys: selectedRowKeys,
          onChange: onSelectionChange,
        }"
        @change="handleTableChange"
      >
        <!-- 标题列插槽 -->
        <template slot="titles" slot-scope="text, record">
          <div>
            <div>{{ record.title }}</div>
            <div>文号：{{ record.docNumber || "未分配" }}</div>
          </div>
        </template>

        <!-- 分类列插槽 -->
        <span slot="type" slot-scope="text">
          <a-tag :color="getTypeColor(text)">{{ getTypeText(text) }}</a-tag>
        </span>

        <!-- 状态列插槽 -->
        <span slot="status" slot-scope="text">
          <span :class="['lawyer-status-badge', `status-${text}`]">
            {{ getStatusText(text) }}
          </span>
        </span>

        <!-- 操作列插槽 -->
        <span slot="action" slot-scope="text, record">
          <div>
            <a-button @click="viewDocument(record)">查看</a-button>
            <template v-if="record.status === 'pending'">
              <a-button
                v-for="(action, index) in getPendingActions"
                :key="index"
                :type="action.type"
                @click="() => action.handler(record)"
              >
                {{ action.text }}
              </a-button>
            </template>
          </div>
        </span>
      </a-table>
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

    <!-- 批量审核弹窗 -->
    <a-modal
      v-model="batchReviewModalVisible"
      :title="batchReviewAction === 'approve' ? '批量通过审核' : '批量驳回文档'"
      @ok="submitBatchReview"
    >
      <p>
        您选择了 {{ selectedRowKeys.length }} 个文档进行{{
          batchReviewAction === "approve" ? "通过" : "驳回"
        }}操作
      </p>
      <a-form-item label="审核意见">
        <a-textarea
          v-model="batchReviewComment"
          :rows="4"
          :placeholder="
            batchReviewAction === 'approve'
              ? '请输入批量通过意见（选填）'
              : '请输入批量驳回原因（必填）'
          "
        />
      </a-form-item>
    </a-modal>
  </div>
</template>

<script lang="ts">
// @ts-nocheck
import { Component, Vue } from "nuxt-property-decorator";
import moment from "moment";

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
  filterType = "all";
  dateRange = [];

  // 表格加载状态
  tableLoading = false;

  // 选中行
  selectedRowKeys: string[] = [];

  // 审核弹窗
  reviewModalVisible = false;
  reviewAction = "approve";
  reviewComment = "";
  currentDocument: Document | null = null;

  // 批量审核弹窗
  batchReviewModalVisible = false;
  batchReviewAction = "approve";
  batchReviewComment = "";

  // 状态选项
  statusOptions = [
    { label: "全部状态", value: "all" },
    { label: "待审核", value: "pending" },
    { label: "已通过", value: "approved" },
    { label: "已驳回", value: "rejected" },
  ];

  // 文档类型选项
  typeOptions = [
    { label: "全部分类", value: "all" },
    { label: "法律法规", value: "law" },
    { label: "监管政策", value: "policy" },
    { label: "内部规章", value: "internal" },
    { label: "解读文件", value: "explanation" },
  ];

  // 表格列配置
  columns = [
    {
      title: "标题 / 文号",
      key: "titles",
      scopedSlots: { customRender: "titles" },
    },
    {
      title: "分类",
      dataIndex: "type",
      key: "type",
      scopedSlots: { customRender: "type" },
      width: 120,
    },
    {
      title: "变更类型",
      dataIndex: "changeType",
      key: "changeType",
      width: 100,
    },
    {
      title: "提交人",
      dataIndex: "submitter",
      key: "submitter",
      width: 100,
    },
    {
      title: "提交时间",
      dataIndex: "submitTime",
      key: "submitTime",
      width: 160,
    },
    {
      title: "审核状态",
      dataIndex: "status",
      key: "status",
      scopedSlots: { customRender: "status" },
      width: 120,
    },
    {
      title: "操作",
      key: "action",
      scopedSlots: { customRender: "action" },
      fixed: "right",
      width: 240,
    },
  ];

  // 文档数据
  documents: Document[] = [];

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
      // 模拟网络请求和数据
      const mockData = [
        {
          id: "doc001",
          title: "保险资金股权投资管理暂行办法",
          version: "1.0",
          docNumber: "金监发[2024]10号",
          changeType: "新增",
          type: "law",
          submitter: "张三",
          submitTime: "2024-01-15 14:30",
          status: "pending",
          source: "金融监管总局",
        },
        {
          id: "doc002",
          title: "偿付能力监管规则修订征求意见稿",
          version: "2.1",
          docNumber: "金监发[2024]8号",
          changeType: "修订",
          type: "policy",
          submitter: "李四",
          submitTime: "2024-01-12 10:15",
          status: "pending",
          source: "金融监管总局",
        },
        {
          id: "doc003",
          title: "关于加强保险资金另类投资风险管理的通知",
          version: "1.0",
          docNumber: "金监发[2024]6号",
          changeType: "新增",
          type: "policy",
          submitter: "王五",
          submitTime: "2024-01-08 16:45",
          status: "approved",
          reviewer: "赵经理",
          reviewTime: "2024-01-10 09:30",
          source: "金融监管总局",
        },
        {
          id: "doc004",
          title: "保险公司关联交易管理实施细则",
          version: "3.0",
          docNumber: "内规[2024]02号",
          changeType: "修订",
          type: "internal",
          submitter: "赵六",
          submitTime: "2024-01-05 11:20",
          status: "rejected",
          reviewer: "钱经理",
          reviewTime: "2024-01-07 14:50",
          source: "内部法务部",
        },
        {
          id: "doc005",
          title: "《个人信息保护法》解读及适用指南",
          version: "2.0",
          docNumber: "参考[2024]01号",
          changeType: "更新",
          type: "explanation",
          submitter: "孙七",
          submitTime: "2024-01-03 09:45",
          status: "pending",
          source: "法务部",
        },
      ];

      await new Promise((r) => setTimeout(r, 1500));
      this.documents = mockData;
    } catch (error) {
      console.error("加载文档数据失败", error);
      this.$message.error("加载数据失败，请刷新页面重试");
    } finally {
      this.tableLoading = false;
    }
  }

  // 获取已筛选的文档列表
  get filteredDocuments() {
    let result = [...this.documents];

    // 搜索过滤
    if (this.searchText) {
      const text = this.searchText.toLowerCase();
      result = result.filter(
        (doc) =>
          doc.title.toLowerCase().includes(text) ||
          (doc.docNumber && doc.docNumber.toLowerCase().includes(text)) ||
          (doc.source && doc.source.toLowerCase().includes(text))
      );
    }

    // 状态筛选
    if (this.filterStatus !== "all") {
      result = result.filter((doc) => doc.status === this.filterStatus);
    }

    // 文档类型筛选
    if (this.filterType !== "all") {
      result = result.filter((doc) => doc.type === this.filterType);
    }

    return result;
  }

  // 获取待审核文档数量
  get pendingCount() {
    return this.documents.filter((doc) => doc.status === "pending").length;
  }

  // 获取文档总数
  get totalDocuments() {
    return this.documents.length;
  }

  // 获取是否有选中的行
  get hasSelection() {
    return this.selectedRowKeys.length > 0;
  }

  // 搜索方法
  onSearch(value: string): void {
    this.searchText = value;
  }

  // 筛选方法
  onFilterChange(value: string): void {
    // 筛选已在计算属性中处理
    this.refreshData();
  }

  // 日期范围变化
  onDateRangeChange(dates: moment.Moment[], dateStrings: string[]): void {
    // 日期已经双向绑定到dateRange，这里可以加入额外处理
    this.refreshData();
  }

  // 表格变化事件
  handleTableChange(pagination, filters, sorter): void {
    // 处理排序和过滤
    console.log("表格变化:", pagination, filters, sorter);
  }

  // 选择变化事件
  onSelectionChange(selectedRowKeys, selectedRows): void {
    this.selectedRowKeys = selectedRowKeys;
    console.log("选中行:", selectedRows);
  }

  // 刷新数据
  refreshData(): void {
    this.tableLoading = true;
    // 模拟API请求
    setTimeout(() => {
      this.tableLoading = false;
      this.$message.success("数据已刷新");
    }, 600);
  }

  // 获取状态文本
  getStatusText(status: string): string {
    const textMap: Record<string, string> = {
      pending: "待审核",
      approved: "已通过",
      rejected: "已驳回",
    };
    return textMap[status] || "未知";
  }

  // 获取类型文本
  getTypeText(type: string): string {
    const textMap: Record<string, string> = {
      law: "法律法规",
      policy: "监管政策",
      internal: "内部规章",
    };
    return textMap[type] || "其他";
  }

  // 获取类型颜色
  getTypeColor(type: string): string {
    const colorMap: Record<string, string> = {
      law: "red",
      policy: "orange",
      internal: "green",
    };
    return colorMap[type] || "blue";
  }

  // 查看文档
  viewDocument(document: Document): void {
    this.$message.info(`查看文档: ${document.title}`);
    // 实际项目中可能会跳转到文档比较页面
    this.$router.push(`/document-compare/${document.id}`);
  }

  // 审核通过
  approveDocument(document: Document): void {
    this.currentDocument = document;
    this.reviewAction = "approve";
    this.reviewComment = "";
    this.reviewModalVisible = true;
  }

  // 审核驳回
  rejectDocument(document: Document): void {
    this.currentDocument = document;
    this.reviewAction = "reject";
    this.reviewComment = "";
    this.reviewModalVisible = true;
  }

  // 提交审核
  submitReview(): void {
    if (this.reviewAction === "reject" && !this.reviewComment) {
      this.$message.error("驳回文档必须填写驳回原因");
      return;
    }

    // 模拟API请求
    setTimeout(() => {
      if (this.currentDocument) {
        const index = this.documents.findIndex(
          (d) => d.id === this.currentDocument?.id
        );
        if (index !== -1) {
          this.documents[index].status =
            this.reviewAction === "approve" ? "approved" : "rejected";
          this.documents[index].reviewer = "当前用户";
          this.documents[index].reviewTime =
            moment().format("YYYY-MM-DD HH:mm");
        }
      }

      this.reviewModalVisible = false;
      this.$message.success(
        this.reviewAction === "approve" ? "审核已通过" : "文档已驳回"
      );
    }, 500);
  }

  // 批量审核通过
  batchApprove(): void {
    if (this.selectedRowKeys.length === 0) {
      this.$message.warning("请先选择要操作的文档");
      return;
    }
    this.batchReviewAction = "approve";
    this.batchReviewComment = "";
    this.batchReviewModalVisible = true;
  }

  // 批量审核驳回
  batchReject(): void {
    if (this.selectedRowKeys.length === 0) {
      this.$message.warning("请先选择要操作的文档");
      return;
    }
    this.batchReviewAction = "reject";
    this.batchReviewComment = "";
    this.batchReviewModalVisible = true;
  }

  // 提交批量审核
  submitBatchReview(): void {
    if (this.batchReviewAction === "reject" && !this.batchReviewComment) {
      this.$message.error("批量驳回文档必须填写驳回原因");
      return;
    }

    // 模拟API请求
    setTimeout(() => {
      let updatedCount = 0;
      this.documents = this.documents.map((doc) => {
        if (this.selectedRowKeys.includes(doc.id) && doc.status === "pending") {
          updatedCount++;
          return {
            ...doc,
            status:
              this.batchReviewAction === "approve" ? "approved" : "rejected",
            reviewer: "当前用户",
            reviewTime: moment().format("YYYY-MM-DD HH:mm"),
          };
        }
        return doc;
      });

      this.batchReviewModalVisible = false;
      this.selectedRowKeys = [];
      this.$message.success(
        `已${
          this.batchReviewAction === "approve" ? "通过" : "驳回"
        }${updatedCount}个文档`
      );
    }, 500);
  }

  // 导出数据
  exportData(): void {
    this.$message.info("正在导出数据，请稍候...");

    // 模拟导出延迟
    setTimeout(() => {
      this.$message.success("数据已导出到 审核数据.xlsx");
    }, 1500);
  }

  // 计算属性：待审核文档操作按钮
  get getPendingActions() {
    return [
      {
        text: "批准",
        type: "primary",
        handler: (record: Document) => this.approveDocument(record),
      },
      {
        text: "驳回",
        type: "danger",
        handler: (record: Document) => this.rejectDocument(record),
      },
    ];
  }
}
</script>

<style lang="less" scoped>
// 基础样式
.lawyer-page-container {
  margin-bottom: 32px;
}

// 卡片样式
.lawyer-card {
  border-radius: 8px;
  border: 1px solid var(--lawyer-border);
  margin-bottom: 24px;
  // 头部卡片样式
  &.lawyer-header-card {
    padding: 24px 32px;
  }
}

// 卡片头部
.lawyer-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  // 标题部分
  .lawyer-card-title {
    font-size: 24px;
    margin-bottom: 0;
  }
}

// 表格控制区
.lawyer-table-controls {
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--lawyer-border);
}

// 状态标识
.lawyer-status-badge {
  padding: 3.2px 8px;
  border-radius: 4px;
  border: 1px solid transparent;
  // 不同状态样式
  &.status-pending {
    background-color: rgba(245, 158, 11, 0.1);
    color: var(--lawyer-warning);
    border-color: rgba(245, 158, 11, 0.3);

    &::before {
      background-color: var(--lawyer-warning);
    }
  }

  &.status-approved {
    background-color: rgba(16, 185, 129, 0.1);
    color: var(--lawyer-success);
    border-color: rgba(16, 185, 129, 0.3);

    &::before {
      background-color: var(--lawyer-success);
    }
  }

  &.status-rejected {
    background-color: rgba(239, 68, 68, 0.1);
    color: var(--lawyer-danger);
    border-color: rgba(239, 68, 68, 0.3);

    &::before {
      background-color: var(--lawyer-danger);
    }
  }
}
</style>
