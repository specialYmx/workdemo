<template>
  <div class="lawyer-page-container">
    <div class="lawyer-content-wrapper">
      <!-- 数据表格 -->
      <a-card class="lawyer-table-card" :bordered="false">
        <!-- 搜索和筛选区域 -->
        <div class="lawyer-search-form">
          <a-row :gutter="16">
            <a-col :span="5">
              <a-input
                v-model="searchParams.websiteName"
                placeholder="网站名称"
                allowClear
                @keyup.enter="onSearch"
              />
            </a-col>
            <a-col :span="5">
              <a-input
                v-model="searchParams.articleTitle"
                placeholder="文章标题"
                allowClear
                @keyup.enter="onSearch"
              />
            </a-col>
            <a-col :span="5">
              <div>
                <a-date-picker
                  v-model="searchParams.publishDate"
                  placeholder="发布日期"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  style="width: 100%"
                />
              </div>
            </a-col>
            <a-col :span="9" class="lawyer-search-buttons">
              <div class="lawyer-button-group">
                <a-button
                  type="primary"
                  @click="onSearch"
                  :loading="tableLoading"
                >
                  搜索
                </a-button>
                <a-button @click="onReset"> 重置 </a-button>
              </div>
            </a-col>
          </a-row>
        </div>

        <a-table
          :columns="columns"
          :data-source="dataList"
          :pagination="pagination"
          :loading="tableLoading"
          :rowKey="(record) => record.id"
          @change="handleTableChange"
        >
          <!-- 文章标题列 -->
          <template slot="articleTitle" slot-scope="text, record">
            <div class="lawyer-table-title">
              {{ getRecordValue(record, "articleTitle") }}
            </div>
          </template>

          <!-- 文章详情地址列 -->
          <template slot="detailUrl" slot-scope="text, record">
            <div class="lawyer-table-url">
              {{ getRecordValue(record, "detailUrl") || "-" }}
            </div>
          </template>

          <!-- 处理状态列 -->
          <template slot="processStatus" slot-scope="text">
            <a-tag
              :color="getStatusColor(getStringValue(text))"
              class="lawyer-status-tag"
            >
              {{ getStatusText(getStringValue(text)) }}
            </a-tag>
          </template>

          <!-- 发布日期列 -->
          <template slot="publishDate" slot-scope="text">
            {{ formatDateTime(getStringValue(text), "date") }}
          </template>

          <!-- 创建时间列 -->
          <template slot="createdTime" slot-scope="text">
            {{ formatDateTime(getStringValue(text)) }}
          </template>

          <!-- 更新时间列 -->
          <template slot="updateTime" slot-scope="text">
            {{ formatDateTime(getStringValue(text)) }}
          </template>

          <!-- 操作列 -->
          <template slot="action" slot-scope="text, record">
            <div class="lawyer-action-links">
              <a
                @click="executeTask(record)"
                class="lawyer-link-primary"
                :class="{ 'lawyer-link-disabled': isProcessing(record) }"
              >
                <a-icon
                  :type="isProcessing(record) ? 'loading' : 'play-circle'"
                  :spin="isProcessing(record)"
                />
                {{ isProcessing(record) ? "正在处理" : "执行" }}
              </a>
            </div>
          </template>
        </a-table>
      </a-card>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "nuxt-property-decorator";
import moment from "moment";
import { CrawlDataItem, CrawlStatisticsQueryParams } from "~/model/LawyerModel";
import { crawlStatisticsResponse } from "~/mock/craw.js";

@Component({ name: "lawyer-crawl-statistics-index-component" })
export default class CrawlStatisticsComponent extends Vue {
  // 搜索参数
  searchParams: CrawlStatisticsQueryParams = {
    websiteCode: "",
    websiteName: "",
    articleTitle: "",
    detailUrl: "",
    attachments: "",
    publishDate: "", // 可以设置为 "" 或 "2025-05-09" 这样的默认值
    current: 1,
    size: 10,
    orderBy: "created_time",
    sortRules: "DESC",
  };

  // 表格数据
  dataList: CrawlDataItem[] = [];
  tableLoading: boolean = false;

  // 定时器
  refreshTimer: NodeJS.Timeout | null = null;

