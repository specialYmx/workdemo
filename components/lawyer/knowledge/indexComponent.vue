<template>
    <div class="knowledge-page-wrapper">
        <div>
            <!-- 整体内容容器 -->
            <div class="lawyer-content-wrapper">
                <!-- 搜索区域 -->
                <section>
                    <h1>法规与文件大家智库</h1>
                    <p>
                        搜索和浏览法律法规、政策文件、典型案例和解读材料，获取最新的合规信息和专业指导。
                    </p>

                    <div class="lawyer-search-form">
                        <a-input v-model="searchText" placeholder="输入关键词搜索法规、案例、解读..." size="large"
                            class="lawyer-search-input" :allow-clear="true" @keyup.enter="onSearch"
                            @change="onSearchInputChange" />
                        <a-button v-for="(btn, index) in searchButtons" :key="index"
                            :type="btn.isActive ? 'primary' : btn.type || 'default'" :icon="btn.icon" size="large"
                            :loading="btn.loading" :class="{ 'lawyer-btn-active': btn.isActive }" @click="btn.handler">
                            {{ btn.text }}{{ btn.count ? ` (${btn.count})` : "" }}
                        </a-button>
                    </div>

                    <!-- 高级筛选选项 -->
                    <div v-show="isAdvancedSearchVisible" class="lawyer-filter-options">
                        <!-- 时效性选择器 -->
                        <div class="lawyer-filter-group">
                            <a-select v-model="timelinessFilter" style="width: 100%" placeholder="时效性"
                                @change="onFilterChange">
                                <a-select-option v-for="option in timeLinessOptions" :key="option.value"
                                    :value="option.value">
                                    {{ option.label }}
                                </a-select-option>
                            </a-select>
                        </div>
                        <!-- 效力位阶选择器 -->
                        <div class="lawyer-filter-group">
                            <a-select v-model="effectivenessLevelFilter" style="width: 100%" placeholder="效力位阶"
                                @change="onFilterChange">
                                <a-select-option v-for="option in effectivenessLevelOptions" :key="option.value"
                                    :value="option.value">
                                    {{ option.label }}
                                </a-select-option>
                            </a-select>
                        </div>
                        <!-- 专题分类级联选择器 -->
                        <div class="lawyer-filter-group">
                            <a-cascader v-model="topicCategory" :options="topicCategoryOptions" placeholder="专题分类"
                                style="width: 100%" :show-search="true" @change="onFilterChange" />
                        </div>
                        <!-- 来源筛选 -->
                        <div class="lawyer-filter-group">
                            <a-select v-model="filterSource" style="width: 100%" placeholder="全部来源"
                                @change="onFilterChange">
                                <a-select-option value="all">
                                    全部来源
                                </a-select-option>
                                <a-select-option v-for="option in websiteOptions" :key="option.value"
                                    :value="option.value">
                                    {{ option.label }}
                                </a-select-option>
                            </a-select>
                        </div>
                        <!-- 发布时间筛选 -->
                        <div class="lawyer-filter-group">
                            <a-date-picker v-model="publishDate" style="width: 100%" placeholder="发布时间"
                                format="YYYY-MM-DD" value-format="YYYY-MM-DD" :allow-clear="true"
                                @change="onFilterChange" />
                        </div>
                        <!-- 排序方式 -->
                        <div class="lawyer-filter-group">
                            <a-select v-model="sortOrder" style="width: 100%" placeholder="排序方式"
                                @change="onFilterChange">
                                <a-select-option value="desc">
                                    按发布日期 (新→旧)
                                </a-select-option>
                                <a-select-option value="asc">
                                    按发布日期 (旧→新)
                                </a-select-option>
                            </a-select>
                        </div>
                    </div>
                </section>

                <!-- 加载中 -->
                <div v-if="listLoading" class="lawyer-loading-overlay">
                    <a-spin size="large" />
                    <h3>正在努力加载中...</h3>
                    <p>请稍候，我们正在为您检索信息。</p>
                </div>

                <!-- 无结果提示 -->
                <div v-if="!listLoading && !allDocuments.length" class="lawyer-no-results">
                    <h3>未能找到相关结果</h3>
                    <p>请尝试调整您的搜索关键词或筛选条件。</p>
                </div>

                <!-- 文档列表 -->
                <div v-if="!listLoading && allDocuments.length" class="lawyer-document-list">
                    <div v-for="doc in paginatedDocuments" :key="doc.id" class="lawyer-document-item">
                        <div class="lawyer-document-item-content">
                            <div class="lawyer-document-icon">
                                📄
                            </div>
                            <div class="lawyer-document-main-content">
                                <div class="lawyer-document-header">
                                    <h3 class="lawyer-document-title">
                                        {{ doc.ruleName }}
                                    </h3>
                                    <div class="lawyer-document-meta">
                                        <span><a-icon type="calendar" /> {{ doc.publishDateStr }}</span>
                                        <span><a-icon type="bank" /> {{ doc.legalSource }}</span>
                                        <span><a-icon type="eye" /> {{ doc.readCount }} 阅读</span>
                                        <span class="lawyer-timeliness-tag">
                                            <a-icon type="clock-circle" /> {{ doc.timeLiness }}
                                        </span>
                                    </div>
                                </div>
                                <p class="lawyer-document-summary">
                                    {{ doc.fileContent || "暂无摘要" }}
                                </p>
                                <div class="lawyer-document-footer">
                                    <div class="lawyer-document-tags">
                                        <a-tag :color="getTagColor(doc.categoryMain, 'main')">
                                            {{
                                                doc.categoryMain
                                            }}
                                        </a-tag>
                                        <a-tag v-if="doc.categorySub" :color="getTagColor(doc.categorySub, 'sub')">
                                            {{ doc.categorySub }}
                                        </a-tag>
                                    </div>
                                    <div class="lawyer-document-actions">
                                        <a-button v-for="(action, index) in getDocActions(doc)" :key="index"
                                            :type="action.type || 'default'" :class="action.class"
                                            @click="action.handler">
                                            {{ action.text }}
                                        </a-button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 分页 -->
                    <div v-if="allDocuments.length" class="lawyer-pagination">
                        <a-pagination :current="currentPage" :total="totalDocuments" :page-size="pageSize"
                            show-size-changer show-quick-jumper :show-total="(total, range) =>
                                    `共 ${total} 条记录，显示第 ${range[0]}-${range[1]} 条`
                                " @change="onPageChange" @showSizeChange="onShowSizeChange" />
                    </div>
                </div>
            </div>

            <!-- 文件上传组件 -->
            <lawyer-common-file-upload-modal :visible="uploadModalVisible" :title="`更新文档: ${currentUploadDocTitle}`"
                :document-id="currentUploadDocId" :document-title="currentUploadDocTitle" :config="uploadConfig"
                @cancel="handleUploadCancel" @complete="handleUploadComplete" @upload-success="handleUploadSuccess" />
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'
import {
    KnowledgeDataItem,
    SearchButton,
    WebsiteOption,
    FilterOption,
    DocumentAction,
    KnowledgeUploadConfig,
    CascaderOption,
    RouteQuery,
    RuleSourceQueryParams
} from '@/model/LawyerModel'
import { cascaderOptions } from '@/enum/Lawyer'

