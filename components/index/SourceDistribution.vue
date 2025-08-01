<template>
  <a-card
    class="lawyer-chart-card"
    :bordered="false"
    title="法规更新来源分布"
  >
    <div class="lawyer-pie-chart-layout">
      <div class="lawyer-pie-chart-container">
        <chart-component
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
// @ts-nocheck
import { Component, Vue, Prop } from "nuxt-property-decorator";
import ChartComponent from "@/components/common/ChartComponent.vue";

@Component({
  components: {
    ChartComponent,
  },
})
export default class SourceDistribution extends Vue {
  @Prop({ type: Object, default: () => ({}) }) chartData!: any;
  @Prop({ type: Array, default: () => [] }) legendItems!: any[];
  @Prop({ type: Boolean, default: false }) loading!: boolean;

  // 饼图配置
  get pieChartOptions() {
    const colors = [
      "#1890ff",
      "#13c2c2",
      "#52c41a",
      "#faad14",
      "#722ed1",
      "#eb2f96",
      "#fadb14",
    ];

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
          data: this.chartData?.series?.[0]?.data || [],
        },
      ],
    };
  }
}
</script>

<style lang="less" scoped>
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
</style>