  // 分页配置
  pagination = {
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total: number) => `共 ${total} 条记录`,
  };

  // 表格列配置
  columns = [
    {
      title: "网站编码",
      dataIndex: "websiteCode",
      key: "websiteCode",
      width: 120,
    },
    {
      title: "网站名称",
      dataIndex: "websiteName",
      key: "websiteName",
      width: 150,
    },
    {
      title: "文章标题",
      key: "articleTitle",
      scopedSlots: { customRender: "articleTitle" },
      width: 250,
      ellipsis: true,
    },
    {
      title: "文章详情地址",
      key: "detailUrl",
      scopedSlots: { customRender: "detailUrl" },
      width: 200,
      ellipsis: true,
    },
    {
      title: "处理状态",
      dataIndex: "processStatus",
      key: "processStatus",
      scopedSlots: { customRender: "processStatus" },
      width: 100,
    },
    {
      title: "文章发布日期",
      dataIndex: "publishDate",
      key: "publishDate",
      scopedSlots: { customRender: "publishDate" },
      width: 130,
      sorter: true,
    },
    {
      title: "创建时间",
      dataIndex: "createdTime",
      key: "createdTime",
      scopedSlots: { customRender: "createdTime" },
      width: 160,
      sorter: true,
    },
    {
      title: "更新时间",
      dataIndex: "updateTime",
      key: "updateTime",
      scopedSlots: { customRender: "updateTime" },
      width: 160,
      sorter: true,
    },
    {
      title: "操作",
      key: "action",
      scopedSlots: { customRender: "action" },
      width: 120,
      fixed: "right",
    },
  ];

  // 生命周期
  async mounted(): Promise<void> {
    await this.loadData();
    this.startAutoRefresh();
  }

  // 组件销毁时清理定时器
  beforeDestroy(): void {
    this.stopAutoRefresh();
  }

  // 加载数据
  async loadData(): Promise<void> {
    this.tableLoading = true;
    try {
      // 构建查询参数
      const apiParams: CrawlStatisticsQueryParams = {
        ...this.searchParams,
        publishDate: this.searchParams.publishDate || undefined,
      };

      // 调用真实API
      const response = await this.$roadLawyerService.getCrawlHtmlList(
        apiParams
      );

      if (response.success && response.data) {
        this.dataList = response.data.records;
        this.pagination.total = response.data.total;
        this.pagination.current = response.data.current;
      } else {
        // 如果API失败，使用模拟数据作为后备
        this.useMockData();
        console.warn("API调用失败，使用模拟数据:", response.message);
      }
    } catch (error) {
      console.error("加载数据失败:", error);
      // 出错时使用模拟数据
      this.useMockData();
      this.$message.error("加载数据失败，使用模拟数据");
    } finally {
      this.tableLoading = false;
    }
  }

  // 使用真实模拟数据
  useMockData(): void {
    const mockResponse = crawlStatisticsResponse;
    const allRecords = mockResponse.data.records;

    // 计算分页
    const startIndex = (this.searchParams.current - 1) * this.searchParams.size;
    const endIndex = startIndex + this.searchParams.size;
    const paginatedRecords = allRecords.slice(startIndex, endIndex);

    // 设置数据
    this.dataList = paginatedRecords;
    this.pagination.total = allRecords.length;
    this.pagination.current = this.searchParams.current;
  }

  // 搜索
  async onSearch(): Promise<void> {
    this.searchParams.current = 1;
    this.pagination.current = 1;
    await this.loadData();
  }

  // 重置搜索
  async onReset(): Promise<void> {
    this.searchParams = {
      websiteCode: "",
      websiteName: "",
      articleTitle: "",
      detailUrl: "",
      attachments: "",
      publishDate: "",
      current: 1,
      size: 10,
      orderBy: "created_time",
      sortRules: "DESC",
    };
    this.pagination.current = 1;
    await this.loadData();
  }

  // 表格变化处理
  async handleTableChange(
    pagination: { current: number; pageSize: number },
    _filters: unknown,
    sorter: { field?: string; order?: string }
  ): Promise<void> {
    this.searchParams.current = pagination.current;
    this.searchParams.size = pagination.pageSize;

    if (sorter.field) {
      this.searchParams.orderBy = sorter.field;
      this.searchParams.sortRules = sorter.order === "ascend" ? "ASC" : "DESC";
    }

    await this.loadData();
  }

  // 获取状态颜色
  getStatusColor(status: string): string {
    const colorMap: { [key: string]: string } = {
      处理成功: "green",
      处理失败: "red",
      处理中: "blue",
      待处理: "orange",
    };
    return colorMap[status] || "default";
  }

  // 获取状态文本
  getStatusText(status: string): string {
    // 直接返回状态文本，因为真实数据已经是中文
    return status || "未知";
  }

  // 格式化日期时间（统一方法）
  formatDateTime(
    datetime: string,
    format: "date" | "datetime" = "datetime"
  ): string {
    if (!datetime) return "-";
    try {
      const m = moment(datetime);
      return format === "date"
        ? m.format("YYYY-MM-DD")
        : m.format("YYYY-MM-DD HH:mm:ss");
    } catch {
      return datetime; // 如果解析失败，返回原始字符串
    }
  }

  // 辅助方法：安全获取记录值
  getRecordValue(record: unknown, key: string): string {
    if (record && typeof record === "object" && key in record) {
      const value = (record as Record<string, unknown>)[key];
      return typeof value === "string" ? value : String(value || "");
    }
    return "";
  }

  // 辅助方法：安全获取字符串值
  getStringValue(value: unknown): string {
    return typeof value === "string" ? value : String(value || "");
  }

  // 判断任务是否正在处理中
  isProcessing(record: CrawlDataItem): boolean {
    const status = this.getRecordValue(record, "processStatus");
    return status === "处理中" || status === "processing";
  }

  // 开始自动刷新
  startAutoRefresh(): void {
    // 每10分钟刷新一次（600000毫秒）
    this.refreshTimer = setInterval(() => {
      // 只有当存在处理中的任务时才自动刷新
      const hasProcessingTasks = this.dataList.some((item) =>
        this.isProcessing(item)
      );
      if (hasProcessingTasks) {
        this.loadData();
      }
    }, 600000);
  }

  // 停止自动刷新
  stopAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  // 执行任务
  async executeTask(record: CrawlDataItem): Promise<void> {
    this.$confirm({
      title: "确认执行任务",
      content: `确定要执行网站"${record.websiteName}"的爬取任务吗？`,
      okText: "确认",
      cancelText: "取消",
      onOk: async () => {
        try {
          // 更新状态为处理中
          record.processStatus = "处理中";
          this.$message.loading("正在执行任务...", 0);

          // 调用真实API
          const response = await this.$roadLawyerService.executeCrawlTask({
            id: record.id,
          });

          this.$message.destroy();

          if (response.success) {
            record.processStatus = "处理成功";
            record.updateTime = moment().format("YYYY-MM-DD HH:mm:ss");
            this.$message.success("任务执行成功");
          } else {
            record.processStatus = "处理失败";
            this.$message.error(response.message || "任务执行失败，请重试");
          }

          // 刷新数据
          await this.loadData();
        } catch (error) {
          this.$message.destroy();
          console.error("执行任务失败:", error);
          this.$message.error("执行任务失败，请重试");
          record.processStatus = "处理失败";
        }
      },
    });
  }
}
</script>

