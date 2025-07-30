<template>
  <div class="index-page-wrapper">
    <div class="lawyer-page-container">
      <!-- 顶部仪表盘 -->
      <a-card
        class="lawyer-dashboard-card lawyer-chart-card"
        title="首页概览仪表盘"
        :bordered="false"
      >
        <div class="lawyer-page-header-actions">
          <div class="lawyer-time-range">
            <a-button
              v-for="(timeOption, index) in timeOptions"
              :key="index"
              :class="[
                'lawyer-time-btn',
                { active: activeTimeRange === timeOption.value },
              ]"
              @click="activeTimeRange = timeOption.value"
            >
              {{ timeOption.label }}
            </a-button>
          </div>
          <a-button type="primary" icon="file-pdf"> 导出报告 </a-button>
        </div>

        <div class="lawyer-dashboard-top-row">
          <!-- 左侧统计和图表 -->
          <div class="lawyer-dashboard-left-panel">
            <!-- 统计卡片 -->
            <div class="lawyer-top-stat-cards-container">
              <div class="lawyer-stat-card">
                <div class="lawyer-stat-info">
                  <div class="lawyer-stat-label">本月法规更新</div>
                  <div class="lawyer-stat-value blue">1352</div>
                </div>
                <div class="lawyer-stat-icon bg-blue">
                  <a-icon type="file-text" />
                </div>
              </div>
              <div class="lawyer-stat-card">
                <div class="lawyer-stat-info">
                  <div class="lawyer-stat-label">待人工审核</div>
                  <div class="lawyer-stat-value orange">231</div>
                </div>
                <div class="lawyer-stat-icon bg-orange">
                  <a-icon type="audit" />
                </div>
              </div>
            </div>

            <!-- 最近完成审核列表 -->
            <div class="lawyer-chart-section">
              <div class="lawyer-chart-header">
                <h3 class="lawyer-chart-title">近期完成审核</h3>
                <div class="lawyer-chart-actions">
                  <a-button type="primary" @click="goToReviewPage">
                    查看历史记录
                  </a-button>
                </div>
              </div>

              <a-spin :spinning="listLoading.recentReviews">
                <div>
                  <div
                    class="lawyer-review-item"
                    v-for="(item, index) in recentReviews"
                    :key="index"
                  >
                    <div
                      class="lawyer-review-icon"
                      :class="getReviewStatusClass(item.status)"
                    >
                      <a-icon :type="getReviewIconType(item.status)" />
                    </div>
                    <div class="lawyer-review-content">
                      <div class="lawyer-review-title">{{ item.title }}</div>
                      <div class="lawyer-review-subtitle">
                        <span>完成日期: {{ item.date }}</span>
                        <a-divider type="vertical" />
                        <span>状态：</span>
                        <span :class="getReviewStatusClass(item.status)">{{
                          getReviewStatusText(item.status)
                        }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </a-spin>
            </div>
          </div>

          <!-- 右侧趋势图 -->
          <div class="lawyer-trend-chart">
            <div class="lawyer-chart-header">
              <h3 class="lawyer-chart-title">法规更新趋势</h3>
              <div style="width: 100px">
                <a-select
                  v-model="trendChartPeriod"
                  size="small"
                  @change="onTrendChartPeriodChange"
                >
                  <a-select-option value="month">月度</a-select-option>
                  <a-select-option value="quarter">季度</a-select-option>
                  <a-select-option value="year">全年</a-select-option>
                </a-select>
              </div>
            </div>
            <div class="lawyer-chart-legend">
              <div class="legend-item">
                <span class="legend-color new"></span>
                <span>新发布</span>
              </div>
              <div class="legend-item">
                <span class="legend-color updated"></span>
                <span>修订</span>
              </div>
              <div class="legend-item">
                <span class="legend-color deprecated"></span>
                <span>废止</span>
              </div>
            </div>
            <div class="lawyer-chart-container">
              <chart-component
                :options="trendChartOptions"
                :loading="chartLoading.trend"
                :auto-resize="true"
              />
            </div>
          </div>
        </div>
      </a-card>

      <!-- Top 5 需要人工审核 -->
      <a-card
        class="lawyer-chart-card"
        :bordered="false"
        style="margin-bottom: 24px"
        title="Top 5 需要人工审核"
      >
        <template slot="extra">
          <a-button type="primary" @click="goToReviewPage"> 查看全部 </a-button>
        </template>

        <a-spin :spinning="listLoading.topReviews">
          <a-table
            :columns="reviewColumns"
            :dataSource="topReviews"
            :pagination="false"
            size="middle"
            class="lawyer-review-table"
          >
            <template slot="titleColumn" slot-scope="text, record">
              <div class="lawyer-table-title">{{ record.title }}</div>
              <div class="lawyer-table-subtitle">
                文号：{{ record.docNumber }}
              </div>
            </template>

            <template slot="category" slot-scope="text">
              {{ text }}
            </template>

            <template slot="status" slot-scope="text">
              <span :class="getReviewStatusClass(text)">
                {{ getReviewStatusText(text) }}
              </span>
            </template>

            <template slot="action" slot-scope="text, record">
              <div class="lawyer-table-actions">
                <a-button
                  type="link"
                  size="small"
                  @click="() => viewReviewDetail(record)"
                >
                  查看
                </a-button>
                <template v-if="record.status === 'pending'">
                  <a-button
                    v-for="(action, index) in getRecordActions(record)"
                    :key="index"
                    :type="'link'"
                    :class="action.class"
                    size="small"
                    @click="() => action.handler(record)"
                  >
                    {{ action.text }}
                  </a-button>
                </template>
              </div>
            </template>
          </a-table>
        </a-spin>
      </a-card>

      <!-- 环形图和来源分布 -->
      <div class="lawyer-two-column-chart-grid">
        <!-- 法规更新来源分布 -->
        <a-card
          class="lawyer-chart-card"
          :bordered="false"
          title="法规更新来源分布"
        >
          <div class="lawyer-pie-chart-layout">
            <div class="lawyer-pie-chart-container">
              <chart-component
                :options="pieCharts[0].options"
                :loading="chartLoading.sources"
                :auto-resize="true"
              />
            </div>
            <div class="lawyer-pie-legend-container">
              <div
                v-for="(item, index) in sourceLegendItems"
                :key="index"
                class="lawyer-pie-legend-item"
              >
                <span
                  class="legend-color"
                  :style="{ backgroundColor: item.color }"
                ></span>
                <span class="legend-name">{{ item.name }}</span>
              </div>
            </div>
          </div>
        </a-card>
      </div>

      <!-- 最新法规更新卡片 -->
      <a-card
        class="lawyer-chart-card"
        :bordered="false"
        style="margin-top: 24px"
        title="最新法规更新"
      >
        <template slot="extra">
          <a-button type="primary" @click="goToUpdatesPage">
            查看全部
          </a-button>
        </template>

        <a-spin :spinning="listLoading.latestUpdates">
          <div class="lawyer-updates-list">
            <div
              v-for="(item, index) in latestUpdates"
              :key="index"
              class="lawyer-update-item"
            >
              <div class="lawyer-update-icon">
                {{ getUpdateEmoji(item.status || item.icon) }}
              </div>
              <div class="lawyer-update-content">
                <div class="lawyer-update-header">
                  <h3 class="lawyer-update-title">
                    <a @click="viewUpdateDetail(item)">{{ item.title }}</a>
                  </h3>
                  <span class="lawyer-update-time">{{ item.date }}</span>
                </div>
                <p class="lawyer-update-description">
                  {{ item.description }}
                </p>
                <div class="lawyer-update-ai-analysis" v-if="item.analysis">
                  <h4 class="lawyer-ai-title">AI智能解读主要变更点：</h4>
                  <ul class="lawyer-ai-points">
                    <li v-for="(point, i) in item.analysis" :key="i">
                      <span class="lawyer-ai-bullet">▹</span>
                      {{ point }}
                    </li>
                  </ul>
                </div>
                <div class="lawyer-update-footer">
                  <div class="lawyer-update-tags">
                    <span
                      :class="['lawyer-tag', getTagClass(tag)]"
                      v-for="(tag, i) in item.tags || []"
                      :key="i"
                    >
                      {{ tag }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </a-spin>
      </a-card>
    </div>
  </div>
</template>

<script lang="ts">
// @ts-nocheck
import { Component, Vue } from "nuxt-property-decorator";
import ChartComponent from "@/components/common/ChartComponent.vue";

@Component({
  components: {
    ChartComponent,
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

  // 时间选项
  timeOptions = [
    { label: "本月", value: "month" },
    { label: "本季", value: "quarter" },
    { label: "本年", value: "year" },
  ];

  // 当前选中的时间范围
  activeTimeRange = "month";

  // 图表周期
  trendChartPeriod = "month";

  // 列表数据
  recentReviews = [];
  topReviews = [];
  latestUpdates = [];

  // 来源图例数据
  sourceLegendItems = [
    { name: "国家金融监督管理总局", value: 30, color: "#1890ff" },
    { name: "人民银行网站", value: 20, color: "#13c2c2" },
    { name: "证监会公告", value: 15, color: "#52c41a" },
    { name: "财政部通知", value: 12, color: "#faad14" },
    { name: "交易所规则", value: 10, color: "#722ed1" },
    { name: "行业协会", value: 8, color: "#eb2f96" },
    { name: "其他机构", value: 5, color: "#fadb14" },
  ];

  // 表格列定义
  reviewColumns = [
    {
      title: "标题/文号",
      dataIndex: "title",
      key: "title",
      scopedSlots: { customRender: "titleColumn" },
      width: "30%",
    },
    {
      title: "分类",
      dataIndex: "category",
      key: "category",
      scopedSlots: { customRender: "category" },
      width: "15%",
    },
    {
      title: "来源",
      dataIndex: "source",
      key: "source",
      width: "15%",
    },
    {
      title: "提交时间",
      dataIndex: "date",
      key: "date",
      width: "15%",
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      scopedSlots: { customRender: "status" },
      width: "10%",
    },
    {
      title: "操作",
      key: "action",
      scopedSlots: { customRender: "action" },
      width: "15%",
      align: "center",
    },
  ];

  // 生命周期钩子
  async mounted() {
    // 加载所有数据
    try {
      await Promise.all([
        // 加载图表数据
        this.loadTrendChartData(),
        this.loadSourcesChartData(),
        // 加载列表数据
        this.loadRecentReviews(),
        this.loadTopReviews(),
        this.loadLatestUpdates(),
      ]);
    } catch (error) {
      console.error("加载数据失败:", error);
    }
  }

  // 加载趋势图数据
  async loadTrendChartData() {
    this.chartLoading.trend = true;
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 模拟网络延迟

      // 只更新数据部分，保持配置部分不变
      const xAxisData = ["1日", "2日", "3日", "4日", "5日", "6日", "7日"];

      // 根据周期设置不同的数据
      let seriesData = [
        [3, 5, 2, 6, 5, 7, 4], // 新发布
        [3, 3, 5, 4, 4, 3, 3], // 修订
        [0, 2, 2, 1, 0, 2, 0], // 废止
      ];

      // 根据周期调整数据
      if (this.trendChartPeriod === "quarter") {
        seriesData = [
          [5, 7, 3, 8, 6, 9, 5],
          [4, 5, 6, 5, 6, 4, 5],
          [1, 2, 3, 1, 1, 2, 1],
        ];
      } else if (this.trendChartPeriod === "year") {
        seriesData = [
          [8, 10, 6, 12, 9, 15, 7],
          [7, 8, 9, 8, 9, 7, 8],
          [2, 3, 4, 2, 2, 3, 1],
        ];
      }

      this.chartData.trend = {
        xAxis: { data: xAxisData },
        series: seriesData.map((data) => ({ data })),
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
      await new Promise((resolve) => setTimeout(resolve, duration)); // 模拟网络延迟

      // 返回对应数据
      const pieData = [
        { value: 30, name: "国家金融监督管理总局" },
        { value: 20, name: "人民银行网站" },
        { value: 15, name: "证监会公告" },
        { value: 12, name: "财政部通知" },
        { value: 10, name: "交易所规则" },
        { value: 8, name: "行业协会" },
        { value: 5, name: "其他机构" },
      ];

      this.chartData[loadingKey] = {
        series: [{ data: pieData }],
      };
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
  loadRecentReviews() {
    const mockData = [
      {
        title: "新版数据跨境传输安全管理办法解读",
        date: "2024-01-18",
        status: "approved",
      },
      {
        title: "关于调整部分理财产品风险等级的建议",
        date: "2024-01-18",
        status: "rejected",
      },
      {
        title: "内部审计发现问题整改跟踪报告",
        date: "2024-01-18",
        status: "approved",
      },
    ];
    return this.loadListData("recentReviews", mockData, 800);
  }

  // 加载需要人工审核的数据
  loadTopReviews() {
    const mockData = [
      {
        key: "1",
        title: "关于保险资金投资股权的合规审查报告",
        docNumber: "合规审[2024]001号",
        date: "2025-07-01 15:10:35",
        category: "综合类",
        source: "人民银行网站",
        status: "pending",
      },
      {
        key: "2",
        title: "偿付能力充足率计算方法修订草案",
        docNumber: "合规审[2024]001号",
        date: "2025-07-01 15:10:35",
        category: "机构监管",
        source: "证监会公告",
        status: "pending",
      },
      {
        key: "3",
        title: "信息披露管理办法执行情况检查",
        docNumber: "合规审[2024]001号",
        date: "2025-07-01 15:10:35",
        category: "公司治理",
        source: "财政部通知",
        status: "pending",
      },
      {
        key: "4",
        title: "反洗钱工作年度总结及改进计划",
        docNumber: "合规审[2024]001号",
        date: "2025-07-01 15:10:35",
        category: "风控合规",
        source: "交易所规则",
        status: "pending",
      },
      {
        key: "5",
        title: "数据安全管理制度完善建议书",
        docNumber: "合规审[2024]001号",
        date: "2025-07-01 15:10:35",
        category: "运营与信息统计",
        source: "行业协会",
        status: "pending",
      },
    ];
    return this.loadListData("topReviews", mockData, 1200);
  }

  // 加载最新法规更新数据
  loadLatestUpdates() {
    const mockData = [
      {
        id: "1",
        title: "关于进一步规范保险资金股权投资有关事项的通知",
        description:
          "为进一步规范保险资金股权投资行为，防范投资风险，保护被保险人利益，现就有关事项通知如下：一是明确投资决策程序，二是加强风险管控措施，三是强化信息披露要求...",
        date: "2024-01-15 14:30",
        status: "new",
        tags: ["机构监管", "公司治理", "行业协会"],
        icon: "file-text",
        analysis: [
          "投资决策程序优化: 强调董事会在重大股权投资中的核心决策地位",
          "风险管控体系强化: 新增对股权投资集中度风险的量化指标",
          "信息披露标准提升: 扩大了信息披露范围，增强透明度",
        ],
      },
      {
        id: "2",
        title: "偿付能力监管规则修订征求意见稿发布",
        description:
          "为完善偿付能力监管制度，提高监管有效性，金融监管总局发布偿付能力监管规则修订征求意见稿，主要修订内容包括：风险因子调整、资本要求优化、监管指标完善等...",
        date: "2024-01-15 14:30",
        status: "updated",
        tags: ["风控合规", "关联交易", "其他机构"],
        icon: "file-protect",
        analysis: [
          "投资决策程序优化: 强调董事会在重大股权投资中的核心决策地位",
          "风险管控体系强化: 新增对股权投资集中度风险的量化指标",
          "信息披露标准提升: 扩大了信息披露范围，增强透明度",
        ],
      },
      {
        id: "3",
        title: "关联交易管理制度修订及执行指引",
        description:
          "根据最新监管要求，公司修订关联交易管理制度，制定详细执行指引。修订要点：扩大关联方认定范围、完善审批流程、加强持续监管、明确责任追究机制...",
        date: "2024-01-15 14:30",
        status: "effective",
        tags: ["偿付能力", "征求意见"],
        icon: "solution",
        analysis: [
          "投资决策程序优化: 强调董事会在重大股权投资中的核心决策地位",
          "风险管控体系强化: 新增对股权投资集中度风险的量化指标",
          "信息披露标准提升: 扩大了信息披露范围，增强透明度",
        ],
      },
    ];
    return this.loadListData("latestUpdates", mockData, 1500);
  }

  // 趋势图配置
  get trendChartOptions() {
    const colors = ["#ffb74d", "#4caf50", "#f44336"];
    return {
      grid: {
        top: "15%",
        left: "3%",
        right: "4%",
        bottom: "10%",
        containLabel: true,
      },
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "line",
        },
      },
      xAxis: {
        type: "category",
        data: this.chartData.trend.xAxis?.data || [],
        axisTick: {
          alignWithLabel: true,
        },
        axisLine: {
          lineStyle: {
            color: "#f0f0f0",
          },
        },
        axisLabel: {
          color: "#666",
        },
      },
      yAxis: {
        type: "value",
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        splitLine: {
          lineStyle: {
            color: "#f0f0f0",
          },
        },
        axisLabel: {
          color: "#666",
        },
      },
      series: [
        {
          name: "新发布",
          type: "line",
          smooth: true,
          data: this.chartData.trend.series?.[0]?.data || [],
          itemStyle: {
            color: colors[0],
          },
          lineStyle: {
            width: 3,
            color: colors[0],
          },
          symbol: "circle",
          symbolSize: 8,
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color: "rgba(255, 183, 77, 0.6)",
                },
                {
                  offset: 1,
                  color: "rgba(255, 183, 77, 0.1)",
                },
              ],
            },
          },
        },
        {
          name: "修订",
          type: "line",
          smooth: true,
          data: this.chartData.trend.series?.[1]?.data || [],
          itemStyle: {
            color: colors[1],
          },
          lineStyle: {
            width: 3,
            color: colors[1],
          },
          symbol: "circle",
          symbolSize: 8,
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color: "rgba(76, 175, 80, 0.6)",
                },
                {
                  offset: 1,
                  color: "rgba(76, 175, 80, 0.1)",
                },
              ],
            },
          },
        },
        {
          name: "废止",
          type: "line",
          smooth: true,
          data: this.chartData.trend.series?.[2]?.data || [],
          itemStyle: {
            color: colors[2],
          },
          lineStyle: {
            width: 3,
            color: colors[2],
          },
          symbol: "circle",
          symbolSize: 8,
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color: "rgba(244, 67, 54, 0.6)",
                },
                {
                  offset: 1,
                  color: "rgba(244, 67, 54, 0.1)",
                },
              ],
            },
          },
        },
      ],
    };
  }

  // 饼图配置
  get pieCharts() {
    return [
      {
        title: "法规更新来源分布",
        options: this.getPieChartOption(0),
      },
    ];
  }

  // 获取饼图配置
  getPieChartOption(type) {
    const colors = [
      "#1890ff",
      "#13c2c2",
      "#52c41a",
      "#faad14",
      "#722ed1",
      "#eb2f96",
      "#fadb14",
    ];

    const chartKey = "sources";

    return {
      color: colors,
      tooltip: {
        trigger: "item",
        formatter: function (params) {
          return `${params.name}: ${params.percent}%`;
        },
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        borderColor: "transparent",
        textStyle: {
          color: "#fff",
          fontSize: 12,
        },
        extraCssText:
          "border-radius: 4px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);",
      },
      legend: {
        show: false,
      },
      series: [
        {
          name: "法规更新来源分布",
          type: "pie",
          radius: ["55%", "75%"],
          center: ["50%", "50%"],
          avoidLabelOverlap: false,
          label: {
            show: true,
            position: "outside",
            formatter: function (params) {
              return `${params.name} | ${params.percent}%`;
            },
            fontSize: 12,
            color: "#333",
            lineHeight: 16,
          },
          emphasis: {
            label: {
              show: true,
              fontSize: "14",
              fontWeight: "bold",
              color: "#333",
            },
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.5)",
            },
          },
          labelLine: {
            show: true,
            length: 15,
            length2: 10,
            lineStyle: {
              color: "#999",
              width: 1,
            },
          },
          data: this.chartData[chartKey]?.series?.[0]?.data || [],
        },
      ],
    };
  }

  // 处理图表周期变更
  onTrendChartPeriodChange() {
    this.loadTrendChartData();
  }

  // 获取图标类型
  getReviewIconType(status) {
    const iconMap = {
      approved: "file-done",
      rejected: "file-exclamation",
      pending: "file-sync",
    };
    return iconMap[status] || "file";
  }

  // 获取状态样式类
  getReviewStatusClass(status) {
    const classMap = {
      approved: "status-approved",
      rejected: "status-rejected",
      pending: "status-pending",
    };
    return classMap[status] || "";
  }

  // 获取图标类型
  getUpdateIconType(type) {
    const iconMap = {
      new: "file-add",
      updated: "edit",
      effective: "check-circle",
      deprecated: "delete",
      car: "car",
      bank: "bank",
      "safety-certificate": "safety-certificate",
    };
    return iconMap[type] || "file-text";
  }

  // 获取审核状态文本
  getReviewStatusText(status) {
    const textMap = {
      approved: "已批准",
      rejected: "已驳回",
      pending: "待审核",
    };
    return textMap[status] || status;
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
    this.$message.info(`查看详情: ${record.title}`);
  }

  approveReview(record) {
    this.$message.success(`已批准: ${record.title}`);
  }

  rejectReview(record) {
    this.$message.error(`已驳回: ${record.title}`);
  }

  removeReview(record) {
    this.$message.warning(`已移除: ${record.title}`);
  }

  // 查看法规更新详情
  viewUpdateDetail(item) {
    this.$router.push({
      path: "/document",
      query: { id: item.id },
    });
  }

  // 获取更新emoji
  getUpdateEmoji(status) {
    const emojiMap = {
      new: "⚖️",
      updated: "📋",
      effective: "📋",
      deprecated: "⚠️",
    };
    return emojiMap[status] || "📋";
  }

  // 获取标签样式类
  getTagClass(tag) {
    const tagColorMap = {
      重要法规: "lawyer-tag-important",
      资金运用: "lawyer-tag-fund",
      征求意见: "lawyer-tag-opinion",
      偿付能力: "lawyer-tag-solvency",
      风险提示: "lawyer-tag-risk",
      另类投资: "lawyer-tag-alternative",
      机构监管: "lawyer-tag-supervision",
      公司治理: "lawyer-tag-governance",
      行业协会: "lawyer-tag-association",
      风控合规: "lawyer-tag-compliance",
      关联交易: "lawyer-tag-related",
      其他机构: "lawyer-tag-other",
      法律法规: "lawyer-tag-law",
      监管政策: "lawyer-tag-policy",
      内部指南: "lawyer-tag-guide",
      综合类: "lawyer-tag-general",
    };
    return tagColorMap[tag] || "lawyer-tag-default";
  }

  // 获取记录的操作按钮
  getRecordActions(record) {
    const actions = [];
    if (record.status === "pending") {
      actions.push({
        text: "批准",
        class: "btn-approve",
        handler: this.approveReview,
      });
      actions.push({
        text: "驳回",
        class: "btn-reject",
        handler: this.rejectReview,
      });
      actions.push({
        text: "移除",
        class: "btn-remove",
        handler: this.removeReview,
      });
    }
    return actions;
  }
}
</script>

