<template>
  <div class="index-page-wrapper">
    <div class="lawyer-page-container">
      <!-- 顶部仪表盘 -->
      <dashboard-overview
        :monthly-update-count="monthlyUpdateCount"
        :pending-review-count="pendingReviewCount"
        :recent-reviews="recentReviews"
        :recent-reviews-loading="listLoading.recentReviews"
        :trend-chart-data="chartData.trend"
        :trend-chart-loading="chartLoading.trend"
        :active-time-range="activeTimeRange"
        :trend-chart-period="trendChartPeriod"
        @time-range-change="handleTimeRangeChange"
        @trend-period-change="handleTrendPeriodChange"
        @export-report="exportStatisticReport"
        @view-reviews="goToReviewPage"
      />

      <!-- Top 5 需要人工审核 -->
      <review-table
        :reviews="topReviews"
        :loading="listLoading.topReviews"
        @view-all="goToReviewPage"
        @view-detail="viewReviewDetail"
        @approve="approveReview"
        @reject="rejectReview"
      />

      <!-- 环形图和来源分布 -->
      <div class="lawyer-two-column-chart-grid">
        <source-distribution
          :chart-data="chartData.sources"
          :legend-items="sourceLegendItems"
          :loading="chartLoading.sources"
        />
      </div>

      <!-- 最新法规更新卡片 -->
      <latest-updates
        :updates="latestUpdates"
        :loading="listLoading.latestUpdates"
        @view-all="goToUpdatesPage"
        @view-detail="viewUpdateDetail"
      />
    </div>
  </div>
</template>

<script lang="ts">
// @ts-nocheck
import { Component, Vue } from "nuxt-property-decorator";
import DashboardOverview from "@/components/index/DashboardOverview.vue";
import ReviewTable from "@/components/index/ReviewTable.vue";
import SourceDistribution from "@/components/index/SourceDistribution.vue";
import LatestUpdates from "@/components/index/LatestUpdates.vue";
import {
  CompletedRuleItem,
  ToDoRuleItem,
  KnowledgeDataItem,
} from "~/model/LawyerModel";
import { downloadFileWithMessage } from "~/utils/downloadHelper";

@Component({
  components: {
    DashboardOverview,
    ReviewTable,
    SourceDistribution,
    LatestUpdates,
  },
  head() {
    return {
      title: "首页概览 - 法律合规智能系统",
    };
  },
})
export default class IndexPage extends Vue {
  // 数据加载状态
  chartLoading = {
    trend: true,
    sources: true,
  };

  // 图表数据
  chartData = {
    trend: {},
    sources: {},
  };

  // 列表数据加载状态
  listLoading = {
    recentReviews: true,
    topReviews: true,
    latestUpdates: true,
  };

  // 当前选中的时间范围
  activeTimeRange = "month";

  // 图表周期
  trendChartPeriod = "month";

  // 列表数据
  recentReviews: CompletedRuleItem[] = [];
  topReviews: ToDoRuleItem[] = [];
  latestUpdates: KnowledgeDataItem[] = [];

  // 统计数据
  pendingReviewCount = 0;
  monthlyUpdateCount = 0;

  // 来源图例数据
  sourceLegendItems = [];

  // 生命周期钩子
  async mounted() {
    // 按顺序加载所有数据
    try {
      // 加载图表数据
      await this.loadTrendChartData();
      await this.loadSourcesChartData();

      // 加载列表数据
      await this.loadRecentReviews();
      await this.loadTopReviews();
      await this.loadLatestUpdates();

      // 加载统计数据
      await this.loadPendingReviewCount();
      await this.loadMonthlyUpdateCount();
    } catch (error) {
      console.error("加载数据失败:", error);
    }
  }

  // 事件处理方法
  handleTimeRangeChange(value) {
    this.activeTimeRange = value;
    // 重新加载基于时间条件的数据
    this.loadMonthlyUpdateCount();
  }

  handleTrendPeriodChange(value) {
    this.trendChartPeriod = value;
    this.loadTrendChartData();
  }

