<template>
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
          @click="handleTimeRangeChange(timeOption.value)"
        >
          {{ timeOption.label }}
        </a-button>
      </div>
      <a-button type="primary" icon="file-pdf" @click="$emit('export-report')">
        导出报告
      </a-button>
    </div>

    <div class="lawyer-dashboard-top-row">
      <!-- 左侧统计和图表 -->
      <div class="lawyer-dashboard-left-panel">
        <!-- 统计卡片 -->
        <div class="lawyer-top-stat-cards-container">
          <div class="lawyer-stat-card lawyer-card">
            <div class="lawyer-stat-info">
              <div class="lawyer-stat-label">本月法规更新</div>
              <div class="lawyer-stat-value blue">
                {{ monthlyUpdateCount }}
              </div>
            </div>
            <div class="lawyer-stat-icon bg-blue">
              <a-icon type="file-text" />
            </div>
          </div>
          <div class="lawyer-stat-card lawyer-card">
            <div class="lawyer-stat-info">
              <div class="lawyer-stat-label">待人工审核</div>
              <div class="lawyer-stat-value orange">
                {{ pendingReviewCount }}
              </div>
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
              <a-button type="primary" @click="$emit('view-reviews')">
                查看历史记录
              </a-button>
            </div>
          </div>

          <a-spin :spinning="recentReviewsLoading">
            <div>
              <div
                class="lawyer-review-item"
                v-for="(item, index) in recentReviews"
                :key="index"
              >
                <div
                  class="lawyer-review-icon"
                  :class="getCompletedReviewStatusClass(item.checkStatus)"
                >
                  <a-icon
                    :type="getCompletedReviewIconType(item.checkStatus)"
                  />
                </div>
                <div class="lawyer-review-content">
                  <div class="lawyer-review-title">{{ item.ruleName }}</div>
                  <div class="lawyer-review-subtitle">
                    <span>完成日期: {{ item.checkTime }}</span>
                    <a-divider type="vertical" />
                    <span>状态：</span>
                    <span
                      :class="getCompletedReviewStatusClass(item.checkStatus)"
                      >{{ item.checkStatus }}</span
                    >
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
              :value="trendChartPeriod"
              size="small"
              @change="handleTrendPeriodChange"
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
            :loading="trendChartLoading"
            :auto-resize="true"
          />
        </div>
      </div>
    </div>
  </a-card>
</template>

<script lang="ts">
// @ts-nocheck
import { Component, Vue, Prop } from "nuxt-property-decorator";
import ChartComponent from "@/components/common/ChartComponent.vue";

@Component({
  components: {
    ChartComponent,
  },
})
export default class DashboardOverview extends Vue {
  @Prop({ type: Number, default: 0 }) monthlyUpdateCount!: number;
  @Prop({ type: Number, default: 0 }) pendingReviewCount!: number;
  @Prop({ type: Array, default: () => [] }) recentReviews!: any[];
  @Prop({ type: Boolean, default: false }) recentReviewsLoading!: boolean;
  @Prop({ type: Object, default: () => ({}) }) trendChartData!: any;
  @Prop({ type: Boolean, default: false }) trendChartLoading!: boolean;
  @Prop({ type: String, default: "month" }) activeTimeRange!: string;
  @Prop({ type: String, default: "month" }) trendChartPeriod!: string;

  // 时间选项
  timeOptions = [
    { label: "本月", value: "month" },
    { label: "本季", value: "quarter" },
    { label: "本年", value: "year" },
  ];

  // 处理时间范围变更
  handleTimeRangeChange(value) {
    this.$emit("time-range-change", value);
  }

  // 处理趋势图周期变更
  handleTrendPeriodChange(value) {
    this.$emit("trend-period-change", value);
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
        data: this.trendChartData.xAxis?.data || [],
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
          data: this.trendChartData.series?.[0]?.data || [],
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
          data: this.trendChartData.series?.[1]?.data || [],
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
          data: this.trendChartData.series?.[2]?.data || [],
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

  // 获取已完成审核状态样式类
  getCompletedReviewStatusClass(status) {
    const classMap = {
      已通过: "lawyer-status-approved",
      已驳回: "lawyer-status-rejected",
    };
    return classMap[status] || "lawyer-status-pending";
  }

  // 获取已完成审核图标类型
  getCompletedReviewIconType(status) {
    const iconMap = {
      已通过: "file-done",
      已驳回: "file-exclamation",
    };
    return iconMap[status] || "file-sync";
  }
}
</script>

<style lang="less">
.lawyer-dashboard-card {
  margin-bottom: 24px;

  .lawyer-page-header-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 24px 16px;

    .lawyer-time-range {
      display: flex;
      gap: 0;
      width: 50%;

      .lawyer-time-btn {
        padding: 4px 20px;
        background: transparent;
        border: 1px solid var(--lawyer-border);
        transition: all 0.2s ease;
        color: var(--lawyer-text-light);
        text-align: center;
        flex: 1;

        &:first-child {
          border-radius: 4px 0 0 4px;
        }

        &:last-child {
          border-radius: 0 4px 4px 0;
        }

        &:not(:first-child) {
          margin-left: -1px;
        }

        &:hover {
          color: var(--lawyer-primary);
          border-color: var(--lawyer-primary);
          z-index: 1;
        }

        &.active {
          color: var(--lawyer-primary);
          border-color: var(--lawyer-primary);
          background: rgba(var(--lawyer-primary-rgb), 0.1);
          z-index: 1;
        }
      }
    }
  }

  .lawyer-dashboard-top-row {
    display: flex;
    gap: 24px;
    padding: 0 24px 24px;
    align-items: stretch;

    .lawyer-dashboard-left-panel {
      width: 50%;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .lawyer-trend-chart {
      flex: 1;
      background: var(--lawyer-surface);
      border: 1px solid var(--lawyer-border);
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      overflow: hidden;
    }

    .lawyer-top-stat-cards-container {
      display: flex;
      gap: 16px;

      .lawyer-stat-card {
        flex: 1;
        display: flex;
        justify-content: space-between;
        align-items: center;

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
      background: var(--lawyer-surface);
      border: 1px solid var(--lawyer-border);
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      overflow: hidden;
    }
  }
}

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

.lawyer-review-item {
  display: flex;
  align-items: center;
  padding: 12px 24px;
  border-bottom: 1px solid var(--lawyer-border);

  .lawyer-review-icon {
    margin-right: 16px;
    font-size: 24px;

    &.lawyer-status-approved {
      color: var(--lawyer-success);
    }
    &.lawyer-status-rejected {
      color: var(--lawyer-danger);
    }
    &.lawyer-status-pending {
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
</style>
