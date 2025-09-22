<template>
    <div class="knowledge-page-wrapper">
        <div>
            <!-- 整体内容容器 -->
            <div class="lawyer-content-wrapper">
                <!-- 搜索和筛选区域 -->
                <lawyer-knowledge-filter-options :category-name="categoryName" :search-text.sync="searchText"
                    :search-buttons="searchButtons" :timeliness-filter.sync="timelinessFilter"
                    :effectiveness-level-filter.sync="effectivenessLevelFilter" :topic-category.sync="topicCategory"
                    :filter-source.sync="filterSource" :publish-date.sync="publishDate" :sort-order.sync="sortOrder"
                    :document-number-filter.sync="documentNumberFilter" :department-filter.sync="departmentFilter"
                    :is-appendix-filter.sync="isAppendixFilter" :website-options="websiteOptions"
                    :topic-category-options="topicCategoryOptions" :department-options="departmentOptions"
                    @search="onExactSearch" @show-add-document-modal="showAddDocumentModal"
                    @filter-change="onFilterChange" :isAdmin="isAdmin" />

                <!-- 文档列表 -->
                <lawyer-knowledge-document-list :loading="listLoading" :documents="allDocuments"
                    :current-page="currentPage" :total-documents="totalDocuments" :page-size="pageSize"
                    :doc-actions="documentActions" @page-change="onPageChange" @show-size-change="onShowSizeChange"
                    @document-action="handleDocumentAction" />
            </div>

            <!-- 文档上传组件 -->
            <lawyer-common-file-upload-modal :visible="uploadModalVisible" :title="uploadModalTitle"
                :document-id="currentUploadDocId" :document-title="currentUploadDocTitle" :category-name="categoryName"
                :time-liness-options="timelinessOptions" :website-options="websiteOptions"
                :category-options="topicCategoryOptions" :department-options="departmentOptions"
                :document-data="currentDocumentData" :config="uploadConfig" @cancel="handleUploadCancel"
                @complete="handleUploadComplete" @upload-success="handleUploadSuccess" />
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
    RuleSourceQueryParams,
    LegalCategoryItem,
    DepartmentOption
} from '~/model/LawyerModel'

import { downloadFileWithMessage } from '~/utils/personal'

@Component({ name: 'lawyer-knowledge-index-component' })
export default class LawyerKnowledgeIndexComponent extends Vue {
    searchText: string = '';
    searchLoading: boolean = false;
    filterSource: string = '';
    sortOrder: string = 'desc';
    topicCategory: string[] = [];
    timelinessFilter: string = '';
    effectivenessLevelFilter: string = '';
    publishDate: string | null = "";
    isFavoritesMode: boolean = false;
    // 新增筛选条件
    isAppendixFilter: boolean = false;
    documentNumberFilter: string = '';
    departmentFilter: string = '';
    listLoading: boolean = true;
    currentPage: number = 1;
    pageSize: number = 10;
    totalDocuments: number = 0;
    allDocuments: KnowledgeDataItem[] = []; // 当前页数据
    websiteOptions: WebsiteOption[] = [];
    uploadModalVisible: boolean = false;
    currentUploadDocId: string = '';
    currentUploadDocTitle: string = '';
    currentDocumentData: any = {}; // 当前文档数据，用于回显
    isAdmin: boolean = false;
    categoryData: LegalCategoryItem[] = []; // 存储从接口获取的分类数据
    isAddMode: boolean = false; // 是否为新增模式
    departmentOptions: DepartmentOption[] = []; // 存储部门数据

    get uploadConfig(): KnowledgeUploadConfig {
        const isInstitutionLibrary = this.$route.path.includes('/institutionLibrary')

        return {
            multiple: false,
            maxFileSize: 500 * 1024 * 1024,
            maxFileCount: 1,
            autoUpload: false,
            acceptTypes: isInstitutionLibrary ? '.pdf' : '.doc,.docx',
            uploadText: '点击或拖拽文件到此区域上传',
            hintText: `仅支持 ${isInstitutionLibrary ? 'PDF' : 'DOC、DOCX'} 格式，文件大小不超过 500MB`
        }
    }