import { downloadFileWithMessage } from '~/utils/personal'

@Component({ name: 'lawyer-knowledge-index-component' })
export default class LawyerKnowledgeIndexComponent extends Vue {
    searchText: string = '';
    searchLoading: boolean = false;
    filterSource: string = 'all';
    sortOrder: string = 'desc';
    topicCategory: string[] = [];
    timelinessFilter: string = 'all';
    effectivenessLevelFilter: string = 'all';
    publishDate: string | null = null;
    isFavoritesMode: boolean = false;
    isAdvancedSearchVisible: boolean = false;
    listLoading: boolean = true;
    currentPage: number = 1;
    pageSize: number = 10;
    totalDocuments: number = 0;
    allDocuments: KnowledgeDataItem[] = []; // 存储所有数据用于前端分页
    websiteOptions: WebsiteOption[] = [];
    uploadModalVisible: boolean = false;
    currentUploadDocId: string = '';
    currentUploadDocTitle: string = '';

    get uploadConfig(): KnowledgeUploadConfig {
        return {
            multiple: false,
            acceptTypes: '.doc,.docx',
            maxFileSize: 500 * 1024 * 1024,
            maxFileCount: 1,
            uploadText: '点击或拖拽文件到此区域上传',
            hintText: '仅支持 DOC、DOCX 格式，文件大小不超过 500MB',
            autoUpload: false
        }
    }

