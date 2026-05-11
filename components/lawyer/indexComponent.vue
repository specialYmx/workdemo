<template>
  <div class="index-page-wrapper">
    <div class="lawyer-page-container">
      <!-- 顶部仪表盘 -->
      <lawyer-index-dashboard-overview
        :monthly-update-count="monthlyUpdateCount"
        :pending-review-count="pendingReviewCount"
        :recent-reviews="recentReviews"
        :recent-reviews-loading="listLoading.recentReviews"
        :trend-chart-data="chartData.trend"
        :trend-chart-loading="chartLoading.trend"
        :active-time-range="activeTimeRange"
        :trend-chart-period="trendChartPeriod"
        :trend-chart-value="trendChartValue"
        @time-range-change="handleTimeRangeChange"
        @trend-period-change="handleTrendPeriodChange"
        @export-report="exportStatisticReport"
        @export-update-detail="exportUpdateDetail"
        @view-reviews="goToReviewPageFromHistory"
      />

      <!-- Top 5 需要人工审核 -->
      <lawyer-index-review-table
        :reviews="topReviews"
        :loading="listLoading.topReviews"
        @view-all="goToReviewPageFromPending"
        @view-detail="viewReviewDetail"
        @approve="approveReview"
        @reject="rejectReview"
      />

      <!-- 环形图和来源分布 -->
      <div class="lawyer-two-column-chart-grid">
        <lawyer-index-source-distribution
          :chart-data="chartData.sources"
          :legend-items="sourceLegendItems"
          :loading="chartLoading.sources"
        />
      </div>

      <!-- 最新法规更新卡片 -->
      <lawyer-index-latest-updates
        :updates="latestUpdates"
        :loading="listLoading.latestUpdates"
        @view-all="goToUpdatesPage"
        @view-detail="viewUpdateDetail"
      />
    </div>
  </div>
</template>