  // 加载趋势图数据
  async loadTrendChartData() {
    this.chartLoading.trend = true;
    try {
      // 调用真实API获取数据
      const updateTimelinessData =
        await this.$roadLawyerService.getUpdateTimeLinessCount({
          condition: this.trendChartPeriod,
        });
      console.log("趋势图数据:", updateTimelinessData);

      // 根据真实API返回的数据结构来解析
      if (updateTimelinessData && typeof updateTimelinessData === "object") {
        // 根据API返回格式为：
        // { modify: [数组], public: [数组], revoke: [数组] }
        const {
          modify = [],
          public: publicData = [],
          revoke = [],
        } = updateTimelinessData;

        // 生成X轴数据（根据数组长度动态生成）
        const dataLength = Math.max(
          modify.length,
          publicData.length,
          revoke.length
        );
        const xAxisData = [];

        // 根据周期生成不同的X轴标签
        if (this.trendChartPeriod === "month") {
          // 按日显示
          for (let i = 1; i <= dataLength; i++) {
            xAxisData.push(`${i}日`);
          }
        } else if (this.trendChartPeriod === "quarter") {
          // 按季度显示
          const quarterLabels = ["Q1", "Q2", "Q3", "Q4"];
          for (let i = 0; i < Math.min(dataLength, 4); i++) {
            xAxisData.push(quarterLabels[i]);
          }
        } else if (this.trendChartPeriod === "year") {
          // 按月显示
          for (let i = 1; i <= dataLength; i++) {
            xAxisData.push(`${i}月`);
          }
        }

        // 构建图表数据，按照 [新发布, 修订, 废止] 的顺序
        const seriesData = [
          publicData, // 新发布
          modify, // 修订
          revoke, // 废止
        ];

        this.chartData.trend = {
          xAxis: { data: xAxisData },
          series: seriesData.map((data) => ({ data })),
        };
      } else {
        // API返回数据无效时，设置空数据
        console.warn("趋势图API返回数据无效，设置空数据");
        this.chartData.trend = {
          xAxis: { data: [] },
          series: [{ data: [] }, { data: [] }, { data: [] }],
        };
      }
    } catch (error) {
      console.error("调用趋势图API失败:", error);
      // API调用失败时，设置空数据
      this.chartData.trend = {
        xAxis: { data: [] },
        series: [{ data: [] }, { data: [] }, { data: [] }],
      };
    } finally {
      this.chartLoading.trend = false;
    }
  }

  // 加载图表数据的通用方法
  async loadPieChartData(chartType, duration = 1500) {
    const loadingKey = "sources";
    this.chartLoading[loadingKey] = true;

    try {
      // 调用真实API获取数据
      const websiteRatioData = await this.$roadLawyerService.getWebSiteRatio();
      console.log("网站比例数据:", websiteRatioData);

      // 定义颜色映射
      const colorMap = {
        国家金融监督管理总局: "#1890ff",
        人民银行网站: "#13c2c2",
        证监会公告: "#52c41a",
        财政部通知: "#faad14",
        交易所规则: "#722ed1",
        行业协会: "#eb2f96",
        其他机构: "#fadb14",
      };

      // 处理API返回的数据结构 - 兼容两种格式
      const sourceData = websiteRatioData;

      if (sourceData && typeof sourceData === "object") {
        // 转换数据格式为饼图需要的格式
        const pieData = [];
        const legendItems = [];

        Object.keys(sourceData).forEach((key) => {
          const value = sourceData[key];

          // 饼图只显示有数据的项目（避免0%扇形）
          if (value > 0) {
            pieData.push({ value, name: key });
          }

          // 图例显示所有项目（包括0值，让用户了解完整的数据源）
          legendItems.push({
            name: key,
            value, // 保留value用于判断是否为空状态
            color: colorMap[key] || "#999999",
          });
        });

        this.chartData[loadingKey] = {
          series: [{ data: pieData }],
        };

        // 更新图例数据
        this.sourceLegendItems = legendItems;

        console.log("饼图数据处理完成:", { pieData, legendItems });
      } else {
        // 如果API没有返回有效数据，设置空数据
        this.chartData[loadingKey] = {
          series: [{ data: [] }],
        };
        this.sourceLegendItems = [];
        console.log("API返回数据无效，设置空数据");
      }
    } catch (error) {
      console.error("调用网站比例API失败:", error);
      // API调用失败时设置空数据
      this.chartData[loadingKey] = {
        series: [{ data: [] }],
      };
      this.sourceLegendItems = [];
    } finally {
      this.chartLoading[loadingKey] = false;
    }
  }

  // 加载来源分布数据
  loadSourcesChartData() {
    return this.loadPieChartData("sources", 1500);
  }

  // 加载列表数据的通用方法
  async loadListData(listType, mockData, duration = 1000) {
    this.listLoading[listType] = true;
    try {
      await new Promise((resolve) => setTimeout(resolve, duration));
      this[listType] = mockData;
    } finally {
      this.listLoading[listType] = false;
    }
  }

  // 加载近期完成审核数据
  async loadRecentReviews() {
    this.listLoading.recentReviews = true;
    try {
      const data = await this.$roadLawyerService.getCheckCompleteList();
      // 前端取前5条数据
      this.recentReviews = Array.isArray(data) ? data.slice(0, 5) : [];
    } catch (error) {
      console.error("加载近期完成审核数据失败:", error);
      this.recentReviews = [];
    } finally {
      this.listLoading.recentReviews = false;
    }
  }

  // 加载需要人工审核的数据
  async loadTopReviews() {
    this.listLoading.topReviews = true;
    try {
      const data = await this.$roadLawyerService.getCheckRuleList();
      // 前端取前5条数据
      this.topReviews = Array.isArray(data)
        ? data.slice(0, 5)
        : (data?.list || []).slice(0, 5);
    } catch (error) {
      console.error("加载待审核数据失败:", error);
      this.topReviews = [];
    } finally {
      this.listLoading.topReviews = false;
    }
  }