    get searchButtons(): SearchButton[] {
        return [
            {
                text: '搜索',
                icon: 'search',
                type: 'primary',
                loading: this.searchLoading,
                isActive: false,
                handler: this.onSearch
            },
            {
                text: '精确搜索',
                icon: 'search',
                type: 'default',
                loading: this.searchLoading,
                isActive: false,
                handler: this.onExactSearch
            },
            {
                text: '我的收藏',
                icon: 'star',
                isActive: this.isFavoritesMode,
                handler: this.toggleFavorites
            },
            {
                text: this.isAdvancedSearchVisible ? '收起筛选' : '高级筛选',
                icon: 'filter',
                isActive: this.isAdvancedSearchVisible,
                handler: this.toggleAdvancedSearch
            }
        ]
    }

    get paginatedDocuments(): KnowledgeDataItem[] {
        // 前端分页：计算当前页应该显示的数据
        const start: number = (this.currentPage - 1) * this.pageSize
        const end: number = start + this.pageSize
        return this.allDocuments.slice(start, end)
    }

    get topicCategoryOptions(): CascaderOption[] {
        return cascaderOptions
    }

    get timeLinessOptions(): FilterOption[] {
        return [
            { value: 'all', label: '全部' },
            { value: '待生效', label: '待生效' },
            { value: '已生效', label: '已生效' },
            { value: '已修订', label: '已修订' },
            { value: '已废止', label: '已废止' }
        ]
    }

    get effectivenessLevelOptions(): FilterOption[] {
        return [
            { value: 'all', label: '全部' },
            { value: '法律法规', label: '法律法规' },
            { value: '部门规章规范性文件', label: '部门规章规范性文件' },
            { value: '自律规则', label: '自律规则' },
            { value: '其他', label: '其他' }
        ]
    }

    async mounted(): Promise<void> {
        await this.loadWebsiteOptions()
        this.loadDocuments()
    }

    isDocumentFavorite(doc: KnowledgeDataItem): boolean {
        return doc.isCollect || false
    }

    async onSearch(): Promise<void> {
        this.searchLoading = true
        try {
            await this.loadDocuments('normal')
        } catch (error) {
            console.error('搜索失败:', error)
        } finally {
            this.searchLoading = false
        }
    }

    async onExactSearch(): Promise<void> {
        this.searchLoading = true
        try {
            await this.loadDocuments('exact')
        } catch (error) {
            console.error('精确搜索失败:', error)
        } finally {
            this.searchLoading = false
        }
    }

    async onFilterChange(): Promise<void> {
        // 筛选器变化时使用默认搜索（普通搜索）
        await this.loadDocuments('default')
    }

    onSearchInputChange(e: Event): void {
        // 类型安全检查
        if (!(e.target instanceof HTMLInputElement)) { return }

        const target = e.target
        // 当输入框被清空时（用户点击清空按钮或手动删除所有内容）
        if (!target.value.trim()) {
            this.searchText = ''
            // 自动执行搜索以显示所有结果
            this.loadDocuments('default')
        }
    }

