<template>
    <a-card class="lawyer-dashboard-card lawyer-chart-card" title="首页概览仪表盘" :bordered="false">
        <div class="lawyer-page-header-actions">
            <div class="lawyer-time-range">
                <a-button v-for="(timeOption, index) in timeOptions" :key="index" :class="[
                    'lawyer-time-btn',
                    { active: activeTimeRange === timeOption.value },
                ]" @click="handleTimeRangeChange(timeOption.value)">
                    {{ timeOption.label }}
                </a-button>
            </div>
            <a-button type="primary" icon="file-pdf" @click="exportReport()">
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
                            <div class="lawyer-stat-label">
                                本月法规更新
                            </div>
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
                            <div class="lawyer-stat-label">
                                待人工审核
                            </div>
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
                        <h3 class="lawyer-chart-title">
                            近期完成审核
                        </h3>
                        <div class="lawyer-chart-actions">
                            <a-button type="primary" @click="viewReviews()">
                                查看历史记录
                            </a-button>
                        </div>
                    </div>

                    <a-spin :spinning="recentReviewsLoading">
                        <div v-if="recentReviews.length" class="lawyer-review-list">
                            <div v-for="(item, index) in recentReviews" :key="index" class="lawyer-review-item">
                                <div class="lawyer-review-icon"
                                    :class="getCompletedReviewStatusClass(item.checkStatus)">
                                    <a-icon :type="getCompletedReviewIconType(item.checkStatus)" />
                                </div>
                                <div class="lawyer-review-content">
                                    <div class="lawyer-review-title">
                                        {{ item.ruleName }}
                                    </div>
                                    <div class="lawyer-review-subtitle">
                                        <span>完成日期: {{ formatTime(item.checkTime) }}</span>
                                        <a-divider type="vertical" />
                                        <span>状态：</span>
                                        <span :class="getCompletedReviewStatusClass(item.checkStatus)">{{
                                            item.checkStatus }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <a-empty v-else />
                    </a-spin>
                </div>
            </div>

            <!-- 右侧趋势图 -->
            <div class="lawyer-trend-chart">
                <div class="lawyer-chart-header">
                    <h3 class="lawyer-chart-title">
                        法规更新趋势
                    </h3>
                    <div class="lawyer-trend-selectors">
                        <a-select :value="trendChartPeriod" size="small" @change="handlePeriodTypeChange">
                            <a-select-option value="month">
                                月度
                            </a-select-option>
                            <a-select-option value="quarter">
                                季度
                            </a-select-option>
                            <a-select-option value="year">
                                年度
                            </a-select-option>
                        </a-select>
                        <div class="w-100 ml-8">
                            <a-select :value="trendChartValue" size="small" style="width: 80px"
                                @change="handlePeriodValueChange">
                                <a-select-option v-for="option in periodValueOptions" :key="option.value"
                                    :value="option.value">
                                    {{ option.label }}
                                </a-select-option>
                            </a-select>
                        </div>
                    </div>
                </div>
                <div class="lawyer-chart-legend">
                    <div class="legend-item">
                        <span class="legend-color new" />
                        <span>新发布</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-color updated" />
                        <span>修订</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-color deprecated" />
                        <span>废止</span>
                    </div>
                </div>
                <div class="lawyer-chart-container">
                    <lawyer-common-chart-component :options="trendChartOptions" :loading="trendChartLoading"
                        :auto-resize="true" />
                </div>
            </div>
        </div>
    </a-card>
</template>

<script lang="ts">
import { Component, Vue, Prop, Emit } from 'nuxt-property-decorator'
import { EChartOption } from 'echarts'
import moment from 'moment'
import {
    CompletedRuleItem,
    TimeOption,
    TrendChartData,
    ReviewStatusClassMap,
    IconTypeMap
} from '~/model/LawyerModel'

@Component({})
export default class DashboardOverview extends Vue {
    @Prop({ type: Number, default: 0 }) monthlyUpdateCount!: number;
    @Prop({ type: Number, default: 0 }) pendingReviewCount!: number;
    @Prop({ type: Array, default: () => [] }) recentReviews!: CompletedRuleItem[];
    @Prop({ type: Boolean, default: false }) recentReviewsLoading!: boolean;
    @Prop({ type: Object, default: () => ({}) }) trendChartData!: TrendChartData;
    @Prop({ type: Boolean, default: false }) trendChartLoading!: boolean;
    @Prop({ type: String, default: 'month' }) activeTimeRange!: string;
    @Prop({ type: String, default: 'month' }) trendChartPeriod!: string;
    @Prop({ type: [String, Number], default: null }) trendChartValue!:
        | string
        | number;

    // 时间选项
    timeOptions: TimeOption[] = [
        { label: '本月', value: 'month' },
        { label: '本季', value: 'quarter' },
        { label: '本年', value: 'year' }
    ];

    // 处理时间范围变更
    handleTimeRangeChange(value: string): void {
        this.$emit('time-range-change', value)
    }

    // 处理趋势图周期类型变更
    handlePeriodTypeChange(value: string): void {
        // 当周期类型改变时，重置为默认值
        const defaultValue = this.getDefaultValueForPeriod(value)
        this.$emit('trend-period-change', value, defaultValue)
    }

    // 处理趋势图周期值变更
    handlePeriodValueChange(value: string | number): void {
        this.$emit('trend-period-change', this.trendChartPeriod, value)
    }

    // 获取周期类型的默认值
    getDefaultValueForPeriod(period: string): number {
        const now = new Date()
        switch (period) {
            case 'month':
                return now.getMonth() + 1 // 当前月份
            case 'quarter':
                return Math.ceil((now.getMonth() + 1) / 3) // 当前季度
            case 'year':
                return now.getFullYear() // 当前年份
            default:
                return 1
        }
    }

    // 计算第二个选择器的选项
    get periodValueOptions(): Array<{ label: string; value: number }> {
        switch (this.trendChartPeriod) {
            case 'month':
                // 1-12月
                return Array.from({ length: 12 }, (_, i) => ({
                    label: `${i + 1}月`,
                    value: i + 1
                }))
            case 'quarter':
                // 1-4季度
                return Array.from({ length: 4 }, (_, i) => ({
                    label: `第${i + 1}季度`,
                    value: i + 1
                }))
            case 'year':
                // 近几年的年份选项
                const currentYear = new Date().getFullYear()
                return Array.from({ length: 11 }, (_, i) => {
                    const year = currentYear - 5 + i
                    return {
                        label: `${year}年`,
                        value: year
                    }
                })
            default:
                return []
        }
    }

    // 将十六进制颜色转换为RGB格式
    hexToRgb(hex: string): string {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
        if (!result) { return '0, 0, 0' }

        const r = parseInt(result[1], 16)
        const g = parseInt(result[2], 16)
        const b = parseInt(result[3], 16)

        return `${r}, ${g}, ${b}`
    }

    // 生成系列配置
    generateSeriesConfig(name: string, dataIndex: number, colorIndex: number) {
        const colors: string[] = ['#ffb74d', '#4caf50', '#f44336']
        const color = colors[colorIndex]

        return {
            name,
            type: 'line',
            smooth: true,
            data: this.trendChartData.series?.[dataIndex]?.data || [],
            itemStyle: {
                color
            },
            lineStyle: {
                width: 3,
                color
            },
            symbol: 'circle',
            symbolSize: 8,
            areaStyle: {
                color: {
                    type: 'linear',
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [
                        {
                            offset: 0,
                            color: `rgba(${this.hexToRgb(color)}, 0.6)`
                        },
                        {
                            offset: 1,
                            color: `rgba(${this.hexToRgb(color)}, 0.1)`
                        }
                    ]
                }
            }
        }
    }

    // 趋势图配置
    get trendChartOptions(): EChartOption {
        const seriesNames = ['新发布', '修订', '废止']

        return {
            grid: {
                top: '15%',
                left: '3%',
                right: '4%',
                bottom: '10%',
                containLabel: true
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'line'
                }
            },
            xAxis: {
                type: 'category',
                data: this.trendChartData.xAxis?.data || [],
                axisTick: {
                    alignWithLabel: true
                },
                axisLine: {
                    lineStyle: {
                        color: '#f0f0f0'
                    }
                },
                axisLabel: {
                    color: '#666'
                }
            },
            yAxis: {
                type: 'value',
                axisLine: {
                    show: false
                },
                axisTick: {
                    show: false
                },
                splitLine: {
                    lineStyle: {
                        color: '#f0f0f0'
                    }
                },
                axisLabel: {
                    color: '#666'
                }
            },
            series: seriesNames.map((name, index) =>
                this.generateSeriesConfig(name, index, index)
            )
        }
    }

    // 获取已完成审核状态样式类
    getCompletedReviewStatusClass(status: string): string {
        const classMap: ReviewStatusClassMap = {
            已通过: 'lawyer-status-approved',
            已驳回: 'lawyer-status-rejected',
            pending: 'lawyer-status-pending'
        }
        return classMap[status] || 'lawyer-status-pending'
    }

    // 获取已完成审核图标类型
    getCompletedReviewIconType(status: string): string {
        const iconMap: IconTypeMap = {
            已通过: 'file-done',
            已驳回: 'file-exclamation'
        }
        return iconMap[status] || 'file-sync'
    }

    // 格式化时间显示
    formatTime(timeStr: string): string {
        if (!timeStr) { return '-' }
        return moment(timeStr).format('YYYY-MM-DD HH:mm:ss')
    }

    // 组件事件定义
    @Emit('export-report')
    exportReport() { }

    @Emit('view-reviews')
    viewReviews() { }
}
</script>

<style lang="less">
@import "~/assets/styles/lawyer.less";

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

    .lawyer-trend-selectors {
        display: flex;
        align-items: center;
    }
}

.w-100 {
    width: 80px;
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

.lawyer-review-list {
    min-height: 200px;
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