  // 加载最新法规更新数据
  async loadLatestUpdates() {
    this.listLoading.latestUpdates = true;
    try {
      const params = {
        empId: this.$store.state.auth.id,
      };
      const data = await this.$roadLawyerService.getRuleSourceList(params);
      // 前端取前5条数据
      this.latestUpdates = Array.isArray(data) ? data.slice(0, 5) : [];
    } catch (error) {
      console.error("加载最新法规更新数据失败:", error);
      this.latestUpdates = [];
    } finally {
      this.listLoading.latestUpdates = false;
    }
  }

  // 加载待审核统计数据
  async loadPendingReviewCount() {
    try {
      const data = await this.$roadLawyerService.getCheckRuleList();
      // 获取数组长度作为统计数据
      this.pendingReviewCount = Array.isArray(data)
        ? data.length
        : data?.list?.length || 0;
    } catch (error) {
      console.error("加载待审核统计数据失败:", error);
      this.pendingReviewCount = 0;
    }
  }

  // 加载法规更新数量（根据当前选中的时间范围）
  async loadMonthlyUpdateCount() {
    try {
      const data = await this.$roadLawyerService.getUpdateCount({
        condition: this.activeTimeRange, // 使用当前选中的时间范围
      });
      // 根据您说的数据格式：res.data.data，类型是number
      this.monthlyUpdateCount = data || 0;
    } catch (error) {
      console.error("加载法规更新数量失败:", error);
      this.monthlyUpdateCount = 0;
    }
  }

  // 页面跳转方法
  goToReviewPage() {
    this.$router.push("/db");
  }

  goToUpdatesPage() {
    this.$router.push("/updates");
  }

  // 审核操作方法
  viewReviewDetail(record) {
    this.$message.info(`查看详情: ${record.ruleName || record.title}`);
    // 跳转到文档比较页面
    this.$router.push({
      path: "/document-compare",
      query: {
        id: record.id,
        pageTitle: record.ruleName || record.title,
      },
    });
  }

  // 审核通过
  approveReview(record) {
    this.$confirm({
      title: "确认通过",
      content: `确定要通过文档"${record.ruleName}"的审核吗？`,
      okText: "确认通过",
      cancelText: "取消",
      onOk: () => {
        this.submitReview(record, "approve");
      },
    });
  }

  // 审核驳回
  rejectReview(record) {
    this.$confirm({
      title: "确认驳回",
      content: `确定要驳回文档"${record.ruleName}"吗？`,
      okText: "确认驳回",
      okType: "danger",
      cancelText: "取消",
      onOk: () => {
        this.submitReview(record, "reject");
      },
    });
  }

  // 提交审核
  async submitReview(record, action) {
    try {
      console.log("开始审核操作:", { recordId: record.id, action });

      // 调用统一的审核接口 - service层已处理所有错误情况
      await this.$roadLawyerService.approveToDoRule({
        id: record.id,
        approvalComment: action === "approve" ? "已通过" : "已驳回",
      });

      // 显示成功消息
      this.$message.success(action === "approve" ? "审核已通过" : "文档已驳回");

      // 重新加载数据
      await this.loadTopReviews();
      await this.loadPendingReviewCount();
    } catch (error) {
      console.error("审核操作失败:", error);

      // service层已经处理了错误信息，直接使用error.message
      const errorMessage = error.message || "审核操作失败，请重试";
      this.$message.error(errorMessage);
    }
  }

  // 导出统计报告
  async exportStatisticReport() {
    try {
      this.$message.loading("正在生成统计报告，请稍候...", 0);

      // 根据当前选择的时间范围导出
      const condition = this.activeTimeRange;
      const result = await this.$roadLawyerService.exportStatisticExcel({
        condition,
      });

      this.$message.destroy();

      if (result) {
        // 生成文件名
        const timeRangeMap = {
          month: "本月",
          quarter: "本季度",
          year: "本年度",
        };
        const timeLabel = timeRangeMap[condition] || condition;
        const fileName = `法规统计报告_${timeLabel}_${new Date()
          .toISOString()
          .slice(0, 10)}.xlsx`;

        if (
          downloadFileWithMessage(result, {
            fileName,
            showMessage: true,
            messageService: this.$message,
          })
        ) {
          // 下载成功，消息已在 downloadFileWithMessage 中处理
        } else {
          this.$message.error("导出失败，请重试");
        }
      } else {
        this.$message.error("导出失败，请重试");
      }
    } catch (error) {
      this.$message.destroy();
      console.error("导出统计报告失败:", error);
      const errorMessage = error.message || "导出失败，请重试";
      this.$message.error(errorMessage);
    }
  }

  // 查看法规更新详情
  viewUpdateDetail(item) {
    this.$router.push({
      path: "/document",
      query: { id: item.id },
    });
  }
}
</script>

<style lang="less">
.index-page-wrapper {
  .lawyer-page-container {
    padding: 20px;

    .lawyer-two-column-chart-grid {
      display: flex;
      margin-bottom: 24px;

      .lawyer-chart-card {
        flex: 1;
      }
    }
  }
}
</style>
