<template>
    <div class="lawyer-page-container">
        <div class="lawyer-content-wrapper">
            <!-- 数据表格 -->
            <a-card class="lawyer-table-card" :bordered="false">
                <!-- 搜索和筛选区域 -->
                <div class="lawyer-search-form">
                    <a-row :gutter="16">
                        <a-col :span="4">
                            <a-input v-model="searchParams.websiteCode" placeholder="网站代码" allow-clear
                                @keyup.enter="onSearch" />
                        </a-col>
                        <a-col :span="4">
                            <a-input v-model="searchParams.websiteName" placeholder="网站名称" allow-clear
                                @keyup.enter="onSearch" />
                        </a-col>
                        <a-col :span="4">
                            <a-input v-model="searchParams.keyword" placeholder="关键词" allow-clear
                                @keyup.enter="onSearch" />
                        </a-col>
                        <a-col :span="4">
                            <div class="lawyer-width-100">
                                <a-select v-model="searchParams.enabled" placeholder="启用状态" allow-clear
                                    @change="onSearch">
                                    <a-select-option :value="1"> 启用 </a-select-option>
                                    <a-select-option :value="0"> 禁用 </a-select-option>
                                </a-select>
                            </div>
                        </a-col>
                        <a-col :span="8" class="lawyer-search-buttons">
                            <div class="lawyer-button-group">
                                <a-button type="primary" :loading="tableLoading" @click="onSearch">
                                    搜索
                                </a-button>
                                <a-button @click="onReset"> 重置 </a-button>
                                <a-button type="primary" @click="showAddModal">
                                    新增配置
                                </a-button>
                            </div>
                        </a-col>
                    </a-row>
                </div>

                <a-table :columns="columns" :data-source="configList" :pagination="pagination" :loading="tableLoading"
                    :row-key="(record) => record.id" @change="handleTableChange">
                    <!-- 网站代码列 -->
                    <template slot="websiteCode" slot-scope="text">
                        <span>{{ text }}</span>
                    </template>

                    <!-- 网站名称列 -->
                    <template slot="websiteName" slot-scope="text">
                        <span>{{ text }}</span>
                    </template>

                    <!-- 网站URL列 -->
                    <template slot="websiteUrl" slot-scope="text">
                        <span>{{ text }}</span>
                    </template>

                    <!-- 关键词列 -->
                    <template slot="keywords" slot-scope="text">
                        <div v-if="text && text.length > 0" class="lawyer-keywords-container">
                            <a-tag v-for="(keyword, index) in getDisplayKeywords(text)" :key="`${keyword}-${index}`"
                                color="blue" class="lawyer-keyword-tag" :title="keyword">
                                {{ truncateKeyword(keyword) }}
                            </a-tag>
                            <a-tag v-if="text.length > 3" color="blue" class="lawyer-keyword-tag lawyer-keyword-more"
                                :title="`还有${text.length - 3}个关键词：${text
                                    .slice(3)
                                    .join('、')}`">
                                +{{ text.length - 3 }}个
                            </a-tag>
                        </div>
                        <span v-else class="lawyer-text-muted">-</span>
                    </template>

                    <!-- 启用状态列 -->
                    <template slot="enabled" slot-scope="text, record">
                        <a-switch :checked="text === 1" :loading="record.switchLoading"
                            @change="(checked) => toggleEnabled(record, checked)" />
                    </template>

                    <!-- 爬取起始时间列 -->
                    <template slot="crawlStartDate" slot-scope="text">
                        {{ formatTime(text) }}
                    </template>

                    <!-- 创建时间列 -->
                    <template slot="createdTime" slot-scope="text">
                        {{ formatTime(text) }}
                    </template>

                    <!-- 操作列 -->
                    <template slot="action" slot-scope="text, record">
                        <div class="lawyer-action-buttons">
                            <a-button type="link" @click="editConfig(record)">
                                编辑
                            </a-button>
                            <a-button type="link" danger @click="deleteConfig(record)">
                                删除
                            </a-button>
                        </div>
                    </template>
                </a-table>
            </a-card>
        </div>

        <!-- 新增/编辑配置模态框 -->
        <a-modal :title="modalTitle" :visible="modalVisible" width="90%" :confirm-loading="modalLoading" ok-text="确认"
            cancel-text="取消" @ok="handleModalOk" @cancel="handleModalCancel">
            <a-form-model ref="formModel" :model="formData" :rules="formRules" :label-col="{ span: 8 }"
                :wrapper-col="{ span: 16 }">
                <a-row :gutter="24">
                    <!-- 左栏 -->
                    <a-col :span="12">
                        <a-form-model-item label="网站名称" prop="websiteName">
                            <a-input v-model="formData.websiteName" placeholder="请输入网站名称" />
                        </a-form-model-item>

                        <a-form-model-item label="网站代码" prop="websiteCode">
                            <a-input v-model="formData.websiteCode" placeholder="请输入网站代码" />
                        </a-form-model-item>

                        <a-form-model-item label="网站URL" prop="websiteUrl">
                            <a-input v-model="formData.websiteUrl" placeholder="请输入网站URL" />
                        </a-form-model-item>

                        <a-form-model-item label="最大页面限制" prop="maxPageLimit">
                            <a-input-number v-model="formData.maxPageLimit" :min="1" :max="10000"
                                placeholder="请输入最大页面限制" style="width: 100%" />
                        </a-form-model-item>
                        <a-form-model-item label="爬取起始时间" prop="crawlStartDate">
                            <a-date-picker v-model="formData.crawlStartDate" placeholder="请选择爬取起始时间" style="width: 100%"
                                show-time format="YYYY-MM-DD HH:mm:ss" value-format="YYYY-MM-DD HH:mm:ss" />
                        </a-form-model-item>

                    </a-col>

                    <!-- 右栏 -->
                    <a-col :span="12">
                        <a-form-model-item label="关键词" prop="keywords">
                            <a-select v-model="formData.keywords" mode="tags" placeholder="请输入关键词，按回车添加"
                                style="width: 100%" :max-tag-count="3" :max-tag-placeholder="getMaxTagPlaceholder"
                                :max-tag-text-length="8" />
                        </a-form-model-item>
                        <a-form-model-item label="备注" prop="remarks">
                            <a-textarea v-model="formData.remarks" placeholder="请输入备注（可选）" :rows="2" />
                        </a-form-model-item>
                        <a-form-model-item label="搜索模板" prop="searchTemplate">
                            <a-textarea v-model="formData.searchTemplate" placeholder="请输入搜索模板（可选）" :rows="4" />
                        </a-form-model-item>
                        <a-form-model-item label="启用状态" prop="enabled">
                            <a-switch v-model="formData.enabled" checked-children="启用" un-checked-children="禁用" />
                        </a-form-model-item>
                    </a-col>
                </a-row>
            </a-form-model>
        </a-modal>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from "nuxt-property-decorator";
import { formatDate } from "~/utils/date";
import {
    CrawlConfigItem,
    CrawlConfigQueryParams,
    AddCrawlConfigParams,
    UpdateCrawlConfigParams,
    CrawlConfigOperationResponse,
} from "~/model/LawyerConfigModel";
import { FormModel } from 'ant-design-vue'
@Component({ name: "crawl-config-index-component" })
export default class CrawlConfigIndexComponent extends Vue {
    // 数据状态
    configList: CrawlConfigItem[] = [];
    tableLoading: boolean = false;

    // 搜索参数
    searchParams: CrawlConfigQueryParams = {
        websiteCode: "",
        websiteName: "",
        keyword: "",
        enabled: undefined,
        current: 1,
        size: 10,
    };

    // 分页配置
    pagination = {
        current: 1,
        pageSize: 10,
        total: 0,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total: number) => `共 ${total} 条记录`,
    };

    // 模态框状态
    modalVisible = false;
    modalLoading = false;
    editingRecord: CrawlConfigItem | null = null;

    // 表单数据
    formData = {
        websiteName: "",
        websiteCode: "",
        websiteUrl: "",
        maxPageLimit: 100,
        searchTemplate: "",
        keywords: [] as string[],
        remarks: "",
        enabled: true,
        crawlStartDate: null as string | null, // 爬取起始时间
    };

    // 表单验证规则
    formRules = {
        websiteName: [
            { required: true, message: "请输入网站名称", trigger: "blur" },
        ],
        websiteCode: [
            { required: true, message: "请输入网站代码", trigger: "blur" },
        ],
        websiteUrl: [
            { required: true, message: "请输入网站URL", trigger: "blur" },
        ],
        crawlStartDate: [
            { required: true, message: "请选择爬取起始时间", trigger: "change" },
        ],
        maxPageLimit: [
            { required: true, message: "请输入最大页面限制", trigger: "blur" },
            {
                type: "number",
                min: 1,
                max: 10000,
                message: "请输入1-10000之间的数字",
                trigger: "blur",
            },
        ],
    };

    // 表格列配置
    columns = [
        {
            title: "网站代码",
            dataIndex: "websiteCode",
            key: "websiteCode",
            scopedSlots: { customRender: "websiteCode" },
            width: 120,
        },
        {
            title: "网站名称",
            dataIndex: "websiteName",
            key: "websiteName",
            scopedSlots: { customRender: "websiteName" },
            width: 150,
        },
        {
            title: "网站URL",
            dataIndex: "websiteUrl",
            key: "websiteUrl",
            scopedSlots: { customRender: "websiteUrl" },
            ellipsis: true,
        },
        {
            title: "关键词",
            dataIndex: "keywords",
            key: "keywords",
            scopedSlots: { customRender: "keywords" },
            width: 200,
        },
        {
            title: "最大页面限制",
            dataIndex: "maxPageLimit",
            key: "maxPageLimit",
            width: 120,
            align: "center",
        },
        {
            title: "启用状态",
            dataIndex: "enabled",
            key: "enabled",
            scopedSlots: { customRender: "enabled" },
            width: 100,
            align: "center",
        },
        {
            title: "爬取起始时间",
            dataIndex: "crawlStartDate",
            key: "crawlStartDate",
            scopedSlots: { customRender: "crawlStartDate" },
            width: 160,
        },
        {
            title: "创建人",
            dataIndex: "createdBy",
            key: "createdBy",
            width: 100,
        },
        {
            title: "创建时间",
            dataIndex: "createdTime",
            key: "createdTime",
            scopedSlots: { customRender: "createdTime" },
            width: 160,
        },
        {
            title: "操作",
            key: "action",
            scopedSlots: { customRender: "action" },
            width: 120,
            align: "center",
        },
    ];

    get modalTitle(): string {
        return this.editingRecord ? "编辑配置" : "新增配置";
    }

    // 组件挂载时加载数据
    async mounted(): Promise<void> {
        await this.loadConfigList();
    }

    // 加载配置列表
    async loadConfigList(): Promise<void> {
        this.tableLoading = true;
        try {
            const params: CrawlConfigQueryParams = {
                current: this.pagination.current,
                size: this.pagination.pageSize,
                websiteCode: this.searchParams.websiteCode || undefined,
                websiteName: this.searchParams.websiteName || undefined,
                enabled: this.searchParams.enabled,
            };

            // 如果有关键词搜索，添加到参数中
            if (this.searchParams.keyword) {
                params.keyword = this.searchParams.keyword;
            }

            const response = await this.$roadLawyerService.getCrawlConfigList(params);

            if (response.success && response.data) {
                this.configList = response.data.records.map((item: CrawlConfigItem) => ({
                    ...item,
                    switchLoading: false, // 添加开关加载状态
                }));
                this.pagination.total = response.data.total;
                this.pagination.current = response.data.current;
            } else {
                this.$message.error(response.message || "加载配置列表失败");
                this.configList = [];
                this.pagination.total = 0;
            }
        } catch (error) {
            console.error("加载配置列表失败:", error);
            this.$message.error("加载配置列表失败，请刷新页面重试");
            this.configList = [];
            this.pagination.total = 0;
        } finally {
            this.tableLoading = false;
        }
    }

    // 搜索
    async onSearch(): Promise<void> {
        this.pagination.current = 1;
        await this.loadConfigList();
    }

    // 重置搜索条件
    onReset(): void {
        this.searchParams = {
            websiteCode: "",
            websiteName: "",
            keyword: "",
            enabled: undefined,
            current: 1,
            size: 10,
        };
        this.pagination.current = 1;
        this.loadConfigList();
    }

    // 表格变化处理
    async handleTableChange(pagination: { current: number; pageSize: number }): Promise<void> {
        this.pagination.current = pagination.current;
        this.pagination.pageSize = pagination.pageSize;
        await this.loadConfigList();
    }

    // 显示新增模态框
    showAddModal(): void {
        this.editingRecord = null;
        this.modalVisible = true;
        // 重置表单数据
        this.formData = {
            websiteName: "",
            websiteCode: "",
            websiteUrl: "",
            maxPageLimit: 100,
            searchTemplate: "",
            keywords: [],
            remarks: "",
            enabled: true,
            crawlStartDate: null as string | null,
        };
        this.$nextTick(() => {
            const formRef = this.$refs.formModel as FormModel;
            if (formRef && formRef.clearValidate) {
                formRef.clearValidate([]);
            }
        });
    }

    // 编辑配置
    editConfig(record: CrawlConfigItem): void {
        this.editingRecord = record;
        this.modalVisible = true;
        // 设置表单数据
        this.formData = {
            websiteName: record.websiteName,
            websiteCode: record.websiteCode,
            websiteUrl: record.websiteUrl,
            maxPageLimit: record.maxPageLimit,
            searchTemplate: record.searchTemplate || "",
            keywords: record.keywords || [],
            remarks: record.remarks || "",
            enabled: record.enabled === 1,
            crawlStartDate: record.crawlStartDate || null,
        };
        this.$nextTick(() => {
            const formRef = this.$refs.formModel as FormModel;
            if (formRef && formRef.clearValidate) {
                formRef.clearValidate([]);
            }
        });
    }

    // 切换启用状态
    async toggleEnabled(
        record: CrawlConfigItem,
        checked: boolean
    ): Promise<void> {
        // 设置开关加载状态
        this.$set(record, "switchLoading", true);

        try {
            const params: UpdateCrawlConfigParams = {
                ...record,
                enabled: checked ? 1 : 0,
            };

            const response = await this.$roadLawyerService.updateCrawlConfig(params);

            if (response.success) {
                record.enabled = checked ? 1 : 0;
                this.$message.success(`已${checked ? "启用" : "禁用"}配置`);
            } else {
                this.$message.error(response.message || "操作失败");
            }
        } catch (error) {
            console.error("切换状态失败:", error);
            this.$message.error("操作失败，请重试");
        } finally {
            this.$set(record, "switchLoading", false);
        }
    }

    // 删除配置
    deleteConfig(record: CrawlConfigItem): void {
        this.$confirm({
            title: "确认删除",
            content: `确定要删除配置"${record.websiteName}"吗？此操作不可撤销。`,
            okText: "确认删除",
            okType: "danger",
            cancelText: "取消",
            onOk: async () => {
                try {
                    const response = await this.$roadLawyerService.deleteCrawlConfig({
                        id: record.id,
                    });

                    if (response.success) {
                        this.$message.success("删除成功");
                        await this.loadConfigList();
                    } else {
                        this.$message.error(response.message || "删除失败");
                    }
                } catch (error) {
                    console.error("删除配置失败:", error);
                    this.$message.error("删除失败，请重试");
                }
            },
        });
    }

    // 模态框确认
    async handleModalOk(): Promise<void> {
        try {
            // 验证表单
            const formRef = this.$refs.formModel as FormModel;
            if (!formRef) {
                throw new Error("表单引用无效");
            }
            await formRef.validate();
            this.modalLoading = true;

            const params = {
                websiteName: this.formData.websiteName,
                websiteCode: this.formData.websiteCode,
                websiteUrl: this.formData.websiteUrl,
                maxPageLimit: this.formData.maxPageLimit,
                searchTemplate: this.formData.searchTemplate || "",
                keywords: this.formData.keywords || [],
                remarks: this.formData.remarks || "",
                enabled: this.formData.enabled ? 1 : 0,
                crawlStartDate: this.formData.crawlStartDate || undefined,
            };
            let response: CrawlConfigOperationResponse;
            if (this.editingRecord) {
                // 编辑
                response = await this.$roadLawyerService.updateCrawlConfig({
                    ...params,
                    id: this.editingRecord.id,
                });
            } else {
                // 新增
                response = await this.$roadLawyerService.addCrawlConfig(
                    params as AddCrawlConfigParams
                );
            }

            if (response.success) {
                this.$message.success(this.editingRecord ? "编辑成功" : "新增成功");
                this.modalVisible = false;
                await this.loadConfigList();
            } else {
                this.$message.error(response.message || "操作失败");
            }
        } catch (error) {
            console.error("保存配置失败:", error);
            this.$message.error("操作失败，请重试");
        } finally {
            this.modalLoading = false;
        }
    }

    // 模态框取消
    handleModalCancel(): void {
        this.modalVisible = false;
        this.editingRecord = null;
    }

    // 格式化时间
    formatTime(timeStr: string): string {
        if (!timeStr) {
            return "-";
        }
        return formatDate(timeStr, "yyyy-MM-dd hh:mm:ss");
    }

    // 多选标签超出时的占位符
    getMaxTagPlaceholder(omittedValues: string[]): string {
        return `+${omittedValues.length}个关键词`;
    }

    // 获取要显示的关键词（前3个）
    getDisplayKeywords(keywords: string[]): string[] {
        return keywords.slice(0, 3);
    }

    // 截断关键词文本
    truncateKeyword(keyword: string): string {
        if (!keyword) return '';
        const maxLength = 8;
        return keyword.length > maxLength
            ? keyword.substring(0, maxLength) + "..."
            : keyword;
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

.lawyer-table-card {
    .ant-table-wrapper {
        .ant-table-tbody>tr>td {
            padding: 12px 16px;
        }
    }
}

.lawyer-table-title {
    font-weight: 500;
    font-size: 14px;
    margin-bottom: 4px;
}

.lawyer-table-subtitle {
    font-size: 12px;
    color: #999;
}

.lawyer-action-buttons {
    display: flex;
    gap: 8px;
    justify-content: center;

    .ant-btn-link {
        padding: 0;
    }
}

.lawyer-text-muted {
    color: #999;
    font-style: italic;
}

/* 关键词容器样式 */
.lawyer-keywords-container {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    align-items: center;
}

.lawyer-keyword-tag {
    margin: 0 !important;
    cursor: default;

    &.lawyer-keyword-more {
        cursor: help;
    }
}
</style>