<style lang="less">
.lawyer-search-form {
  margin-bottom: 16px;
}

.lawyer-search-buttons {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.lawyer-button-group {
  display: flex;
  gap: 8px;
}

.lawyer-status-tag {
  width: 60px;
  text-align: center;
  display: inline-block;
}

.lawyer-table-card {
  .ant-table-wrapper {
    .ant-table-tbody > tr > td {
      padding: 12px 16px;
    }
  }
}

.lawyer-table-title {
  font-weight: 500;
  color: var(--lawyer-text);
  margin-bottom: 4px;
}

.lawyer-table-url {
  color: var(--lawyer-text);
  word-break: break-all;
}

.lawyer-action-links {
  display: flex;
  gap: 8px;

  a {
    font-size: 14px;
    display: inline-flex;
    align-items: center;

    &.lawyer-link-view {
      color: var(--lawyer-primary);
    }

    &.lawyer-link-primary {
      color: var(--lawyer-success);

      &:hover:not(.lawyer-link-disabled) {
        color: var(--lawyer-success-hover);
      }
    }

    &.lawyer-link-disabled {
      color: var(--lawyer-text-light);
      cursor: not-allowed;
      pointer-events: none;
    }

    .anticon {
      margin-right: 4px;
    }
  }
}
</style>
