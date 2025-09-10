<template>
    <div class="lawyer-page-container">
        <div class="lawyer-content-wrapper">
            <!-- 数据表格 -->
            <a-card class="lawyer-table-card" :bordered="false">
                <!-- 搜索和筛选区域 -->
                <div class="lawyer-search-form">
                    <a-row :gutter="16">
                        <a-col :span="4">
                            <a-input v-model="searchParams.websiteName" placeholder="网站名称" allow-clear
                                @keyup.enter="onSearch" />
                        </a-col>
                        <a-col :span="4">
                            <a-input v-model="searchParams.articleTitle" placeholder="文章标题" allow-clear
                                @keyup.enter="onSearch" />
                        </a-col>
                        <a-col :span="4">
                            <div class="lawyer-width-100">
                                <a-select v-model="searchParams.processStatus" placeholder="处理状态" allow-clear>
                                    <a-select-option value="爬取成功">
                                        爬取成功
                                    </a-select-option>
                                    <a-select-option value="爬取失败">
                                        爬取失败
                                    </a-select-option>
                                    <a-select-option value="爬取中">
                                        爬取中
                                    </a-select-option>
                                </a-select>
                            </div>
                        </a-col>
                        <a-col :span="4">
                            <div>
                                <a-date-picker v-model="searchParams.publishDate" placeholder="发布日期" format="YYYY-MM-DD"
                                    value-format="YYYY-MM-DD" style="width: 100%" />
                            </div>
                        </a-col>
                        <a-col :span="8" class="lawyer-search-buttons">
                            <div class="lawyer-button-group">
                                <a-button type="primary" :loading="tableLoading" @click="onSearch">
                                    搜索
                                </a-button>
                                <a-button @click="onReset">
                                    重置
                                </a-button>
                            </div>
                        </a-col>
                    </a-row>
                </div>

                <a-table :columns="columns" :data-source="dataList" :pagination="pagination" :loading="tableLoading"
                    :row-key="(record) => record.id" @change="handleTableChange">
                    <!-- 处理状态列 -->
                    <template slot="processStatus" slot-scope="text">
                        <a-tag :color="getStatusColor(getStringValue(text))" class="lawyer-status-tag">
                            {{ getStringValue(text) || "未知" }}
                        </a-tag>
                    </template>

                    <template slot="detailUrl" slot-scope="text">
                        <a :href="text" target="_blank">{{ text }}</a>
                    </template>

                    <template slot="extractStatus" slot-scope="text">
                        <span :class="getCheckStatusClass(text)">
                            {{ text || '未知状态' }}
                        </span>
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
                        <div class="lawyer-action-buttons">
                            <a-button type="link" :disabled="isProcessing(record)"
                                :icon="isProcessing(record) ? 'loading' : 'play-circle'" @click="executeTask(record)">
                                {{ isProcessing(record) ? "正在处理" : "执行" }}
                            </a-button>
                            <a-button type="link" @click="viewHistory(record)">
                                查看
                            </a-button>

                        </div>
                    </template>
                </a-table>
            </a-card>
        </div>

        <!-- 历史记录弹窗 -->
        <a-modal v-model="historyModalVisible" title="执行历史记录" width="90%" :footer="null">
            <a-table :columns="historyColumns" :data-source="historyList" :pagination="historyPagination"
                :loading="historyLoading" :row-key="(record) => record.id" @change="handleHistoryTableChange">
                <!-- 处理状态列 -->
                <template slot="processStatus" slot-scope="text">
                    <a-tag :color="getStatusColor(text)" class="lawyer-status-tag">
                        {{ text }}
                    </a-tag>
                </template>
                <template slot="extractStatus" slot-scope="text">
                    <span :class="getCheckStatusClass(text)">
                        {{ text || '未知状态' }}
                    </span>
                </template>

                <!-- 创建时间列 -->
                <template slot="createdTime" slot-scope="text">
                    {{ formatDateTime(text) }}
                </template>

                <!-- 异常信息列 -->
                <template slot="exceptionMsg" slot-scope="text">
                    <span v-if="text" :title="text" class="lawyer-exception-text">
                        {{ text.length > 50 ? text.substring(0, 50) + '...' : text }}
                    </span>
                    <span v-else>-</span>
                </template>
            </a-table>
        </a-modal>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'
