<template>
    <div class="db-page-wrapper">
        <div class="lawyer-page-container">
            <!-- 整体卡片容器 -->
            <div class="lawyer-main-card">
                <!-- 页面标题 -->
                <h1 class="lawyer-page-title">人工审核与数据管理</h1>

                <!-- 搜索筛选和操作区域 -->
                <div class="lawyer-controls-row">
                    <a-input-search v-model="searchText" placeholder="搜索标题、文号、来源..." class="lawyer-search-input"
                        @search="onSearch" />

                    <div class="lawyer-status-tags">
                        <span v-for="option in statusOptions" :key="option.value" :class="[
                            'lawyer-status-tag',
                            { 'lawyer-status-tag-active': filterStatus === option.value },
                        ]" @click="onStatusTagClick(option.value)">
                            {{ option.label }}
                        </span>
                    </div>
                    <div class="lawyer-filter-select">
                        <a-select v-model="filterType" placeholder="请选择分类" allowClear @change="onFilterChange">
                            <a-select-option value=""> 全部分类 </a-select-option>
                            <a-select-option v-for="option in typeOptions" :key="option.value" :value="option.value">
                                {{ option.label }}
                            </a-select-option>
                        </a-select>
                    </div>

                    <a-button class="lawyer-btn-export" @click="exportData" :disabled="selectedRowKeys.length === 0">
                        导出选中数据 ({{ selectedRowKeys.length }})
                    </a-button>
                </div>

                <!-- 文档列表表格 -->
                <div class="lawyer-table-wrapper">
                    <!-- 暂无数据状态 -->
                    <div v-if="!tableLoading && documents.length === 0" class="lawyer-empty-state">
                        <a-empty description="暂无数据" />
                    </div>

                    <a-table v-else :columns="columns" :data-source="documents" :pagination="currentPagination"
                        :loading="tableLoading" :row-key="(record) => record.id" :row-selection="rowSelection"
                        @change="handleTableChange">
                        <!-- 标题列插槽 -->
                        <template slot="ruleName" slot-scope="text, record">
                            <div>
                                <div>{{ record.ruleName }}</div>
                                <div style="color: #999; font-size: 12px">
                                    文号：{{ record.documentNo || "无" }}
                                </div>
                            </div>
                        </template>

                        <!-- 分类列插槽 -->
                        <span slot="type" slot-scope="text">
                            {{ text || "未分类" }}
                        </span>

                        <!-- 状态列插槽 -->
                        <span slot="status" slot-scope="text">
                            <span :class="getCheckStatusClass(text)">
                                {{ text || "未知状态" }}
                            </span>
                        </span>

                        <!-- 提交时间列插槽 -->
                        <span slot="createdTime" slot-scope="text">
                            {{ formatTime(text) }}
                        </span>

                        <!-- 施行日期列插槽 -->
                        <span slot="effectDate" slot-scope="text">
                            {{ formatTime(text) }}
                        </span>

                        <!-- 操作列表头插槽 -->
                        <template slot="actionTitle">
                            <div class="lawyer-action-header">
                                <span>操作</span>
                                <a-tooltip placement="left">
                                    <template slot="title">
                                        <span>版本规则：文件版本落后系统最高版本时，不允许审核操作</span>
                                    </template>
                                    <a-icon type="info-circle" class="ml-8" />
                                </a-tooltip>
                            </div>
                        </template>

                        <!-- 操作列插槽 -->
                        <span slot="action" slot-scope="text, record">
                            <div class="lawyer-action-links">
                                <a class="lawyer-link-view" @click="viewDocument(record)">
                                    查看
                                </a>
                                <template v-if="
                                    (record.checkStatus === '待审核' ||
                                        record.checkStatus === null) &&
                                    canReviewItem(record)
                                ">
                                    <a class="lawyer-link-approve" @click="approveDocument(record)">
                                        通过
                                    </a>
                                    <a class="lawyer-link-reject" @click="rejectDocument(record)">
                                        驳回
                                    </a>
                                </template>
                            </div>
                        </span>

                        <!-- 自定义筛选下拉框 -->
                        <div slot="filterDropdown" slot-scope="{
                setSelectedKeys,
                selectedKeys,
                confirm,
                clearFilters,
                column,
              }" style="padding: 8px">
                            <a-input ref="searchInput" :placeholder="`搜索 ${column.title}`" :value="selectedKeys[0]"
                                @change="
                                    (e) => setSelectedKeys(e.target.value ? [e.target.value] : [])
                                " style="width: 188px; margin-bottom: 8px; display: block" @pressEnter="
                                    () => handleSearch(selectedKeys, confirm, column.dataIndex)
                                " />
                            <a-button type="primary" icon="search" @click="
                                () => handleSearch(selectedKeys, confirm, column.dataIndex)
                            " size="small" style="width: 90px; margin-right: 8px">
                                搜索
                            </a-button>
                            <a-button size="small" @click="() => handleReset(clearFilters)" style="width: 90px">
                                重置
                            </a-button>
                        </div>
                        <a-icon slot="filterIcon" slot-scope="filtered" type="search"
                            :style="{ color: filtered ? '#1890ff' : undefined }" />
                    </a-table>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "nuxt-property-decorator";
