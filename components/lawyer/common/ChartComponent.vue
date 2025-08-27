<template>
  <div class="chart-component-wrapper">
    <div
      ref="chartContainer"
      :style="containerStyle"
      class="chart-container"
    />
  </div>
</template>

<script>
import { debounce } from 'lodash'

export default {
  name: 'ChartComponent',
  props: {
    options: {
      type: Object,
      required: true
    },
    autoResize: {
      type: Boolean,
      default: true
    },
    theme: {
      type: [String, Object],
      default: null
    },
    width: {
      type: String,
      default: '100%'
    },
    height: {
      type: String,
      default: '100%'
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  data: () => ({
    chart: null,
    resizeObserver: null
  }),
  computed: {
    containerStyle() {
      return { width: this.width, height: this.height }
    }
  },
  watch: {
    options: {
      handler() {
        this.updateChart()
      },
      deep: true
    },
    loading(val) {
      if (!this.chart) { return }
      val ? this.showLoading() : this.chart.hideLoading()
    }
  },
  mounted() {
    this.initChart()

    // 自动调整大小
    if (this.autoResize) {
      const resizeHandler = debounce(() => {
        this.chart && this.chart.resize()
      }, 100)

      this.resizeObserver = new ResizeObserver(resizeHandler)
      if (this.$refs.chartContainer) {
        this.resizeObserver.observe(this.$refs.chartContainer)
      }
    }
  },
  beforeDestroy() {
    if (this.chart) {
      this.chart.dispose()
      this.chart = null
    }

    // 清理resize相关的监听
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }
  },
  methods: {
    initChart() {
      if (!this.$echarts) {
        console.error('ECharts is not available in Vue prototype')
        return
      }
      const container = this.$refs.chartContainer
      if (!container) { return }

      this.chart = this.$echarts.init(container, this.theme)

      // 设置初始loading状态
      if (this.loading) { this.showLoading() }

      this.updateChart()
    },
    updateChart() {
      if (
        !this.chart ||
        !this.options ||
        Object.keys(this.options).length === 0
      ) { return }
      try {
        this.chart.setOption(this.options, true)
      } catch (e) {
        console.error('Failed to set chart options:', e)
      }
    },
    showLoading() {
      this.chart.showLoading({
        text: '数据加载中...',
        maskColor: 'rgba(255, 255, 255, 0.8)',
        textColor: '#f59e0b'
      })
    }
  }
}
</script>

<style lang="less">
.chart-component-wrapper {
  width: 100%;
  height: 100%;

  .chart-container {
    width: 100%;
    height: 100%;
  }
}
</style>
