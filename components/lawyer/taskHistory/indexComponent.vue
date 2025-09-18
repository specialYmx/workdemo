<template>
    <div class="lawyer-page-container">
        <div class="lawyer-content-wrapper">
            <!-- 数据表格 -->
            <a-card class="lawyer-table-card" :bordered="false">
                <!-- 搜索和筛选区域 -->
                <div class="lawyer-search-form">
                    <a-row :gutter="16">
                        <a-col :span="6">
                            <a-input v-model="searchParams.taskName" placeholder="任务名称" allow-clear
                                @keyup.enter="onSearch" />
                        </a-col>
                        <a-col :span="18" class="lawyer-search-buttons">
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
                    <!-- 时间格式化插槽 -->
                    <template slot="datetime" slot-scope="text">
                        {{ formatDateTime(text) }}
                    </template>
                </a-table>
            </a-card>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'
import {
    TaskHistoryItem,
    TaskHistoryQueryParams
} from '~/model/LawyerConfigModel'
import { CustomPagination, CustomColumn } from '~/model/CommonModel'
import { formatDate } from '~/utils/date';
@Component({ name: 'lawyer-task-history-index-component' })
export default class TaskHistoryIndexComponent extends Vue {
    // 搜索参数
    searchParams: TaskHistoryQueryParams = {
        taskName: '',
        pageNum: 1,
        pageSize: 10
    };

    // 表格数据
    dataList: TaskHistoryItem[] = [];
    tableLoading: boolean = false;

    // 分页配置
    pagination: CustomPagination = {
        current: 1,
        pageSize: 10,
        total: 0,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total: number) => `共 ${total} 条记录`
    };

    // 表格列配置
    columns: CustomColumn[] = [
        {
            title: '任务名称',
            dataIndex: 'taskName',
            key: 'taskName',
            width: 200
        },
        {
            title: '任务数量',
            dataIndex: 'taskNum',
            key: 'taskNum',
            width: 120
        },
        {
            title: '任务状态',
            dataIndex: 'taskResult',
            key: 'taskResult',
            width: 120
        },
        {
            title: '任务开始时间',
            dataIndex: 'taskStartTime',
            key: 'taskStartTime',
            scopedSlots: { customRender: 'datetime' },
            width: 180
        },
        {
            title: '任务结束时间',
            dataIndex: 'taskEndTime',
            key: 'taskEndTime',
            scopedSlots: { customRender: 'datetime' },
            width: 180
        }
    ];

    // 生命周期
    async mounted(): Promise<void> {
        await this.loadData()
    }

    // 加载数据
    async loadData(): Promise<void> {
        this.tableLoading = true
        try {
            const apiParams: TaskHistoryQueryParams = {
                ...this.searchParams,
                taskName: this.searchParams.taskName || undefined
            }

            const response = await this.$roadLawyerService.getTaskHistory(apiParams)

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
        this.searchParams.pageNum = 1
        this.pagination.current = 1
        await this.loadData()
    }

    // 重置搜索
    async onReset(): Promise<void> {
        this.searchParams = {
            taskName: '',
            pageNum: 1,
            pageSize: 10
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
        this.searchParams.pageNum = pagination.current
        this.searchParams.pageSize = pagination.pageSize

        await this.loadData()
    }

    // 格式化日期时间
    formatDateTime(
        datetime: string,
        format: 'date' | 'datetime' = 'datetime'
    ): string {
        if (!datetime) { return '-' }
        try {
            return format === 'date'
                ? formatDate(datetime, 'yyyy-MM-dd')
                : formatDate(datetime, 'yyyy-MM-dd hh:mm:ss')
        } catch {
            return datetime
        }
    }
}
</script>

<style lang="less" scoped>
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

.lawyer-table-card {
    .ant-table-wrapper {
        .ant-table-tbody>tr>td {
            padding: 12px 16px;
        }
    }
}
</style>