import moment from 'moment'
import {
    CrawlDataItem,
    CrawlStatisticsQueryParams,
    CrawlHistoryItem,
    CrawlHistoryQueryParams
} from '~/model/LawyerConfigModel'

@Component({ name: 'lawyer-crawl-statistics-index-component' })
export default class CrawlStatisticsComponent extends Vue {
    // 搜索参数
    searchParams: CrawlStatisticsQueryParams = {
        websiteCode: '',
        websiteName: '',
        articleTitle: '',
        detailUrl: '',
        attachments: '',
        publishDate: '', // 可以设置为 "" 或 "2025-05-09" 这样的默认值
        processStatus: undefined, // 处理状态过滤
        current: 1,
        size: 10,
        orderBy: 'createdTime', // 默认按创建时间排序
        sortRules: 'desc' // 默认倒序
    };

    // 表格数据
    dataList: CrawlDataItem[] = [];
    tableLoading: boolean = false;

    // 定时器
    refreshTimer: NodeJS.Timeout | null = null;

    // 历史记录相关数据
    historyModalVisible: boolean = false;
    historyList: CrawlHistoryItem[] = [];
    historyLoading: boolean = false;
    currentDetailId: string = '';

    // 分页配置
    pagination = {
        current: 1,
        pageSize: 10,
        total: 0,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total: number) => `共 ${total} 条记录`
    };

    // 历史记录分页配置
    historyPagination = {
        current: 1,
        pageSize: 10,
        total: 0,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total: number) => `共 ${total} 条历史记录`
    };

    // 表格列配置
    columns = [
        {
            title: '网站编码',
            dataIndex: 'websiteCode',
            key: 'websiteCode',
            width: 100
        },
        {
            title: '网站名称',
            dataIndex: 'websiteName',
            key: 'websiteName',
            width: 200
        },
        {
            title: '文章标题',
            dataIndex: 'articleTitle',
            key: 'articleTitle',
            ellipsis: true
        },
        {
            title: '文章详情地址',
            dataIndex: 'detailUrl',
            key: 'detailUrl',
            scopedSlots: { customRender: 'detailUrl' },
            width: 200,
            ellipsis: true
        },
        {
            title: '处理状态',
            dataIndex: 'processStatus',
            key: 'processStatus',
            scopedSlots: { customRender: 'processStatus' },
            width: 100
        },
        {
            title: '对比状态',
            dataIndex: 'extractStatus',
            key: 'extractStatus',
            scopedSlots: { customRender: 'extractStatus' },
            width: 100
        },
        {
            title: '文章发布日期',
            dataIndex: 'publishDate',
            key: 'publishDate',
            scopedSlots: { customRender: 'publishDate' },
            sorter: true,
            width: 140
        },
        {
            title: '创建时间',
            dataIndex: 'createdTime',
            key: 'createdTime',
            scopedSlots: { customRender: 'createdTime' },
            width: 160,
            sorter: true
        },
        {
            title: '更新时间',
            dataIndex: 'updateTime',
            key: 'updateTime',
            scopedSlots: { customRender: 'updateTime' },
            width: 160,
            sorter: true
        },
        {
            title: '操作',
            key: 'action',
            scopedSlots: { customRender: 'action' },
            width: 120,
            fixed: 'right'
        }
    ];

    // 历史记录表格列配置
    historyColumns = [
        {
            title: '文章标题',
            dataIndex: 'articleTitle',
            key: 'articleTitle',
            ellipsis: true
        },
        {
            title: '文章详情地址',
            dataIndex: 'detailUrl',
            key: 'detailUrl',
            width: 200,
            ellipsis: true
        },
        {
            title: '处理状态',
            dataIndex: 'processStatus',
            key: 'processStatus',
            scopedSlots: { customRender: 'processStatus' },
            width: 100
        },
        {
            title: '异常信息',
            dataIndex: 'exceptionMsg',
            key: 'exceptionMsg',
            scopedSlots: { customRender: 'exceptionMsg' },
            ellipsis: true
        },
        {
            title: '创建时间',
            dataIndex: 'createdTime',
            key: 'createdTime',
            scopedSlots: { customRender: 'createdTime' },
            width: 160,
            sorter: true
        }
    ];

    // 生命周期
    async mounted(): Promise<void> {
        await this.loadData()
        this.startAutoRefresh()
    }

    // 组件销毁时清理定时器
    beforeDestroy(): void {
        this.stopAutoRefresh()
    }

    // 加载数据
    async loadData(): Promise<void> {
        this.tableLoading = true
        try {
            // 构建查询参数
            const apiParams: CrawlStatisticsQueryParams = {
                ...this.searchParams,
                publishDate: this.searchParams.publishDate || undefined,
                processStatus: this.searchParams.processStatus || undefined
            }

            // 调用真实API
            const response = await this.$roadLawyerService.getCrawlHtmlList(
                apiParams
            )

            if (response.success && response.data) {
                this.dataList = response.data.records
                this.pagination.total = response.data.total
                this.pagination.current = response.data.current
            } else {
                this.dataList = []
                this.pagination.total = 0
                this.$message.error(response.message || '加载数据失败')
            }
        } catch (error) {
            console.error('加载数据失败:', error)
            this.dataList = []
            this.pagination.total = 0
            this.$message.error('加载数据失败')
        } finally {
            this.tableLoading = false
        }
    }

    // 搜索
    async onSearch(): Promise<void> {
        this.searchParams.current = 1
        this.pagination.current = 1
        await this.loadData()
    }

    // 重置搜索
    async onReset(): Promise<void> {
        this.searchParams = {
            websiteCode: '',
            websiteName: '',
            articleTitle: '',
            detailUrl: '',
            attachments: '',
            publishDate: '',
            processStatus: undefined,
            current: 1,
            size: 10,
            orderBy: 'createdTime', // 默认按创建时间排序
            sortRules: 'desc' // 默认倒序
        }
        this.pagination.current = 1
        await this.loadData()
    }

    // 表格变化处理
    async handleTableChange(
        pagination: { current: number; pageSize: number },
        _filters: unknown,
        sorter: { field?: string; order?: string }
    ): Promise<void> {
        this.searchParams.current = pagination.current
        this.searchParams.size = pagination.pageSize

        // 处理排序参数
        if (sorter.field) {
            this.searchParams.orderBy = sorter.field
            this.searchParams.sortRules = sorter.order === 'ascend' ? 'asc' : 'desc'
        } else {
            // 如果没有排序，使用默认排序
            this.searchParams.orderBy = 'createdTime'
            this.searchParams.sortRules = 'desc'
        }

        await this.loadData()
    }

    // 获取状态颜色
    getStatusColor(status: string): string {
        const colorMap: { [key: string]: string } = {
            爬取成功: 'green',
            爬取失败: '#f50',
            爬取中: '#2db7f5',
            待处理: 'orange'
        }
        return colorMap[status] || 'default'
    }
    // 获取审核状态样式类（使用全局样式）
    getCheckStatusClass(status: string | null): string {
        const classMap = {
            未核对: 'lawyer-status-pending',
            核对成功: 'lawyer-status-approved',
            核对失败: 'lawyer-status-rejected',
        }
        return classMap[status || ''] || 'lawyer-status-pending'
    }

    // 格式化日期时间（统一方法）
    formatDateTime(
        datetime: string,
        format: 'date' | 'datetime' = 'datetime'
    ): string {
        if (!datetime) { return '-' }
        try {
            const m = moment(datetime)
            return format === 'date'
                ? m.format('YYYY-MM-DD')
                : m.format('YYYY-MM-DD HH:mm:ss')
        } catch {
            return datetime // 如果解析失败，返回原始字符串
        }
    }

    // 辅助方法：安全获取字符串值（支持对象属性和直接值）
    getStringValue(value: unknown, key?: string): string {
        let targetValue = value

        // 如果指定了key，从对象中获取属性值
        if (key && value && typeof value === 'object' && key in value) {
            targetValue = (value as Record<string, unknown>)[key]
        }

        return typeof targetValue === 'string'
            ? targetValue
            : String(targetValue || '')
    }

    // 判断任务是否正在爬取中
    isProcessing(record: CrawlDataItem): boolean {
        const status = this.getStringValue(record, 'processStatus')
        return status === '爬取中'
    }

    // 开始自动刷新
    startAutoRefresh(): void {
        // 每10分钟刷新一次（600000毫秒）
        this.refreshTimer = setInterval(() => {
            // 只有当存在爬取中的任务时才自动刷新
            const hasProcessingTasks = this.dataList.some(item =>
                this.isProcessing(item)
            )
            if (hasProcessingTasks) {
                this.loadData()
            }
        }, 600000)
    }

    // 停止自动刷新
    stopAutoRefresh(): void {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer)
            this.refreshTimer = null
        }
    }

    // 执行任务
    executeTask(record: CrawlDataItem) {
        this.$confirm({
            title: '确认执行任务',
            content: `确定要执行网站"${record.websiteName}"的爬取任务吗？`,
            okText: '确认',
            cancelText: '取消',
            onOk: async () => {
                try {
                    // 调用真实API
                    const response = await this.$roadLawyerService.executeCrawlTask({
                        id: record.id
                    })

                    // 显示结果消息
                    if (response.success) {
                        this.$message.success('任务执行成功')
                    } else {
                        this.$message.error(response.message || '任务执行失败，请重试')
                    }

                    // 刷新数据（获取最新状态）
                    await this.loadData()
                } catch (error) {
                    console.error('执行任务失败:', error)
                    this.$message.error('执行任务失败，请重试')
                }
            }
        })
    }

    // 查看历史记录
    async viewHistory(record: CrawlDataItem): Promise<void> {
        this.currentDetailId = record.id
        this.historyModalVisible = true
        this.historyPagination.current = 1
        await this.loadHistoryData()
    }

    // 加载历史记录数据
    async loadHistoryData(): Promise<void> {
        if (!this.currentDetailId) return

        this.historyLoading = true
        try {
            const params: CrawlHistoryQueryParams = {
                detailId: this.currentDetailId,
                current: this.historyPagination.current,
                size: this.historyPagination.pageSize,
                sortRules: 'DESC'
            }

            const response = await this.$roadLawyerService.getCrawlHistory(params)

            if (response.success && response.data) {
                this.historyList = response.data.records
                this.historyPagination.total = response.data.total
                this.historyPagination.current = response.data.current
            } else {
                this.historyList = []
                this.historyPagination.total = 0
                this.$message.error(response.message || '加载历史记录失败')
            }
        } catch (error) {
            console.error('加载历史记录失败:', error)
            this.historyList = []
            this.historyPagination.total = 0
            this.$message.error('加载历史记录失败')
        } finally {
            this.historyLoading = false
        }
    }

    // 历史记录表格变化处理
    async handleHistoryTableChange(
        pagination: { current: number; pageSize: number },
        _filters: unknown,
        _sorter: { field?: string; order?: string }
    ): Promise<void> {
        this.historyPagination.current = pagination.current
        this.historyPagination.pageSize = pagination.pageSize
        await this.loadHistoryData()
    }


}
</script>

<style lang="less" scoped>
.lawyer-search-form {
    margin-bottom: 16px;
}

.lawyer-width-100 {
    width: 100%;
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
        .ant-table-tbody>tr>td {
            padding: 12px 16px;
        }
    }
}

.lawyer-exception-text {
    color: #ff4d4f;
    cursor: help;
}

.lawyer-action-buttons {
    display: flex;
    gap: 8px;
    justify-content: center;

    .ant-btn-link {
        padding: 0;
        height: auto;
        line-height: 1.5;
    }
}
</style>