    async toggleFavorites(): Promise<void> {
        this.isFavoritesMode = !this.isFavoritesMode
        this.currentPage = 1
        await this.loadDocuments()
        this.$message.info(
            this.isFavoritesMode ? '已切换至收藏夹' : '已退出收藏夹模式'
        )
    }

    toggleAdvancedSearch(): void {
        this.isAdvancedSearchVisible = !this.isAdvancedSearchVisible
    }

    getDocActions(doc: KnowledgeDataItem): DocumentAction[] {
        const isFavorite: boolean = this.isDocumentFavorite(doc)
        const actions: DocumentAction[] = [
            {
                text: '查看',
                type: 'primary',
                handler: () => this.viewDocument(doc)
            },
            {
                text: '下载',
                handler: () => this.downloadDocument(doc)
            }
        ]

        // 只有在非收藏模式下才显示收藏按钮
        if (!this.isFavoritesMode) {
            actions.push({
                type: isFavorite ? 'primary' : 'default',
                text: isFavorite ? '取消收藏' : '收藏',
                handler: () => this.collectDocument(doc)
            })
        }

        actions.push(
            {
                text: '上传更新',
                class: 'lawyer-btn-upload',
                handler: () => this.uploadDocument(doc.id, doc.ruleName)
            },
            {
                text: '移除',
                type: 'danger',
                handler: () => this.removeDocument(doc)
            }
        )

        return actions
    }

    viewDocument(doc: KnowledgeDataItem): void {
        this.$message.info(`正在打开: ${doc.ruleName}`)
        const isRevoke: boolean = !!(doc.revokeDateTimestamp || doc.revokeDateStr)
        const query: RouteQuery = {
            id: doc.id,
            pageTitle: doc.ruleName,
            ...(isRevoke ? { isRevoke: 'true' } : {})
        }
        this.$router.push({
            path: '/lawyerKnowledge/detail',
            query
        })
    }

    async downloadDocument(doc: KnowledgeDataItem): Promise<void> {
        let hideLoading = null
        try {
            hideLoading = this.$message.loading(`正在准备下载: ${doc.ruleName}`, 0)

            const result = await this.$roadLawyerService.downloadRuleFile({
                searchId: doc.id
            })

            hideLoading()

            downloadFileWithMessage(result, {
                fileName: `${doc.ruleName}.docx`,
                showMessage: true,
                messageService: this.$message
            })
        } catch (error) {
            if (hideLoading) {
                hideLoading()
            }
            console.error('下载失败:', error)
            this.$message.error('下载失败，请检查网络连接后重试')
        }
    }

    async collectDocument(doc: KnowledgeDataItem): Promise<void> {
        const isCurrentlyFavorite: boolean = this.isDocumentFavorite(doc)
        const newCollectStatus: boolean = !isCurrentlyFavorite
        doc.isCollect = newCollectStatus

        try {
            const params = {
                searchId: doc.id,
                empId: this.$store.state.auth.id,
                isCollect: newCollectStatus
            }
            const success = await this.$roadLawyerService.saveOrCancelCollect(params)
            if (success) {
                if (newCollectStatus) {
                    this.$message.success(`已收藏: ${doc.ruleName}`)
                } else {
                    this.$message.info(`已取消收藏: ${doc.ruleName}`)
                    if (this.isFavoritesMode) {
                        const index: number = this.allDocuments.findIndex(
                            (item: KnowledgeDataItem) => item.id === doc.id
                        )
                        if (index !== -1) {
                            this.allDocuments.splice(index, 1)
                            this.totalDocuments = this.allDocuments.length
                        }
                    }
                }
            } else {
                doc.isCollect = isCurrentlyFavorite
                this.$message.error('操作失败，请重试')
            }
        } catch (error) {
            doc.isCollect = isCurrentlyFavorite
            console.error('收藏操作失败:', error)
            this.$message.error('操作失败，请重试')
        }
    }

    uploadDocument(docId: string, docTitle: string): void {
        this.uploadModalVisible = true
        this.currentUploadDocId = docId
        this.currentUploadDocTitle = docTitle
    }