import moment from "moment";
import {
    ToDoRuleItem,
    FilterOption,
    StatusMap,
    DateRange,
    RowSelectionConfig,
} from "~/model/LawyerModel";
import { categoryOptions } from "~/enum/Lawyer";
import { downloadFileWithMessage } from "~/utils/personal";

import { CustomColumn } from "~/model/CommonModel";

@Component({ name: "lawyer-manual-review-index-component" })
export default class LawyerManualReviewIndexComponent extends Vue {
    // 搜索和筛选
    searchText: string = "";
    filterStatus: string = "all";
    filterType: string = "";
    dateRange: DateRange = [];
    // 表格加载状态
    tableLoading: boolean = false;

    // 表格勾选相关
    selectedRowKeys: string[] = [];
    selectedRows: ToDoRuleItem[] = [];

    // 表格筛选状态
    tableFilters: { [key: string]: string[] } = {};

    // 组件销毁标志
    private isDestroyed: boolean = false;

    // 当前分页配置
    currentPagination: any = {
        current: 1,
        pageSize: 10,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total: number, range: number[]) =>
            `共 ${total} 条数据，显示第 ${range[0]}-${range[1]} 条`,
        pageSizeOptions: ["10", "20", "50", "100"],
    };

    // 状态选项
    statusOptions: FilterOption[] = [
        { label: "全部状态", value: "all" },
        { label: "待审核", value: "pending" },
        { label: "已通过", value: "approved" },
        { label: "已驳回", value: "rejected" },
    ];

    // 文档类型选项（从常量文件导入）
    typeOptions: FilterOption[] = categoryOptions;

    // 表格行选择配置
    get rowSelection(): RowSelectionConfig<ToDoRuleItem> {
        return {
            selectedRowKeys: this.selectedRowKeys,
            onChange: this.onSelectChange,
            onSelectAll: this.onSelectAll,
            getCheckboxProps: (record: ToDoRuleItem) => ({
                disabled: false,
                name: record.id,
            }),
        };
    }

    // 表格列配置（使用 any 以避免对 CommonModel.ts 的依赖）
    get columns(): CustomColumn[] {
        return [
            {
                title: "标题/文号",
                key: "ruleName",
                scopedSlots: {
                    customRender: "ruleName",
                    filterDropdown: "filterDropdown",
                    filterIcon: "filterIcon",
                },
                onFilter: (value: string, record: ToDoRuleItem) => {
                    const searchValue = String(value).toLowerCase();
                    const ruleName = String(record.ruleName || "").toLowerCase();
                    const categorySub = String(record.categorySub || "").toLowerCase();
                    return (
                        ruleName.includes(searchValue) || categorySub.includes(searchValue)
                    );
                },
            },
            {
                title: "分类",
                dataIndex: "categoryMain",
                key: "categoryMain",
                scopedSlots: {
                    customRender: "type",
                    filterDropdown: "filterDropdown",
                    filterIcon: "filterIcon",
                },
                width: 120,
                onFilter: (value: string, record: ToDoRuleItem) => {
                    const searchValue = String(value).toLowerCase();
                    const categoryMain = String(record.categoryMain || "").toLowerCase();
                    return categoryMain.includes(searchValue);
                },
            },
            {
                title: "来源",
                dataIndex: "legalSource",
                key: "legalSource",
                width: 150,
                scopedSlots: {
                    filterDropdown: "filterDropdown",
                    filterIcon: "filterIcon",
                },
                onFilter: (value: string, record: ToDoRuleItem) => {
                    const searchValue = String(value).toLowerCase();
                    const legalSource = String(record.legalSource || "").toLowerCase();
                    return legalSource.includes(searchValue);
                },
            },
            {
                title: "提交时间",
                dataIndex: "createdTime",
                key: "createdTime",
                width: 160,
                scopedSlots: { customRender: "createdTime" },
                sorter: (a: ToDoRuleItem, b: ToDoRuleItem) => {
                    const dateA = new Date(String(a.createdTime)).getTime();
                    const dateB = new Date(String(b.createdTime)).getTime();
                    return dateA - dateB;
                },
            },
            {
                title: "施行日期",
                dataIndex: "effectDate",
                key: "effectDate",
                width: 160,
                scopedSlots: { customRender: "effectDate" },
                sorter: (a: ToDoRuleItem, b: ToDoRuleItem) => {
                    const dateA = new Date(String(a.effectDate || 0)).getTime();
                    const dateB = new Date(String(b.effectDate || 0)).getTime();
                    return dateA - dateB;
                },
            },
            {
                title: "状态",
                dataIndex: "checkStatus",
                key: "checkStatus",
                scopedSlots: { customRender: "status" },
                width: 120,
                filters: [
                    { text: "待审核", value: "待审核" },
                    { text: "已通过", value: "已通过" },
                    { text: "已驳回", value: "已驳回" },
                ],
                filteredValue: this.tableFilters.checkStatus || null,
                onFilter: (value: string, record: ToDoRuleItem) =>
                    record.checkStatus === value,
            },
            {
                key: "action",
                scopedSlots: {
                    customRender: "action",
                    title: "actionTitle",
                },
                fixed: "right",
                width: 180,
            },
        ];
    }

    // 文档数据
    documents: ToDoRuleItem[] = [];

    // 生命周期钩子
    async mounted(): Promise<void> {
        // 先加载文档数据
        await this.loadDocuments();

        // 设置初始筛选状态
        this.setInitialFilters();
    }

    // 监听路由变化
    @Watch("$route", { immediate: false, deep: false })
    onRouteChange(to: any, from: any): void {
        // 防护：确保路由对象存在
        if (!to || !from) {
            return;
        }

        // 只有当筛选参数发生变化时才重新设置
        if (to.query.filter !== from.query.filter) {
            console.log(
                "路由筛选参数变化:",
                from.query.filter,
                "->",
                to.query.filter
            );
            this.setInitialFilters();
        }
    }

    // 设置初始筛选状态
    setInitialFilters(): void {
        // 防护：如果组件已销毁，不执行操作
        if (this.isDestroyed) {
            return;
        }

        const filterParam = this.$route.query.filter as string;

        // 先清空之前的筛选状态，避免状态残留
        this.tableFilters = {};

        if (filterParam) {
            // 使用 $nextTick 确保DOM更新完成后再设置筛选
            this.$nextTick(() => {
                // 再次检查组件是否已销毁
                if (this.isDestroyed) {
                    return;
                }

                if (filterParam === "completed") {
                    // 从首页"查看历史记录"跳转过来，显示已通过和已驳回
                    this.tableFilters = {
                        checkStatus: ["已通过", "已驳回"],
                    };
                    // 由于是多选，顶部状态标签设置为全部
                    this.filterStatus = "all";
                    console.log("设置筛选条件 - 已完成:", this.tableFilters);
                } else if (filterParam === "pending") {
                    // 从首页"查看全部"跳转过来，显示待审核
                    this.tableFilters = {
                        checkStatus: ["待审核"],
                    };
                    // 同步更新顶部状态标签
                    this.filterStatus = "pending";
                    console.log("设置筛选条件 - 待审核:", this.tableFilters);
                } else {
                    console.log("未知的筛选参数:", filterParam);
                }
            });
        } else {
            console.log("清空筛选条件");
        }
    }

    // 组件销毁时的清理
    beforeDestroy(): void {
        this.isDestroyed = true;
    }

    // 加载文档数据
    async loadDocuments(): Promise<void> {
        this.tableLoading = true;

        try {
            // 构建查询参数
            const params = {
                condition: this.searchText || "",
                checkStatus: this.getApiCheckStatus(this.filterStatus),
                category: this.filterType || "",
            };

            console.log("查询参数:", params);

            // 暂时使用 mock 数据测试分页效果
            // TODO: 恢复真实 API 调用
            const result = await this.$roadLawyerService.getRuleList(
                params,
                "management"
            );

            // 使用 mock 数据，mock 数据就是数组格式
            this.documents = result;

            // 重置页码到第一页
            this.currentPagination = {
                ...this.currentPagination,
                current: 1,
            };
        } catch (error) {
            console.error("错误详情:", error);
            this.documents = [];
        } finally {
            this.tableLoading = false;
        }
    }

    // 搜索方法
    async onSearch(value: string): Promise<void> {
        this.searchText = value;
        await this.loadDocuments();
    }

    // 筛选方法
    async onFilterChange(value: string): Promise<void> {
        this.filterType = value;
        await this.loadDocuments();
    }

    // 状态标签点击
    async onStatusTagClick(value: string): Promise<void> {
        this.filterStatus = this.filterStatus === value ? "all" : value;

        // 同步更新表格筛选状态
        if (this.filterStatus === "all") {
            this.tableFilters = {};
        } else if (this.filterStatus === "pending") {
            this.tableFilters = { checkStatus: ["待审核"] };
        } else if (this.filterStatus === "approved") {
            this.tableFilters = { checkStatus: ["已通过"] };
        } else if (this.filterStatus === "rejected") {
            this.tableFilters = { checkStatus: ["已驳回"] };
        }

        await this.loadDocuments();
    }

    // 将前端状态值转换为API状态值
    getApiCheckStatus(status: string): string {
        const statusMap: StatusMap = {
            all: "",
            pending: "待审核",
            approved: "已通过",
            rejected: "已驳回",
        };
        return statusMap[status] || "";
    }

    // 表格变化事件
    handleTableChange(pagination: any, filters: any): void {
        // 更新分页信息
        this.currentPagination = {
            ...this.currentPagination,
            current: pagination.current,
            pageSize: pagination.pageSize,
        };

        // 更新筛选状态
        this.tableFilters = filters || {};

        // 同步更新顶部状态标签
        this.syncFilterStatusFromTable();
    }

    // 根据表格筛选状态同步顶部状态标签
    syncFilterStatusFromTable(): void {
        const checkStatusFilter = this.tableFilters.checkStatus;

        if (!checkStatusFilter || checkStatusFilter.length === 0) {
            this.filterStatus = "all";
        } else if (checkStatusFilter.length === 1) {
            if (checkStatusFilter[0] === "待审核") {
                this.filterStatus = "pending";
            } else if (checkStatusFilter[0] === "已通过") {
                this.filterStatus = "approved";
            } else if (checkStatusFilter[0] === "已驳回") {
                this.filterStatus = "rejected";
            } else {
                this.filterStatus = "all";
            }
        } else {
            // 多选情况，设置为全部
            this.filterStatus = "all";
        }
    }

    // 处理搜索
    handleSearch(
        selectedKeys: string[],
        confirm: Function,
        dataIndex: string
    ): void {
        confirm();
        console.log("搜索:", selectedKeys, dataIndex);
    }

    // 处理重置
    handleReset(clearFilters: Function): void {
        clearFilters();
    }

    // 刷新数据
    async refreshData(): Promise<void> {
        await this.loadDocuments();
        this.$message.success("数据已刷新");
    }

    // 获取审核状态样式类（使用全局样式）
    getCheckStatusClass(status: string | null): string {
        const classMap: StatusMap = {
            待审核: "lawyer-status-pending",
            已通过: "lawyer-status-approved",
            已驳回: "lawyer-status-rejected",
        };
        return classMap[status || ""] || "lawyer-status-pending";
    }

    // 格式化时间显示
    formatTime(timeStr: string): string {
        if (!timeStr) {
            return "-";
        }
        return moment(timeStr).format("YYYY-MM-DD HH:mm");
    }

    // 查看文档
    viewDocument(document: ToDoRuleItem): void {
        this.$message.info(`查看文档: ${document.ruleName}`);
        // 跳转到文档比较详情页面
        this.$router.push({
            path: "/manualReview/detail",
            query: {
                id: document.id,
                pageTitle: document.ruleName,
                checkStatus: document.checkStatus || "待审核", // 传递审核状态
            },
        });
    }

    // 检查是否允许审核该项目
    canReviewItem(record: ToDoRuleItem): boolean {
        // 如果版本字段不存在，默认允许审核
        if (
            record.fileVersion === undefined ||
            record.currentMaxFileVersion === undefined
        ) {
            return true;
        }

        const newVersion: number = Number(record.fileVersion) || 0;
        const maxVersion: number = Number(record.currentMaxFileVersion) || 0;

        return newVersion >= maxVersion;
    }

    // 审核通过
    approveDocument(document: ToDoRuleItem): void {
        // 检查版本
        if (!this.canReviewItem(document)) {
            this.$message.warning("当前版本高于系统最高版本，不允许审核");
            return;
        }

        this.$confirm({
            title: "确认通过",
            content: `确定要通过文档"${document.ruleName}"的审核吗？`,
            okText: "确认通过",
            cancelText: "取消",
            onOk: () => {
                this.submitReview("approve", document);
            },
        });
    }

    // 审核驳回
    rejectDocument(document: ToDoRuleItem): void {
        // 检查版本
        if (!this.canReviewItem(document)) {
            this.$message.warning("当前版本高于系统最高版本，不允许审核");
            return;
        }

        this.$confirm({
            title: "确认驳回",
            content: `确定要驳回文档"${document.ruleName}"吗？`,
            okText: "确认驳回",
            okType: "danger",
            cancelText: "取消",
            onOk: () => {
                this.submitReview("reject", document);
            },
        });
    }

    // 提交审核
    async submitReview(action: string, document: ToDoRuleItem): Promise<void> {
        try {
            // 调用统一的审核接口，通过approvalComment传递状态
            await this.$roadLawyerService.approveToDoRule({
                id: document.id,
                approvalComment: action === "approve" ? "已通过" : "已驳回",
            });

            // 显示成功消息
            this.$message.success(action === "approve" ? "审核已通过" : "文档已驳回");

            // 重新加载表格数据
            await this.loadDocuments();
        } catch (error) {
            console.error("审核操作失败:", error);
            this.$message.error("审核操作失败，请重试");
        }
    }

    // 表格行选择变化事件
    onSelectChange(
        selectedRowKeys: string[],
        selectedRows: ToDoRuleItem[]
    ): void {
        console.log("选中行变化:", selectedRowKeys, selectedRows);
        this.selectedRowKeys = selectedRowKeys;
        this.selectedRows = selectedRows;
    }

    // 全选/取消全选
    onSelectAll(
        selected: boolean,
        selectedRows: ToDoRuleItem[],
        changeRows: ToDoRuleItem[]
    ): void {
        console.log("全选变化:", selected, selectedRows, changeRows);
        if (selected) {
            this.selectedRowKeys = selectedRows.map((row: ToDoRuleItem) => row.id);
            this.selectedRows = selectedRows;
        } else {
            this.selectedRowKeys = [];
            this.selectedRows = [];
        }
    }

    // 导出数据
    async exportData(): Promise<void> {
        if (this.selectedRowKeys.length === 0) {
            this.$message.warning("请先选择要导出的数据");
            return;
        }

        this.$message.info(
            `正在导出 ${this.selectedRowKeys.length} 条数据，请稍候...`
        );

        try {
            // 使用真实的API调用，传入选中的ids数组
            const result = await this.$roadLawyerService.exportExcel({
                ids: this.selectedRowKeys,
            });

            if (
                downloadFileWithMessage(result, {
                    fileName: `人工审核数据_${this.selectedRowKeys.length}条.xlsx`,
                    showMessage: true,
                    messageService: this.$message,
                })
            ) {
                // 下载成功，消息已在 downloadFileWithMessage 中处理
            } else {
                this.$message.error("导出失败，请重试");
            }
        } catch (error) {
            console.error("导出失败:", error);
            this.$message.error("导出失败，请重试");
        }
    }
}
</script>

