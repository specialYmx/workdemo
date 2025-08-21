<template>
  <a-card class="lawyer-chart-card" :bordered="false" title="法规更新来源分布">
    <div class="lawyer-pie-chart-layout">
      <div class="lawyer-pie-chart-container">
        <!-- 暂无数据状态 -->
        <div v-if="!loading && isAllDataEmpty" class="lawyer-empty-state">
          <a-empty description="暂无数据" />
        </div>

        <lawyer-common-chart-component
          v-else
          :options="pieChartOptions"
          :loading="loading"
          :auto-resize="true"
        />
      </div>
      <div class="lawyer-pie-legend-container">
        <div
          v-for="(item, index) in legendItems"
          :key="index"
          class="lawyer-pie-legend-item"
          :class="{ 'lawyer-legend-empty': item.value === 0 }"
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
</template>

<script lang="ts">
import { Component, Vue, Prop } from "nuxt-property-decorator";

import {
  ChartData,
  LegendItem,
  PieChartOptions,
  PieChartDataItem,
} from "~/model/LawyerModel";

@Component({ name: "source-distribution" })
export default class SourceDistribution extends Vue {
  @Prop({ type: Object, default: () => ({}) }) chartData!: ChartData;
  @Prop({ type: Array, default: () => [] }) legendItems!: LegendItem[];
  @Prop({ type: Boolean, default: false }) loading!: boolean;

  // 饼图颜色配置
  private static readonly PIE_CHART_COLORS: string[] = [
    "#1890ff",
    "#13c2c2",
    "#52c41a",
    "#faad14",
    "#722ed1",
    "#eb2f96",
    "#fadb14",
  ];

  // 静态tooltip格式化函数
  private static tooltipFormatter(params): string {
    return `${params.name}: ${Math.round(params.percent)}%`;
  }

  // 静态label格式化函数
  private static labelFormatter(params): string {
    return `${params.name} | ${Math.round(params.percent)}%`;
  }

  // 静态饼图基础配置
  private static readonly BASE_PIE_OPTIONS: Omit<
    PieChartOptions,
    "color" | "series"
  > = {
    tooltip: {
      trigger: "item",
      formatter: SourceDistribution.tooltipFormatter,
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
  };

  // 静态series基础配置
  private static readonly BASE_SERIES_CONFIG = {
    name: "法规更新来源分布",
    type: "pie",
    radius: ["55%", "75%"],
    center: ["50%", "50%"],
    avoidLabelOverlap: false,
    label: {
      show: true,
      position: "outside",
      formatter: SourceDistribution.labelFormatter,
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
  };

  // 判断是否所有数据都为空
  get isAllDataEmpty(): boolean {
    const data: PieChartDataItem[] = this.chartData?.series?.[0]?.data || [];
    return (
      data.length === 0 ||
      data.every((item: PieChartDataItem): boolean => item.value === 0)
    );
  }

  // 优化后的饼图配置 - 只合并动态部分
  get pieChartOptions(): PieChartOptions {
    return {
      ...SourceDistribution.BASE_PIE_OPTIONS,
      color: SourceDistribution.PIE_CHART_COLORS,
      series: [
        {
          ...SourceDistribution.BASE_SERIES_CONFIG,
          data: this.chartData?.series?.[0]?.data || [],
        },
      ],
    };
  }
}
</script>

<style lang="less">
@import "~/assets/styles/lawyer.less";

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

      .legend-name {
        font-size: 14px;
        color: #333;
      }

      // 0值项目的样式
      &.lawyer-legend-empty {
        .legend-name {
          color: #999;
        }

        .legend-color {
          opacity: 0.3;
        }
      }
    }
  }

  /* 空状态样式 */
  .lawyer-empty-state {
    padding: 40px 20px;
    text-align: center;
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