    handleUploadCancel(): void {
        this.uploadModalVisible = false
        this.currentUploadDocId = ''
        this.currentUploadDocTitle = ''
    }

    handleUploadComplete(): void {
        this.uploadModalVisible = false
        this.currentUploadDocId = ''
        this.currentUploadDocTitle = ''
    }

    handleUploadSuccess(data: any): void {
        this.loadDocuments()
    }

    removeDocument(doc: KnowledgeDataItem): void {
        this.$confirm({
            title: '确定要移除文档吗？',
            content: `文档"${doc.ruleName}"将被移除，此操作不可撤销。`,
            okText: '确认',
            cancelText: '取消',
            onOk: async () => {
                try {
                    const success = await this.$roadLawyerService.deleteRuleSource({
                        id: doc.id
                    })
                    if (success) {
                        this.$message.success(`文档"${doc.ruleName}"已移除`)
                        setTimeout(async () => {
                            await this.loadDocuments()
                        }, 500)
                    } else {
                        this.$message.error('删除失败，请重试')
                    }
                } catch (error) {
                    console.error('删除文档失败:', error)
                    this.$message.error('删除失败，请重试')
                }
            }
        })
    }

    onPageChange(page: number): void {
        this.currentPage = page
        // 前端分页，不需要重新请求API
    }

    onShowSizeChange(current: number, pageSize: number): void {
        this.pageSize = pageSize
        this.currentPage = 1
        // 前端分页，不需要重新请求API
    }

    getTagColor(category: string, type: string = 'main'): string {
        if (!category) { return 'blue' }
        return type === 'main' ? 'gold' : 'blue'
    }

    async loadWebsiteOptions(): Promise<void> {
        try {
            const websiteRatioData = await this.$roadLawyerService.getWebSiteRatio()
            if (websiteRatioData && typeof websiteRatioData === 'object') {
                this.websiteOptions = Object.keys(websiteRatioData).map(
                    (key: string): WebsiteOption => ({
                        value: key,
                        label: key
                    })
                )
            }
        } catch (error) {
            console.error('加载网站来源数据失败:', error)
            this.websiteOptions = []
        }
    }

    async loadDocuments(
        searchType: 'normal' | 'exact' | 'default' = 'default'
    ): Promise<void> {
        this.listLoading = true
        try {
            const params: RuleSourceQueryParams = {
                empId: this.$store.state.auth.id
            }

            // 根据搜索类型设置不同的参数
            if (this.searchText) {
                if (searchType === 'exact') {
                    // 精确搜索：使用 keyWord 参数，不传 query
                    params.keyWord = this.searchText
                } else {
                    // 普通搜索或默认：使用 query 参数，不传 keyWord
                    params.query = this.searchText
                }
            }
            if (this.timelinessFilter && this.timelinessFilter !== 'all') {
                params.timeLiness = this.timelinessFilter
            }
            if (
                this.effectivenessLevelFilter &&
                this.effectivenessLevelFilter !== 'all'
            ) {
                params.effectivenessLevel = this.effectivenessLevelFilter
            }
            if (this.topicCategory && this.topicCategory.length > 0) {
                params.categoryMain = this.topicCategory[0]
            }
            if (this.topicCategory && this.topicCategory.length > 1) {
                params.categorySub = this.topicCategory[1]
            }
            if (this.filterSource && this.filterSource !== 'all') {
                params.legalSource = this.filterSource
            }
            if (this.sortOrder) {
                params.publishDateSort = this.sortOrder
            }
            if (this.publishDate) {
                // 处理发布时间筛选
                params.publishDateStr = this.publishDate
            }

            let result: KnowledgeDataItem[]
            if (this.isFavoritesMode) {
                const collectParams = {
                    empId: this.$store.state.auth.id
                }
                result = await this.$roadLawyerService.getRuleSourceCollect(
                    collectParams
                )
            } else {
                result = await this.$roadLawyerService.getRuleSourceList(params)
            }

            if (result && Array.isArray(result)) {
                this.allDocuments = result
                this.totalDocuments = result.length
                // 重置到第一页
                this.currentPage = 1
            } else {
                this.allDocuments = []
                this.totalDocuments = 0
            }
        } catch (error) {
            console.error('加载文档数据失败', error)
            this.$message.error('加载数据失败，请刷新页面重试')
            this.allDocuments = []
            this.totalDocuments = 0
        } finally {
            this.listLoading = false
        }
    }
}
</script>