<style lang="less">
.index-page-wrapper {
  .status-approved {
    color: var(--lawyer-success);
  }
  .status-rejected {
    color: var(--lawyer-danger);
  }
  .status-pending {
    color: var(--lawyer-warning);
  }

  // 图表通用样式
  .lawyer-chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    border-bottom: 1px solid var(--lawyer-border);

    .lawyer-chart-title {
      font-weight: 500;
    }
  }

  .lawyer-chart-container {
    height: 300px;
    padding: 16px;
  }

  // 饼图布局
  .lawyer-pie-chart-layout {
    display: flex;
    align-items: center;
    padding: 16px 24px;
    min-height: 350px;

    .lawyer-pie-chart-container {
      flex: 1;
      height: 320px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .lawyer-pie-legend-container {
      width: 240px;
      padding-left: 32px;

      .lawyer-pie-legend-item {
        display: flex;
        align-items: center;
        margin-bottom: 16px;

        &:last-child {
          margin-bottom: 0;
        }

        .legend-color {
          width: 14px;
          height: 14px;
          margin-right: 12px;
          border-radius: 2px;
        }
      }
    }
  }

  .lawyer-page-container {
    padding: 20px;

    .lawyer-dashboard-card {
      margin-bottom: 24px;

      .lawyer-page-header-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 24px 16px;
      }

      .lawyer-dashboard-top-row {
        display: flex;
        gap: 24px;
        padding: 0 24px 24px;

        .lawyer-dashboard-left-panel {
          width: 40%;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .lawyer-trend-chart {
          flex: 1;
          padding-bottom: 16px;
        }

        .lawyer-top-stat-cards-container {
          display: flex;
          gap: 16px;

          .lawyer-stat-card {
            flex: 1;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;

            .lawyer-stat-info {
              .lawyer-stat-label {
                color: var(--lawyer-text-light);
                margin-bottom: 8px;
              }

              .lawyer-stat-value {
                font-size: 28px;
                font-weight: 600;

                &.blue {
                  color: #1890ff;
                }
                &.orange {
                  color: #fa8c16;
                }
              }
            }

            .lawyer-stat-icon {
              display: flex;
              justify-content: center;
              align-items: center;
              width: 56px;
              height: 56px;
              border-radius: 50%;

              i {
                font-size: 24px;
                color: white;
              }

              &.bg-blue {
                background-color: #1890ff;
              }
              &.bg-orange {
                background-color: #fa8c16;
              }
            }
          }
        }

        .lawyer-chart-section {
          padding-bottom: 16px;
        }
      }
    }

    .lawyer-chart-legend {
      display: flex;
      justify-content: center;
      gap: 24px;
      margin-top: 16px;
      padding: 0 24px;

      .legend-item {
        display: flex;
        align-items: center;

        .legend-color {
          width: 14px;
          height: 14px;
          margin-right: 8px;
          border-radius: 2px;

          &.new {
            background-color: #ffb74d;
          }
          &.updated {
            background-color: #4caf50;
          }
          &.deprecated {
            background-color: #f44336;
          }
        }
      }
    }

    .lawyer-two-column-chart-grid {
      display: flex;
      margin-bottom: 24px;

      .lawyer-chart-card {
        flex: 1;
      }
    }

    .lawyer-review-item {
      display: flex;
      align-items: center;
      padding: 12px 24px;
      border-bottom: 1px solid var(--lawyer-border);

      .lawyer-review-icon {
        margin-right: 16px;
        font-size: 24px;

        &.status-approved {
          color: var(--lawyer-success);
        }
        &.status-rejected {
          color: var(--lawyer-danger);
        }
        &.status-pending {
          color: var(--lawyer-warning);
        }
      }

      .lawyer-review-content {
        flex: 1;

        .lawyer-review-title {
          font-weight: 500;
          margin-bottom: 4px;
        }

        .lawyer-review-subtitle {
          font-size: 12px;
          color: var(--lawyer-text-light);
        }
      }

      &:last-child {
        border-bottom: none;
      }
    }

    .lawyer-table-actions {
      display: flex;
      justify-content: space-around;
      gap: 8px;
    }

    .lawyer-updates-list {
      .lawyer-update-item {
        display: flex;
        gap: 16px;
        margin-bottom: 10px;
        padding-bottom: 20px;
        border-bottom: 1px solid var(--lawyer-border);

        &:last-child {
          margin-bottom: 0;
          border-bottom: none;
        }

        .lawyer-update-icon {
          font-size: 24px;
          flex-shrink: 0;
        }

        .lawyer-update-content {
          flex: 1;

          .lawyer-update-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 12px;

            .lawyer-update-title {
              font-size: 18px;
              font-weight: 600;

              a {
                color: var(--lawyer-text);
                text-decoration: none;

                &:hover {
                  color: var(--lawyer-primary);
                }
              }
            }

            .lawyer-update-time {
              color: var(--lawyer-text-light);
              margin-left: 16px;
            }
          }

          .lawyer-update-description {
            margin-bottom: 16px;
            color: var(--lawyer-text-light);
            line-height: 1.6;
          }

          .lawyer-update-ai-analysis {
            background-color: #fffbf0;
            padding: 16px;
            margin-bottom: 16px;
            border-radius: 6px;

            .lawyer-ai-title {
              font-weight: 600;
              color: var(--lawyer-text);
              margin-bottom: 12px;
            }

            .lawyer-ai-points {
              list-style: none;

              li {
                margin-bottom: 8px;
                color: var(--lawyer-text-light);
                line-height: 1.5;
                display: flex;

                .lawyer-ai-bullet {
                  color: var(--lawyer-primary);
                  margin-right: 8px;
                  font-weight: bold;
                }

                &:last-child {
                  margin-bottom: 0;
                }
              }
            }
          }

          .lawyer-update-footer {
            margin-top: 16px;

            .lawyer-update-tags {
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
            }
          }
        }
      }
    }
  }

  // 简化的标签样式系统
  .lawyer-tag {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 3px;
    font-size: 12px;
    font-weight: 400;
    white-space: nowrap;
    transition: opacity 0.2s ease;

    // 基础样式变体 - 使用lawyer.less中的全局变量
    &.lawyer-tag-important,
    &.lawyer-tag-risk {
      border: 1px solid var(--lawyer-danger);
      color: var(--lawyer-danger);
      background-color: rgba(var(--lawyer-danger-rgb), 0.1);
    }

    &.lawyer-tag-fund,
    &.lawyer-tag-governance {
      border: 1px solid var(--lawyer-warning);
      color: var(--lawyer-warning);
      background-color: rgba(245, 158, 11, 0.1);
    }

    &.lawyer-tag-opinion,
    &.lawyer-tag-association,
    &.lawyer-tag-law {
      border: 1px solid var(--lawyer-primary);
      color: var(--lawyer-primary);
      background-color: rgba(var(--lawyer-primary-rgb), 0.1);
    }

    &.lawyer-tag-solvency,
    &.lawyer-tag-compliance,
    &.lawyer-tag-guide {
      border: 1px solid #722ed1;
      color: #722ed1;
      background-color: rgba(114, 46, 209, 0.1);
    }

    &.lawyer-tag-supervision,
    &.lawyer-tag-policy {
      border: 1px solid var(--lawyer-success);
      color: var(--lawyer-success);
      background-color: rgba(16, 185, 129, 0.1);
    }

    &.lawyer-tag-alternative,
    &.lawyer-tag-related,
    &.lawyer-tag-general {
      border: 1px solid #13c2c2;
      color: #13c2c2;
      background-color: rgba(19, 194, 194, 0.1);
    }

    &.lawyer-tag-other,
    &.lawyer-tag-default {
      border: 1px solid #8c8c8c;
      color: #8c8c8c;
      background-color: rgba(140, 140, 140, 0.1);
    }

    &:hover {
      opacity: 0.8;
    }
  }

  // 表格样式
  .lawyer-review-table {
    .lawyer-table-title {
      font-weight: 500;
      font-size: 14px;
      margin-bottom: 4px;
    }

    .lawyer-table-subtitle {
      font-size: 12px;
      color: var(--lawyer-text-light);
    }
  }

  .lawyer-table-actions {
    display: flex;
    justify-content: center;
    gap: 8px;

    .btn-approve {
      color: var(--lawyer-success);
      &:hover {
        color: #73d13d;
      }
    }

    .btn-reject {
      color: var(--lawyer-danger);
      &:hover {
        color: #ff4d4f;
      }
    }

    .btn-remove {
      color: var(--lawyer-text-light);
      &:hover {
        color: #999;
      }
    }
  }
}
</style>