    get uploadModalTitle(): string {
        return this.isAddMode ? '新增文档' : `更新文档: ${this.currentUploadDocTitle}`
    }

    get categoryName(): string {
        // 根据路由获取分类名称，用于显示
        const routePath = this.$route.path

        // 路由路径与分类名称的映射
        const routeMap: Record<string, string> = {
            '/lawyerKnowledge': '大家智库',
            '/regulationCompilation': '法规汇编',
            '/punishmentCompilation': '处罚汇编',
            '/researchCollection': '研究集锦',
            '/legalComplianceQuarterly': '法律合规季刊',
            '/newRegulationInterpretation': '新规解读',
            '/institutionLibrary': '内部制度库', // 企业内部管理制度和规范文件
            '/policyLibrary': '政策库',
            '/caseLibrary': '案例库'
        }

        // 精确匹配路由路径
        if (routeMap[routePath] || routeMap[routePath.replace(/\/$/, '')]) {
            return routeMap[routePath] || routeMap[routePath.replace(/\/$/, '')]
        }

        // 模糊匹配（包含路径）
        for (const [path, name] of Object.entries(routeMap)) {
            if (routePath.includes(path)) {
                return name
            }
        }

        // 默认返回
        return '大家智库'
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
            }
        ]
    }



    get topicCategoryOptions(): CascaderOption[] {
        return this.convertToCascaderOptions(this.categoryData)
    }

    get documentActions(): Record<string, DocumentAction[]> {
        const actions: Record<string, DocumentAction[]> = {}
        this.allDocuments.forEach(doc => {
            actions[doc.id] = this.getDocActions(doc)
        })
        return actions
    }

    get timelinessOptions(): FilterOption[] {
        return [
            { value: '待生效', label: '待生效' },
            { value: '已施行', label: '已施行' },
            { value: '已修订', label: '已修订' },
            { value: '已废止', label: '已废止' }
        ]
    }

    async mounted(): Promise<void> {
        await this.checkAdminPermission()
        await this.loadWebsiteOptions()
        await this.loadLegalCategory()
        await this.loadDepartmentData()
        this.loadDocuments()
    }

    async checkAdminPermission(): Promise<void> {
        try {
            this.isAdmin = await this.$roadLawyerService.getAdmin({
                empId: this.$store.state.auth.id
            })
        } catch (error) {
            console.error('检查管理员权限失败:', error)
            this.isAdmin = false
        }
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
            this.currentPage = 1
            await this.loadDocuments('exact')
        } catch (error) {
            console.error('精确搜索失败:', error)
        } finally {
            this.searchLoading = false
        }
    }

    async onFilterChange(): Promise<void> {
        this.currentPage = 1
        await this.loadDocuments('exact')
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

        // 只有管理员才能看到上传更新和移除按钮
        // if (this.isAdmin) {
        actions.push(
            {
                text: '上传更新',
                class: 'lawyer-btn-upload',
                handler: () => this.uploadDocument(doc.id, doc.ruleName, doc)
            },
            {
                text: '移除',
                type: 'danger',
                handler: () => this.removeDocument(doc)
            }
        )
        // }

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

        try {
            const params = {
                searchId: doc.id,
                empId: this.$store.state.auth.id,
                collect: newCollectStatus
            }
            const success = await this.$roadLawyerService.saveOrCancelCollect(params)
            if (success) {
                // 接口调用成功后再更新状态，确保响应式更新
                const docIndex = this.allDocuments.findIndex(item => item.id === doc.id)
                if (docIndex !== -1) {
                    // 使用 Vue.set 或者直接修改数组元素来触发响应式更新
                    this.$set(this.allDocuments[docIndex], 'isCollect', newCollectStatus)
                }

                if (newCollectStatus) {
                    this.$message.success(`已收藏: ${doc.ruleName}`)
                } else {
                    this.$message.info(`已取消收藏: ${doc.ruleName}`)
                    if (this.isFavoritesMode) {
                        // 在收藏模式下取消收藏时，从列表中移除该文档
                        this.allDocuments.splice(docIndex, 1)
                        this.totalDocuments = this.allDocuments.length
                    }
                }
            } else {
                this.$message.error('操作失败，请重试')
            }
        } catch (error) {
            console.error('收藏操作失败:', error)
            this.$message.error('操作失败，请重试')
        }
    }

    uploadDocument(docId: string, docTitle: string, docData?: KnowledgeDataItem): void {
        this.isAddMode = false
        this.uploadModalVisible = true
        this.currentUploadDocId = docId
        this.currentUploadDocTitle = docTitle
        this.currentDocumentData = docData || {}
    }

    showAddDocumentModal(): void {
        this.isAddMode = true
        this.uploadModalVisible = true
        this.currentUploadDocId = ''
        this.currentUploadDocTitle = ''
        this.currentDocumentData = {} // 清空文档数据
    }

    handleUploadCancel(): void {
        this.uploadModalVisible = false
        this.currentUploadDocId = ''
        this.currentUploadDocTitle = ''
        this.isAddMode = false
    }

    handleUploadComplete(): void {
        this.uploadModalVisible = false
        this.currentUploadDocId = ''
        this.currentUploadDocTitle = ''
        this.isAddMode = false
    }

    handleUploadSuccess(): void {
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
                    // 删除前检查当前页数据数量，判断是否需要跳转到前一页
                    const isLastItemOnPage = this.allDocuments.length === 1
                    const shouldGoToPreviousPage = isLastItemOnPage && this.currentPage > 1
                    const success = await this.$roadLawyerService.deleteRuleSource({
                        id: doc.id
                    })
                    if (success) {
                        this.$message.success(`文档"${doc.ruleName}"已移除`)
                        setTimeout(async () => {
                            // 如果删除的是当前页最后一条数据且不是第一页，则跳转到前一页
                            if (shouldGoToPreviousPage) {
                                this.currentPage -= 1
                            }
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

    async onPageChange(page: number): Promise<void> {
        this.currentPage = page
        // 后端分页，需要重新请求API
        await this.loadDocuments()
    }

    async onShowSizeChange(_current: number, pageSize: number): Promise<void> {
        this.pageSize = pageSize
        this.currentPage = 1
        // 后端分页，需要重新请求API
        await this.loadDocuments()
    }

    handleDocumentAction(payload: { action: string; doc: KnowledgeDataItem }): void {
        const { action, doc } = payload
        switch (action) {
            case 'view':
                this.viewDocument(doc)
                break
            case 'download':
                this.downloadDocument(doc)
                break
        }
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

    async loadLegalCategory(): Promise<void> {
        try {
            // 根据当前路由动态确定分类ID
            const categoryId = this.getCategoryIdByRoute()
            const response = await this.$roadLawyerService.getLegalCategory({
                id: categoryId
            })
            if (response && response.length > 0) {
                // 大家智库页面获取全量数据，直接使用返回的数据
                // 其他页面取第一个元素的children作为分类数据
                if (!categoryId) {
                    // 大家智库页面：全量数据
                    this.categoryData = response
                } else {
                    // 其他页面：取第一个元素的children
                    this.categoryData = response[0]?.children || []
                }
            } else {
                console.warn(`获取专题分类数据为空，分类ID: ${categoryId || '全量'}`)
                this.categoryData = []
            }
        } catch (error) {
            console.error('加载专题分类数据失败:', error)
            this.categoryData = []
        }
    }

    async loadDepartmentData(): Promise<void> {
        try {
            const response = await this.$roadLawyerService.getDepartmentData({
                current: 1,
                size: 999
            })
            if (response.length) {
                this.departmentOptions = response.map(dept => ({
                    value: dept.name,
                    label: dept.name,
                    id: dept.id
                }))
            } else {
                console.warn('获取部门数据为空')
                this.departmentOptions = []
            }
        } catch (error) {
            console.error('加载部门数据失败:', error)
            this.departmentOptions = []
        }
    }

    getCategoryIdByRoute(): string | undefined {
        // 根据当前路由确定分类ID
        const routePath = this.$route.path

        if (routePath.includes('/lawyerKnowledge')) {
            return undefined // 大家智库页面使用全量数据
        } else if (routePath.includes('/regulationCompilation')) {
            return '2' // 法规汇编
        } else if (routePath.includes('/punishmentCompilation')) {
            return '1' // 处罚汇编
        } else if (routePath.includes('/researchCollection')) {
            return '311' // 研究集锦
        } else if (routePath.includes('/legalComplianceQuarterly')) {
            return '312' // 法律合规季刊
        } else if (routePath.includes('/newRegulationInterpretation')) {
            return '310' // 新规解读
        } else if (routePath.includes('/institutionLibrary')) {
            return '3' // 制度库
        } else if (routePath.includes('/policyLibrary')) {
            return '2' // 法规汇编
        } else if (routePath.includes('/caseLibrary')) {
            return '2' // 法规汇编
        }
        // 默认返回undefined，使用全量数据
        return undefined
    }

    convertToCascaderOptions(categories: LegalCategoryItem[]): CascaderOption[] {
        return categories.map((category: LegalCategoryItem): CascaderOption => ({
            value: category.id,
            label: category.name,
            children: this.convertToCascaderOptions(category.children || [])
        }))
    }

    // 根据分类ID获取分类名称
    getCategoryNameById(categoryId: string): string {
        const findCategoryName = (categories: LegalCategoryItem[], id: string): string => {
            for (const category of categories) {
                if (category.id === id) {
                    return category.name
                }
                if (category.children && category.children.length > 0) {
                    const childName = findCategoryName(category.children, id)
                    if (childName) {
                        return childName
                    }
                }
            }
            return ''
        }
        return findCategoryName(this.categoryData, categoryId)
    }

    async loadDocuments(
        searchType: 'normal' | 'exact' | 'default' = 'exact'
    ): Promise<void> {
        this.listLoading = true
        try {
            const params: RuleSourceQueryParams = {
                empId: this.$store.state.auth.id,
                // 添加分页参数
                page: this.currentPage,
                pageSize: this.pageSize
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
            if (this.timelinessFilter) {
                params.timeLiness = this.timelinessFilter
            }
            if (this.effectivenessLevelFilter) {
                params.effectivenessLevel = this.effectivenessLevelFilter
            }
            if (this.topicCategory && this.topicCategory.length > 0) {
                // 使用分类ID而不是名称
                params.categoryId = this.topicCategory[this.topicCategory.length - 1] // 使用最后一级的ID
                // 为了兼容性，仍然传递名称字段（如果后端需要）
                params.categoryMain = this.getCategoryNameById(this.topicCategory[0])
                if (this.topicCategory.length > 1) {
                    params.categorySub = this.getCategoryNameById(this.topicCategory[1])
                }
            } else {
                // 当用户没有选择专题分类时，根据当前页面设置固定的categoryId
                const fixedCategoryId = this.getCategoryIdByRoute()
                if (fixedCategoryId) {
                    params.categoryId = fixedCategoryId
                }
            }
            if (this.filterSource) {
                params.legalSource = this.filterSource
            }
            if (this.sortOrder) {
                params.publishDateSort = this.sortOrder
            }
            if (this.publishDate) {
                // 处理发布时间筛选
                params.publishDateStr = this.publishDate
            }
            // 新增筛选参数
            if (this.isAppendixFilter) {
                params.appendix = true
            }
            if (this.documentNumberFilter) {
                params.documentNumber = this.documentNumberFilter
            }
            if (this.departmentFilter) {
                params.department = this.departmentFilter
            }
            params.collect = this.isFavoritesMode
            const response = await this.$roadLawyerService.getRuleSourceList(params)
            // 根据 mock 数据结构处理响应
            if (response && response.success && response.data) {
                this.allDocuments = response.data.data || []
                this.totalDocuments = response.data.totalSize || 0
            } else if (response && Array.isArray(response)) {
                // 兼容旧的数组格式返回
                this.allDocuments = response
                this.totalDocuments = response.length
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

        // 附录项特殊样式
        &.lawyer-document-item-appendix {
            background-color: rgba(255, 165, 0, 0.05);
            border-left: 4px solid #ff9500;

            &:hover {
                background-color: rgba(255, 165, 0, 0.08);
            }
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