<style lang="less">
@import "~/assets/styles/lawyer.less";

.db-page-wrapper {

    // 整体卡片样式
    .lawyer-main-card {
        background: var(--lawyer-surface);
        border: 1px solid var(--lawyer-border);
        border-radius: 8px;
        padding: 24px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .lawyer-page-title {
        font-size: 20px;
        font-weight: 600;
        color: var(--lawyer-text);
        margin-bottom: 16px;
    }

    // 搜索筛选和操作区域（一行显示）
    .lawyer-controls-row {
        display: flex;
        gap: 12px;
        align-items: center;
        margin-bottom: 16px;
        flex-wrap: wrap;
    }

    .lawyer-search-input {
        width: 240px;
    }

    .lawyer-filter-select {
        width: 150px;
    }

    .lawyer-btn-export {
        margin-left: auto;
        background: #e6a23c;
        border-color: #e6a23c;
        color: white;

        &:hover {
            background: #d39531;
            border-color: #d39531;
            color: white;
        }
    }

    // 操作列表头样式
    .lawyer-action-header {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
    }

    // 表格包装器
    .lawyer-table-wrapper {
        margin-top: 24px;
        border-top: 1px solid var(--lawyer-border);
        padding-top: 24px;
    }

    // 操作链接组
    .lawyer-action-links {
        display: flex;
        gap: 8px;
        align-items: center;
    }

    .lawyer-link-view {
        color: #666;
        cursor: pointer;
        transition: color 0.2s ease;
        padding: 2px 6px;
        border-radius: 3px;

        &:hover {
            color: #333;
            background-color: #f5f5f5;
        }
    }

    .lawyer-link-approve {
        color: #52c41a;
        cursor: pointer;
        transition: all 0.2s ease;
        padding: 2px 6px;
        border-radius: 3px;

        &:hover {
            color: #389e0d;
            background-color: #f6ffed;
        }
    }

    .lawyer-link-reject {
        color: #ff4d4f;
        cursor: pointer;
        transition: all 0.2s ease;
        padding: 2px 6px;
        border-radius: 3px;

        &:hover {
            color: #cf1322;
            background-color: #fff2f0;
        }
    }

    // 状态标签样式
    .lawyer-status-tags {
        display: flex;
        gap: 8px;
        align-items: center;
    }

    .lawyer-status-tag {
        display: inline-block;
        padding: 6px 16px;
        border: 1px solid #d9d9d9;
        border-radius: 3px;
        color: var(--lawyer-text-light);
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: nowrap;
        user-select: none;

        &:hover {
            border-color: var(--lawyer-primary);
            color: var(--lawyer-primary);
        }

        &.lawyer-status-tag-active {
            background-color: var(--lawyer-primary);
            border-color: var(--lawyer-primary);
            color: white;
            font-weight: 500;
        }
    }

    /* 空状态样式 */
    .lawyer-empty-state {
        padding: 40px 20px;
        text-align: center;
    }
}
</style>