<style lang="less">
@import "~/assets/styles/lawyer.less";

.knowledge-page-wrapper {
    background-color: var(--lawyer-background);
    padding: 20px;

    .lawyer-content-wrapper {
        padding: 20px;
        border-radius: 8px;
        border: 1px solid var(--lawyer-border);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        margin-bottom: 24px;
        background-color: var(--lawyer-surface);
    }

    .lawyer-search-form {
        display: flex;
        gap: 12px;
        align-items: center;
        margin-bottom: 24px;

        .lawyer-search-input {
            flex: 1;
            min-width: 300px;
        }

        .lawyer-search-form .ant-btn {
            flex-shrink: 0;

            &.lawyer-btn-active {
                background-color: var(--lawyer-primary);
                color: white;
                border-color: var(--lawyer-primary);
            }
        }
    }

    .lawyer-filter-options {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
        margin-bottom: 24px;

        .lawyer-filter-group {
            flex: 1;
            flex-basis: 200px;
        }
    }

    .lawyer-loading-overlay,
    .lawyer-no-results {
        text-align: center;
        padding: 32px;
        color: var(--lawyer-text-light);
        border-radius: 8px;
        border: 1px solid var(--lawyer-border);
        margin-top: 32px;

        h3 {
            font-size: 20px;
            color: var(--lawyer-text);
            margin-bottom: 12px;
            font-weight: 500;
        }
    }

    .lawyer-document-list {
        display: flex;
        flex-direction: column;
        gap: 24px;
        margin-bottom: 32px;
    }

    .lawyer-document-item {
        padding: 24px;
        border-radius: 8px;
        border: 1px solid var(--lawyer-border);
        transition: background-color 0.2s ease, box-shadow 0.2s ease;

        &:hover {
            background-color: rgba(var(--lawyer-primary-rgb), 0.03);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        &-content {
            display: flex;
            gap: 20px;
            align-items: flex-start;
        }
    }

    .lawyer-document-icon {
        width: 40px;
        height: 40px;
        background: rgba(var(--lawyer-primary-rgb), 0.1);
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        color: var(--lawyer-primary);
        flex-shrink: 0;
    }

    .lawyer-document-main-content {
        flex: 1;
        min-width: 0;
    }

    .lawyer-document {
        &-header {
            margin-bottom: 12px;
        }

        &-title {
            font-size: 18px;
            font-weight: 500;
            color: var(--lawyer-text);
            margin-bottom: 8px;
            line-height: 1.4;

            a {
                text-decoration: none;
                color: inherit;
                transition: color 0.2s ease;

                &:hover {
                    color: var(--lawyer-primary-dark);
                }
            }
        }

        &-meta {
            font-size: 13px;
            color: var(--lawyer-text-light);
            display: flex;
            flex-wrap: wrap;
            gap: 8px 16px;
            margin-bottom: 12px;

            .lawyer-document-meta .anticon {
                margin-right: 6px;
            }
        }

        &-summary {
            color: var(--lawyer-text-light);
            line-height: 1.6;
            margin-bottom: 16px;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        &-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            flex-wrap: wrap;
            margin-top: 8px;
        }

        &-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            flex: 1;
        }

        &-actions {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;

            .lawyer-document-actions .ant-btn .anticon {
                font-size: 12px;
            }
        }
    }

    .lawyer-pagination {
        display: flex;
        justify-content: center;
        padding: 32px 0;
    }
}
</style>