<script lang="ts">
  import { Component, Vue } from 'nuxt-property-decorator';
  import type {
    CompletedRuleItem,
    ToDoRuleItem,
    BaseRuleItem,
    IndexPageChartLoading,
    IndexPageChartData,
    IndexPageListLoading,
    LegendItem,
    TrendChartData,
    ChartData,
    RouteQuery
  } from '~/model/LawyerModel';
  import { downloadFileWithMessage } from '~/utils/personal';

  @Component({ name: 'index-component' })
  class IndexComponent extends Vue {
    // 数据加载状态
    chartLoading: IndexPageChartLoading = {
      trend: true,
      sources: true
    };

    // 图表数据
    chartData: IndexPageChartData = {
      trend: {} as TrendChartData,
      sources: {} as ChartData
    };

    // 列表数据加载状态
    listLoading: IndexPageListLoading = {
      recentReviews: true,
      topReviews: true,
      latestUpdates: true
    };

    // 当前选中的时间范围
    activeTimeRange: string = 'month';

    // 图表周期
    trendChartPeriod: string = 'month';

    // 图表周期具体值
    trendChartValue: number = new Date().getMonth() + 1;

    // 列表数据
    recentReviews: CompletedRuleItem[] = [];
    topReviews: ToDoRuleItem[] = [];
    latestUpdates: BaseRuleItem[] = [];

    // 统计数据
    pendingReviewCount: number = 0;
    monthlyUpdateCount: number = 0;

    // 来源图例数据
    sourceLegendItems: LegendItem[] = [];

    get basePath(): string {
      const path = this.$route.path.split('/').filter(segment => segment)[0] || 'road';
      return ``;
    }

    // 生命周期钩子
    async mounted(): Promise<void> {
      // 按顺序加载所有数据
      try {
        // 加载图表数据
        await this.loadTrendChartData();
        await this.loadSourcesChartData();

        // 加载列表数据
        await this.loadRecentReviews();
        await this.loadTopReviewsAndCount(); // 合并加载待审核数据和统计数据
        await this.loadLatestUpdates();

        // 加载统计数据
        await this.loadMonthlyUpdateCount();
      } catch (error) {
        console.error('加载数据失败:', error);
      }
    }

    // 事件处理方法
    handleTimeRangeChange(value: string): void {
      this.activeTimeRange = value;
      // 重新加载基于时间条件的数据
      this.loadMonthlyUpdateCount();
    }

    handleTrendPeriodChange(period: string, value: number): void {
      this.trendChartPeriod = period;
      this.trendChartValue = value;
      this.loadTrendChartData();
    }

    // 加载趋势图数据
    async loadTrendChartData(): Promise<void> {
      this.chartLoading.trend = true;
      try {
        // 调用真实API获取数据
        const updateTimelinessData = await this.$roadLawyerService.getUpdateTimelinessCount({
          condition: this.trendChartPeriod,
          value: this.trendChartValue
        });

        // 根据真实API返回的数据结构来解析
        if (updateTimelinessData && typeof updateTimelinessData === 'object') {
          // { modify: [数组], publish: [数组], revoke: [数组] }
          const { modify = [], publish: publicData = [], revoke = [] } = updateTimelinessData;

          // 生成X轴数据（根据数组长度动态生成）
          const dataLength: number = Math.max(modify.length, publicData.length, revoke.length);
          const xAxisData: string[] = [];

          // 根据周期和具体值生成不同的X轴标签
          if (this.trendChartPeriod === 'month') {
            // 选择了月度+具体月份：显示该月的每一天
            const rawMonth = Number(this.trendChartValue);
            const month = Number.isFinite(rawMonth)
              ? Math.min(12, Math.max(1, rawMonth))
              : new Date().getMonth() + 1;
            const daysInMonth = new Date(new Date().getFullYear(), month, 0).getDate();
            const actualLength = Math.min(dataLength, daysInMonth);
            for (let i = 1; i <= actualLength; i++) {
              xAxisData.push(`${i}日`);
            }
          } else if (this.trendChartPeriod === 'quarter') {
            // 选择了季度+具体季度：显示该季度的三个月
            const quarterStartMonth = (this.trendChartValue - 1) * 3 + 1;
            const monthLabels = [
              `${quarterStartMonth}月`,
              `${quarterStartMonth + 1}月`,
              `${quarterStartMonth + 2}月`
            ];
            const actualLength = Math.min(dataLength, 3);
            for (let i = 0; i < actualLength; i++) {
              xAxisData.push(monthLabels[i]);
            }
          } else if (this.trendChartPeriod === 'year') {
            // 选择了年度+具体年份：显示该年的12个月
            const months = Math.min(dataLength, 12);
            for (let i = 1; i <= months; i++) {
              xAxisData.push(`${i}月`);
            }
          }

          // 构建图表数据，按照 [新发布, 修订, 废止] 的顺序
          const seriesData: number[][] = [
            publicData, // 新发布
            modify, // 修订
            revoke // 废止
          ];

          this.chartData.trend = {
            xAxis: { data: xAxisData },
            series: seriesData.map((data: number[]) => ({ data }))
          };
        } else {
          // API返回数据无效时，设置空数据
          console.warn('趋势图API返回数据无效，设置空数据');
          this.chartData.trend = {
            xAxis: { data: [] },
            series: [{ data: [] }, { data: [] }, { data: [] }]
          };
        }
      } catch (error) {
        console.error('调用趋势图API失败:', error);
        // API调用失败时，设置空数据
        this.chartData.trend = {
          xAxis: { data: [] },
          series: [{ data: [] }, { data: [] }, { data: [] }]
        };
      } finally {
        this.chartLoading.trend = false;
      }
    }

    // 加载来源分布图表数据
    async loadPieChartData(): Promise<void> {
      const loadingKey = 'sources';
      this.chartLoading[loadingKey] = true;

      try {
        // 调用真实API获取数据
        const websiteRatioData = await this.$roadLawyerService.getWebSiteRatio({
          picture: 'chart'
        });

        // 处理API返回的数据结构 - 兼容两种格式
        const sourceData = websiteRatioData;

        if (sourceData && typeof sourceData === 'object' && !Array.isArray(sourceData)) {
          // 转换数据格式为饼图需要的格式
          const pieData: Array<{ value: number; name: string }> = [];
          const legendItems: LegendItem[] = [];

          Object.keys(sourceData).forEach((key: string) => {
            const value: number = sourceData[key];

            // 饼图只显示有数据的项目（避免0%扇形）
            if (value > 0) {
              pieData.push({ value, name: key });
            }

            // 图例显示所有项目（包括0值，让用户了解完整的数据源）
            legendItems.push({
              name: key,
              value, // 保留value用于判断是否为空状态
              color: '' // 子组件按名称统一映射颜色，此处仅满足类型约束
            });
          });

          this.chartData[loadingKey] = {
            series: [{ data: pieData }]
          };

          // 更新图例数据
          this.sourceLegendItems = legendItems;
        } else {
          // 如果API没有返回有效数据，设置空数据
          this.chartData[loadingKey] = {
            series: [{ data: [] }]
          };
          this.sourceLegendItems = [];
          console.log('API返回数据无效，设置空数据');
        }
      } catch (error) {
        console.error('调用网站比例API失败:', error);
        // API调用失败时设置空数据
        this.chartData[loadingKey] = {
          series: [{ data: [] }]
        };
        this.sourceLegendItems = [];
      } finally {
        this.chartLoading[loadingKey] = false;
      }
    }

    // 加载来源分布数据
    loadSourcesChartData(): Promise<void> {
      return this.loadPieChartData();
    }

    // 加载近期完成审核数据
    async loadRecentReviews(): Promise<void> {
      this.listLoading.recentReviews = true;
      try {
        const data = await this.$roadLawyerService.getCheckCompleteList({});
        // 前端取前5条数据
        this.recentReviews = Array.isArray(data) ? data.slice(0, 5) : [];
      } catch (error) {
        console.error('加载近期完成审核数据失败:', error);
        this.recentReviews = [];
      } finally {
        this.listLoading.recentReviews = false;
      }
    }

    // 加载需要人工审核的数据和统计数据（合并优化，避免重复调用接口）
    async loadTopReviewsAndCount(): Promise<void> {
      this.listLoading.topReviews = true;
      try {
        // 使用统一的 getRuleList 方法，指定为首页场景
        const response = await this.$roadLawyerService.getRuleList({}, 'homepage');

        // 首页场景返回的是数组类型
        const reviewList = Array.isArray(response) ? response : [];

        // 同时更新列表和统计数据
        this.topReviews = reviewList.slice(0, 5);
        this.pendingReviewCount = reviewList.length;
      } catch (error) {
        console.error('加载待审核数据失败:', error);
        this.topReviews = [];
        this.pendingReviewCount = 0;
      } finally {
        this.listLoading.topReviews = false;
      }
    }

    // 加载最新法规更新数据
    async loadLatestUpdates(): Promise<void> {
      this.listLoading.latestUpdates = true;
      try {
        const response = await this.$roadLawyerService.getRuleUpdateList({
          page: 1,
          pageSize: 5
        });

        // 处理新的响应结构
        if (response?.success && response?.data?.data) {
          this.latestUpdates = response.data.data;
        } else if (Array.isArray(response)) {
          // 兼容旧的数组格式返回
          this.latestUpdates = response.slice(0, 5);
        } else {
          this.latestUpdates = [];
        }
      } catch (error) {
        console.error('加载最新法规更新数据失败:', error);
        this.latestUpdates = [];
      } finally {
        this.listLoading.latestUpdates = false;
      }
    }

    // 加载法规更新数量（根据当前选中的时间范围）
    async loadMonthlyUpdateCount(): Promise<void> {
      try {
        const data = await this.$roadLawyerService.getUpdateCount({
          condition: this.activeTimeRange // 使用当前选中的时间范围
        });
        this.monthlyUpdateCount = data || 0;
      } catch (error) {
        console.error('加载法规更新数量失败:', error);
        this.monthlyUpdateCount = 0;
      }
    }

    // 从查看历史记录跳转到人工审核页面（显示已通过和已驳回）
    goToReviewPageFromHistory(): void {
      this.$router.push({
        path: `${this.basePath}/manualReview`,
        query: { filter: 'completed' }
      });
    }

    // 从待审核列表查看全部跳转到人工审核页面（显示待审核）
    goToReviewPageFromPending(): void {
      this.$router.push({
        path: `${this.basePath}/manualReview`,
        query: { filter: 'pending' }
      });
    }

    goToUpdatesPage(): void {
      this.$router.push(`${this.basePath}/lawyerUpdate`);
    }

    // 查看法规更新详情
    viewUpdateDetail(item: BaseRuleItem): void {
      // 检查废止状态
      const isRevoke: boolean = !!(item.revokeDateTimestamp || item.revokeDateStr);
      const query: RouteQuery = {
        id: item.id,
        pageTitle: item.ruleName,
        source: this.$route.path, // 传递来源页面路径，用于控制显示逻辑和返回行为
        ...(isRevoke ? { isRevoke: 'true' } : {})
      };

      this.$router.push({
        path: `${this.basePath}/lawyerUpdate/detail`,
        query
      });
    }

    // 审核操作方法
    viewReviewDetail(record: ToDoRuleItem): void {
      this.$message.info(`查看详情: ${record.ruleName}`);
      // 跳转到文档比较页面
      this.$router.push({
        path: `${this.basePath}/manualReview/detail`,
        query: {
          path: 'lawyerIndex',
          id: record.id,
          pageTitle: record.ruleName,
          checkStatus: record.checkStatus || '待审核' // 传递审核状态
        }
      });
    }

    // 审核通过
    approveReview(record: ToDoRuleItem): void {
      // 验证分类信息
      if (!record.categoryId) {
        this.$message.warning('该数据缺少分类信息，无法进行审核操作');
        return;
      }

      this.$confirm({
        title: '确认通过',
        content: `确定要通过文档"${record.ruleName}"的审核吗？`,
        okText: '确认通过',
        cancelText: '取消',
        onOk: () => {
          this.submitReview(record, 'approve');
        }
      });
    }

    // 审核驳回
    rejectReview(record: ToDoRuleItem): void {
      this.$confirm({
        title: '确认驳回',
        content: `确定要驳回文档"${record.ruleName}"吗？`,
        okText: '确认驳回',
        okType: 'danger',
        cancelText: '取消',
        onOk: () => {
          this.submitReview(record, 'reject');
        }
      });
    }

    // 提交审核
    async submitReview(record: ToDoRuleItem, action: string): Promise<void> {
      try {
        console.log('开始审核操作:', { recordId: record.id, action });

        // 调用统一的审核接口，传递与详情页面一致的参数
        await this.$roadLawyerService.approveToDoRule({
          id: record.id,
          approvalComment: action === 'approve' ? '已通过' : '已驳回',
          effectDateStr: record.effectDate || null, // 施行日期
          categoryMain: record.categoryMain || null, // 分类名称
          categoryId: record.categoryId || null // 分类ID
        });

        // 显示成功消息
        this.$message.success(action === 'approve' ? '审核已通过' : '文档已驳回');

        // 重新加载数据
        await this.loadTopReviewsAndCount();
      } catch (error) {
        console.error('审核操作失败:', error);
        this.$message.error('审核操作失败，请重试');
      }
    }

    // 导出统计报告
    async exportStatisticReport(): Promise<void> {
      let hideLoading = null;
      try {
        hideLoading = this.$message.loading('正在生成统计报告，请稍候...', 0);

        // 根据当前选择的时间范围导出
        const condition: string = this.activeTimeRange;
        const result = await this.$roadLawyerService.exportStatisticExcel({
          condition
        });

        if (hideLoading) {
          hideLoading();
        }

        if (result) {
          if (
            downloadFileWithMessage(result, {
              fileName: '法规统计报告.xlsx',
              showMessage: true,
              messageService: this.$message
            })
          ) {
            // 下载成功，消息已在 downloadFileWithMessage 中处理
          } else {
            this.$message.error('导出失败，请重试');
          }
        } else {
          this.$message.error('导出失败，请重试');
        }
      } catch (error) {
        if (hideLoading) {
          hideLoading();
        }
        console.error('导出统计报告失败:', error);
        this.$message.error('导出失败，请重试');
      }
    }
    async exportUpdateDetail(): Promise<void> {
      let hideLoading = null;
      try {
        hideLoading = this.$message.loading('正在导出智库更新明细，请稍候...', 0);

        const condition: string = this.activeTimeRange;
        const result = await this.$roadLawyerService.getUpdateCountExport({
          condition
        });

        if (hideLoading) {
          hideLoading();
        }

        if (
          result &&
          downloadFileWithMessage(result, {
            fileName: '智库更新明细.xlsx',
            showMessage: true,
            messageService: this.$message
          })
        ) {
          return;
        }

        this.$message.error('导出失败，请重试');
      } catch (error) {
        if (hideLoading) {
          hideLoading();
        }
        console.error('导出智库更新明细失败:', error);
        this.$message.error('导出失败，请重试');
      }
    }
  }
  export default IndexComponent;
</script>

<style lang="less">
  @import '~/assets/styles/lawyer.less';

  .index-page-wrapper {
    .lawyer-page-container {
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
