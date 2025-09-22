<template>
    <div ref="fileUploadModalContainer">
        <a-modal :visible="visible" :title="title" :width="800" :footer="null" :mask-closable="false"
            :closable="!uploading" :get-container="() => $refs.fileUploadModalContainer || document.body"
            @cancel="handleCancel">
            <div class="lawyer-upload-container">
                <!-- 文件选择 -->
                <div v-if="!uploading && !uploadSuccess">
                    <a-upload-dragger :multiple="uploadConfig.multiple" :accept="uploadConfig.acceptTypes"
                        :before-upload="beforeUpload" :file-list="fileList" :show-upload-list="false">
                        <p class="ant-upload-drag-icon">
                            <a-icon type="inbox" />
                        </p>
                        <p class="ant-upload-text">
                            {{ uploadConfig.uploadText }}
                        </p>
                        <p class="ant-upload-hint">
                            {{ uploadConfig.hintText }}
                        </p>
                    </a-upload-dragger>

                    <!-- 已选择文件列表 -->
                    <div v-if="selectedFiles.length > 0" class="lawyer-files-container">
                        <div v-for="(file, index) in selectedFiles" :key="index" class="lawyer-file-info">
                            <a-icon type="file-text" />
                            <span class="lawyer-file-name">{{ file.name }} ({{ formatFileSize(file.size) }})</span>
                            <a-button type="link" icon="delete" :disabled="uploading"
                                @click="removeSelectedFile(index)" />
                        </div>

                        <!-- 多文件模式下显示文件统计 -->
                        <div v-if="uploadConfig.multiple && selectedFiles.length > 1" class="lawyer-file-summary">
                            <a-icon type="folder" />
                            <span>已选择 {{ selectedFiles.length }} 个文件</span>
                        </div>
                    </div>

                    <!-- 表单字段 - 只在新增模式下显示 -->
                    <a-form-model v-if="!isUpdate" ref="form" :model="formData" :label-col="{ span: 8 }"
                        :wrapper-col="{ span: 16 }" style="margin-top: 24px;">
                        <a-row :gutter="16">
                            <a-col :span="12">
                                <!-- 时效性 -->
                                <a-form-model-item label="时效性" prop="timeLiness">
                                    <a-select v-model="formData.timeLiness" placeholder="请选择时效性">
                                        <a-select-option v-for="option in timeLinessOptions" :key="option.value"
                                            :value="option.value">
                                            {{ option.label }}
                                        </a-select-option>
                                    </a-select>
                                </a-form-model-item>

                                <!-- 分类 -->
                                <a-form-model-item label="分类" prop="categoryPath">
                                    <a-cascader v-model="formData.categoryPath" :options="categoryOptions"
                                        placeholder="请选择分类" :show-search="true" :change-on-select="true"
                                        style="width: 100%" />
                                </a-form-model-item>

                                <!-- 发布时间 -->
                                <a-form-model-item label="发布时间" prop="publishDate">
                                    <a-date-picker v-model="formData.publishDate" style="width: 100%"
                                        placeholder="请选择发布时间" format="YYYY-MM-DD" value-format="YYYY-MM-DD" />
                                </a-form-model-item>



                                <!-- 文档编号 -->
                                <a-form-model-item label="发文字号" prop="documentNumber">
                                    <a-input v-model="formData.documentNumber" placeholder="请输入发文字号" />
                                </a-form-model-item>
                                <!-- 是否附录 -->
                                <a-form-model-item label="是否附录" prop="appendix">
                                    <a-switch v-model="formData.appendix" />
                                    <span style="margin-left: 8px; color: #666; font-size: 12px;">
                                        {{ formData.appendix ? '是' : '否' }}
                                    </span>
                                </a-form-model-item>
                            </a-col>

                            <a-col :span="12">
                                <!-- 效力位阶 -->
                                <a-form-model-item label="效力位阶" prop="effectivenessLevel">
                                    <a-select v-model="formData.effectivenessLevel" placeholder="请选择效力位阶">
                                        <a-select-option value="法律法规">法律法规</a-select-option>
                                        <a-select-option value="部门规章规范性文件">部门规章规范性文件</a-select-option>
                                        <a-select-option value="自律规则">自律规则</a-select-option>
                                        <a-select-option value="其他">其他</a-select-option>
                                    </a-select>
                                </a-form-model-item>

                                <!-- 来源 -->
                                <a-form-model-item label="来源" prop="legalSource">
                                    <a-select v-model="formData.legalSource" placeholder="请选择来源">
                                        <a-select-option v-for="option in websiteOptions" :key="option.value"
                                            :value="option.value">
                                            {{ option.label }}
                                        </a-select-option>
                                    </a-select>
                                </a-form-model-item>
                                <!-- 生效时间 -->
                                <a-form-model-item label="生效时间" prop="effectDate">
                                    <a-date-picker v-model="formData.effectDate" style="width: 100%"
                                        placeholder="请选择生效时间" format="YYYY-MM-DD" value-format="YYYY-MM-DD" />
                                </a-form-model-item>
                                <!-- 部门 -->
                                <a-form-model-item label="责任部门" prop="department">
                                    <a-select v-model="formData.department" placeholder="请选择责任部门" :allow-clear="true">
                                        <a-select-option v-for="option in departmentOptions" :key="option.value"
                                            :value="option.value">
                                            {{ option.label }}
                                        </a-select-option>
                                    </a-select>
                                </a-form-model-item>


                            </a-col>
                        </a-row>
                    </a-form-model>

                    <!-- 错误提示 -->
                    <div v-if="errorMessage" class="lawyer-error-message">
                        <a-icon type="exclamation-circle" />
                        {{ errorMessage }}
                    </div>
                </div>

                <!-- 上传中 -->
                <div v-if="uploading && !uploadSuccess" class="lawyer-upload-status">
                    <div class="lawyer-status-header">
                        <div class="lawyer-icon-container lawyer-rocket">
                            <a-icon type="rocket" />
                        </div>
                        <div class="lawyer-status-info">
                            <div class="lawyer-status-title">
                                正在更新文档
                            </div>
                            <div class="lawyer-file-detail">
                                文档：{{ documentTitle }}
                            </div>
                            <div v-if="selectedFiles.length === 1" class="lawyer-file-detail">
                                文件：{{ selectedFiles[0]?.name }}
                            </div>
                            <div v-else class="lawyer-file-detail">
                                文件：共 {{ selectedFiles.length }} 个文件
                            </div>
                        </div>
                    </div>
                    <a-progress :percent="uploadProgress" :show-info="false" stroke-color="#faad14" />
                    <div class="lawyer-progress-text">
                        <a-icon type="loading" spin /> 更新中
                    </div>
                </div>

                <!-- 上传完成 -->
                <div v-if="!uploading && uploadSuccess" class="lawyer-upload-status">
                    <div class="lawyer-status-header">
                        <div class="lawyer-icon-container lawyer-success">
                            <a-icon type="check-circle" />
                        </div>
                        <div class="lawyer-status-info">
                            <div class="lawyer-status-title">
                                上传完成
                            </div>
                            <div class="lawyer-file-detail">
                                文档：{{ documentTitle }}
                            </div>
                            <div v-if="selectedFiles.length === 1" class="lawyer-file-detail">
                                文件：{{ selectedFiles[0]?.name }}
                            </div>
                            <div v-else class="lawyer-file-detail">
                                文件：共 {{ selectedFiles.length }} 个文件
                            </div>
                            <div class="lawyer-success-message">
                                {{
                                    selectedFiles.length === 1
                                        ? "文件已成功上传并更新"
                                        : `${selectedFiles.length} 个文件已成功上传并更新`
                                }}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 底部按钮 -->
                <div class="lawyer-modal-actions">
                    <a-button v-if="!uploading && !uploadSuccess" @click="handleCancel">
                        取消
                    </a-button>
                    <a-button v-if="!uploading && !uploadSuccess" type="primary" :disabled="selectedFiles.length === 0"
                        @click="startUpload">
                        {{ isUpdate ? '更新文档' : '上传文档' }}
                    </a-button>

                    <a-button v-if="!uploading && uploadSuccess" type="primary" @click="handleComplete">
                        完成
                    </a-button>
                </div>
            </div>
        </a-modal>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch, Emit } from 'nuxt-property-decorator'
import {
    UploadConfig,
    UploadSuccessData,
    UploadErrorData,
    CascaderOption,
    FilterOption,
    DepartmentOption
} from '~/model/LawyerModel'

@Component
export default class FileUploadModal extends Vue {
    @Prop({ default: false }) visible!: boolean;
    @Prop({ default: '上传文件' }) title!: string;
    @Prop({ default: '' }) documentId!: string;
    @Prop({ default: '' }) documentTitle!: string;
    @Prop({ default: '' }) categoryName!: string; // 分类名称，用于获取分类数据
    @Prop({ default: () => [] }) timeLinessOptions!: FilterOption[]; // 时效性选项
    @Prop({ default: () => [] }) websiteOptions!: FilterOption[]; // 来源选项
    @Prop({ default: () => [] }) categoryOptions!: CascaderOption[]; // 分类选项
    @Prop({ default: () => [] }) departmentOptions!: DepartmentOption[]; // 部门选项
    @Prop({ default: () => ({}) }) documentData!: any; // 文档数据，用于回显

    // 上传配置
    @Prop({
        type: Object,
        default: () => ({})
    })
    config!: UploadConfig;

    // 状态
    selectedFiles: File[] = [];
    uploading: boolean = false;
    uploadSuccess: boolean = false;
    uploadProgress: number = 0;
    errorMessage: string = '';
    progressTimer: NodeJS.Timeout | null = null;

    // 表单数据
    formData: {
        timeLiness?: string;
        effectivenessLevel?: string;
        categoryPath?: string[];
        legalSource?: string;
        publishDate?: string;
        effectDate?: string;
        department?: string;
        documentNumber?: string;
        appendix?: boolean;
    } = {
            timeLiness: undefined,
            effectivenessLevel: undefined,
            categoryPath: [],
            legalSource: undefined,
            publishDate: undefined,
            effectDate: undefined,
            department: undefined,
            documentNumber: undefined,
            appendix: false
        };

    // 计算属性 - 获取配置值
    get uploadConfig(): Required<UploadConfig> {
        return {
            multiple: false,
            acceptTypes: '.pdf,.doc,.docx',
            maxFileSize: 500 * 1024 * 1024,
            maxFileCount: 1,
            uploadText: '点击或拖拽文件到此区域上传',
            hintText: '支持 PDF、DOC、DOCX 格式，文件大小不超过 500MB',
            autoUpload: false,
            ...this.config
        }
    }

    // 兼容性属性 - 保持向后兼容
    get selectedFile(): File | null {
        return this.selectedFiles.length > 0 ? this.selectedFiles[0] : null
    }

    // antd-vue Upload 组件需要的 fileList
    get fileList() {
        return this.selectedFiles.map((file, index) => ({
            uid: `file-${index}`,
            name: file.name,
            status: 'done',
            originFileObj: file
        }))
    }



    // 是否为更新模式
    get isUpdate(): boolean {
        return !!this.documentId
    }

    // 监听弹窗显示状态
    @Watch('visible')
    onVisibleChange(newVal: boolean): void {
        if (newVal) {
            this.resetFormData()
            this.fillFormData() // 回显数据
        } else {
            this.resetState()
        }
    }

    // antd-vue Upload 组件的 beforeUpload 钩子
    beforeUpload(file: File): boolean {
        this.processFile(file)
        return false // 阻止自动上传
    }

    isValidFileType(file: File): boolean {
        // 完全根据配置的 acceptTypes 进行验证
        const acceptTypes: string = this.uploadConfig.acceptTypes.toLowerCase()
        const fileName: string = file.name.toLowerCase()

        // 解析扩展名列表
        const extensions: string[] = acceptTypes
            .split(',')
            .map((ext: string): string => ext.trim())
            .filter((ext: string): boolean => ext.length > 0)

        // 验证文件扩展名
        return extensions.some((ext: string): boolean => fileName.endsWith(ext))
    }

    // 获取文件类型提示文本
    getFileTypeHint(): string {
        const acceptTypes: string = this.uploadConfig.acceptTypes
        return acceptTypes
            .split(',')
            .map((ext: string): string => ext.trim().replace(/\./g, ''))
            .filter((ext: string): boolean => ext.length > 0)
            .join('、')
            .toUpperCase()
    }

    // 处理文件的核心方法
    processFile(file: File): void {
        this.clearError()

        // 检查文件类型
        if (!this.isValidFileType(file)) {
            const typeHint: string = this.getFileTypeHint()
            this.showError(`只支持 ${typeHint} 格式的文件`)
            return
        }

        // 检查文件大小
        if (file.size > this.uploadConfig.maxFileSize) {
            const sizeHint: string = this.formatFileSize(
                this.uploadConfig.maxFileSize
            )
            this.showError(`文件大小不能超过 ${sizeHint}`)
            return
        }

        if (file.size === 0) {
            this.showError('不能上传空文件')
            return
        }

        // 检查文件数量限制
        if (!this.uploadConfig.multiple) {
            // 单文件模式，替换现有文件
            this.selectedFiles = [file]
        } else {
            // 多文件模式，检查数量限制
            if (this.selectedFiles.length >= this.uploadConfig.maxFileCount) {
                this.showError(`最多只能选择 ${this.uploadConfig.maxFileCount} 个文件`)
                return
            }

            // 检查是否已存在同名文件
            const existingFile: File | undefined = this.selectedFiles.find(
                (f: File): boolean => f.name === file.name
            )
            if (existingFile) {
                this.showError(`文件 "${file.name}" 已存在`)
                return
            }

            this.selectedFiles.push(file)
        }

        // 立即显示成功提示
        this.$message.success(`文件 "${file.name}" 已选择`)

        // 如果启用自动上传，立即开始上传
        if (this.uploadConfig.autoUpload) {
            this.startUpload()
        }
    }

    // 错误处理
    showError(message: string): void {
        this.errorMessage = message
        this.$message.error(message)
        setTimeout(() => this.clearError(), 5000)
    }

    clearError(): void {
        this.errorMessage = ''
    }



    // 重置表单数据
    resetFormData(): void {
        this.formData = {
            timeLiness: undefined,
            effectivenessLevel: undefined,
            categoryPath: [],
            legalSource: undefined,
            publishDate: undefined,
            department: undefined,
            documentNumber: undefined,
            appendix: false
        }
    }

    // 填充表单数据（用于回显）
    fillFormData(): void {
        if (!this.documentData || !this.isUpdate) return

        // 回显时效性
        if (this.documentData.timeLiness) {
            this.formData.timeLiness = this.documentData.timeLiness
        }

        // 回显效力位阶
        if (this.documentData.effectivenessLevel) {
            this.formData.effectivenessLevel = this.documentData.effectivenessLevel
        }

        // 回显来源
        if (this.documentData.legalSource) {
            this.formData.legalSource = this.documentData.legalSource
        }

        // 回显发布时间
        if (this.documentData.publishDateStr) {
            this.formData.publishDate = this.documentData.publishDateStr
        }

        // 回显生效时间 - 确保不是无效的日期字符串
        const effectDate = this.documentData.effectDate || this.documentData.effectDateStr
        if (effectDate && effectDate !== '暂无' && effectDate !== 'undefined' && effectDate !== 'null') {
            // 验证是否为有效的日期格式
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/
            if (dateRegex.test(effectDate)) {
                this.formData.effectDate = effectDate
            } else {
                this.formData.effectDate = undefined
            }
        } else {
            this.formData.effectDate = undefined
        }

        // 回显部门
        if (this.documentData.department) {
            this.formData.department = this.documentData.department
        }

        // 回显文档编号
        if (this.documentData.documentNumber) {
            this.formData.documentNumber = this.documentData.documentNumber
        }

        // 回显分类 - 优先使用categoryId，其次使用categoryMain/categorySub
        if (this.documentData.categoryId) {
            // 如果有categoryId，需要找到完整的路径
            const categoryPath = this.getCategoryPathById(this.documentData.categoryId)
            this.formData.categoryPath = categoryPath
        } else if (this.documentData.categoryMain) {
            // 兼容旧数据：根据分类名称获取分类ID
            const categoryPath = [this.getCategoryIdByName(this.documentData.categoryMain)]
            if (this.documentData.categorySub) {
                categoryPath.push(this.getCategoryIdByName(this.documentData.categorySub))
            }
            this.formData.categoryPath = categoryPath
        }

        // 回显是否附录
        if (this.documentData.appendix !== undefined) {
            this.formData.appendix = this.documentData.appendix
        }


    }

    // 根据分类ID获取分类名称
    getCategoryNameById(categoryId: string): string {
        const findCategoryName = (options: CascaderOption[], id: string): string => {
            for (const option of options) {
                if (option.value === id) {
                    return option.label
                }
                if (option.children && option.children.length > 0) {
                    const childName = findCategoryName(option.children, id)
                    if (childName) {
                        return childName
                    }
                }
            }
            return ''
        }
        return findCategoryName(this.categoryOptions, categoryId)
    }

    // 根据分类名称获取分类ID
    getCategoryIdByName(categoryName: string): string {
        const findCategoryId = (options: CascaderOption[], name: string): string => {
            for (const option of options) {
                if (option.label === name) {
                    return option.value
                }
                if (option.children && option.children.length > 0) {
                    const childId = findCategoryId(option.children, name)
                    if (childId) {
                        return childId
                    }
                }
            }
            return ''
        }
        return findCategoryId(this.categoryOptions, categoryName)
    }

    // 根据分类ID获取完整的分类路径
    getCategoryPathById(categoryId: string): string[] {
        const findCategoryPath = (options: CascaderOption[], id: string, path: string[] = []): string[] | null => {
            for (const option of options) {
                const currentPath = [...path, option.value]
                if (option.value === id) {
                    return currentPath
                }
                if (option.children && option.children.length > 0) {
                    const childPath = findCategoryPath(option.children, id, currentPath)
                    if (childPath) {
                        return childPath
                    }
                }
            }
            return null
        }
        return findCategoryPath(this.categoryOptions, categoryId) || []
    }

    removeSelectedFile(index?: number): void {
        if (typeof index === 'number') {
            // 移除指定索引的文件
            this.selectedFiles.splice(index, 1)
        } else {
            // 兼容性：移除所有文件
            this.selectedFiles = []
        }

        this.clearError()
    }

    // 上传处理
    async startUpload(): Promise<void> {
        if (this.selectedFiles.length === 0) { return }

        this.uploading = true
        this.uploadSuccess = false
        this.uploadProgress = 0

        try {
            await this.simulateUpload()
            this.uploading = false
            this.uploadSuccess = true

            // 发送上传成功事件
            this.emitUploadSuccess({
                files: this.selectedFiles,
                file: this.selectedFile, // 保持向后兼容
                documentId: this.documentId
            })
        } catch (error) {
            this.$message.error('上传失败，请重试')
            this.uploading = false
            this.uploadSuccess = false

            // 发送上传失败事件
            this.emitUploadError({
                files: this.selectedFiles,
                error
            })
        }
    }

    // 真实上传到后端 - 支持单文件和多文件
    async simulateUpload(): Promise<void> {
        if (this.selectedFiles.length === 0) {
            throw new Error('请先选择文件')
        }

        // 新增模式不需要documentId，更新模式需要
        if (this.isUpdate && !this.documentId) {
            throw new Error('缺少文档ID')
        }

        try {
            const totalFiles = this.selectedFiles.length
            let completedFiles = 0
            let currentFileProgress = 0

            console.log('上传参数:', {
                id: this.documentId,
                totalFiles,
                files: this.selectedFiles.map(f => ({ name: f.name, size: f.size }))
            })

            // 上传进度处理
            this.progressTimer = setInterval(() => {
                // 模拟当前文件的上传进度
                currentFileProgress += Math.random() * 15 + 5 // 每次增加5-20%
                currentFileProgress = Math.min(90, currentFileProgress)

                // 基础进度：已完成文件的进度 + 当前文件的模拟进度
                const baseProgress = (completedFiles / totalFiles) * 100
                const totalProgress = Math.min(
                    90,
                    baseProgress + (currentFileProgress / totalFiles)
                )
                this.uploadProgress = totalProgress
            }, 200)

            // 遍历上传所有文件
            for (let i = 0; i < this.selectedFiles.length; i++) {
                const file = this.selectedFiles[i]

                console.log(`正在上传第 ${i + 1}/${totalFiles} 个文件: ${file.name}`)

                // 重置当前文件进度
                currentFileProgress = 0

                // 准备上传参数
                const uploadParams: any = {
                    file
                }

                // 如果是更新操作，只添加id，不传递其他字段
                if (this.isUpdate) {
                    uploadParams.id = this.documentId
                } else {
                    // 新增模式下才传递表单字段
                    uploadParams.appendix = this.formData.appendix
                    uploadParams.timeLiness = this.formData.timeLiness
                    uploadParams.effectivenessLevel = this.formData.effectivenessLevel
                    uploadParams.legalSource = this.formData.legalSource
                    uploadParams.publishDateStr = this.formData.publishDate
                    uploadParams.effectDate = this.formData.effectDate
                    uploadParams.department = this.formData.department
                    uploadParams.documentNumber = this.formData.documentNumber

                    // 处理分类路径
                    if (this.formData.categoryPath && this.formData.categoryPath.length > 0) {
                        // 使用分类ID作为categoryId，使用分类名称作为categoryMain和categorySub
                        uploadParams.categoryMain = this.getCategoryNameById(this.formData.categoryPath[0])
                        if (this.formData.categoryPath.length > 1) {
                            uploadParams.categorySub = this.getCategoryNameById(this.formData.categoryPath[1])
                            // 如果有子分类，使用子分类ID作为 categoryId
                            uploadParams.categoryId = this.formData.categoryPath[1]
                        } else {
                            // 如果只有主分类，使用主分类ID作为 categoryId
                            uploadParams.categoryId = this.formData.categoryPath[0]
                        }
                    }
                }

                console.log('上传参数:', uploadParams)

                // 调用真实的后端接口
                const success: boolean = await this.$roadLawyerService.uploadRuleSource(uploadParams)

                if (!success) {
                    throw new Error(`文件 "${file.name}" 上传失败`)
                }

                completedFiles++
            }

            this.uploadProgress = 100

            // 等待一下让用户看到100%进度
            await new Promise((resolve): NodeJS.Timeout => setTimeout(resolve, 500))
        } catch (error) {
            console.error('上传失败:', error)
            throw error
        } finally {
            // 确保在任何情况下都清理定时器
            if (this.progressTimer) {
                clearInterval(this.progressTimer)
                this.progressTimer = null
            }
        }
    }

    handleCancel(): void {
        this.resetState()
        this.emitCancel()
    }

    handleComplete(): void {
        this.resetState()
        this.emitComplete()
    }

    resetState(): void {
        // 清理进度定时器
        if (this.progressTimer) {
            clearInterval(this.progressTimer)
            this.progressTimer = null
        }

        this.selectedFiles = []
        this.uploading = false
        this.uploadSuccess = false
        this.uploadProgress = 0
        this.clearError()
    }

    formatFileSize(bytes: number): string {
        if (bytes === 0) { return '0 B' }
        const k: number = 1024
        const sizes: string[] = ['B', 'KB', 'MB', 'GB']
        const i: number = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }



    // 组件销毁时清理异步任务
    beforeDestroy(): void {
        // 清理进度定时器
        if (this.progressTimer) {
            clearInterval(this.progressTimer)
            this.progressTimer = null
        }
    }

    // Emit 装饰器方法
    @Emit('upload-success')
    emitUploadSuccess(data: UploadSuccessData): UploadSuccessData {
        return data
    }

    @Emit('upload-error')
    emitUploadError(data: UploadErrorData): UploadErrorData {
        return data
    }

    @Emit('cancel')
    emitCancel(): void {
        // 无需返回值
    }

    @Emit('complete')
    emitComplete(): void {
        // 无需返回值
    }
}
</script>

<style lang="less">
@import "~/assets/styles/lawyer.less";

.lawyer-upload-container {
    padding: 16px 0;

    // 自定义 antd Upload 组件样式
    .ant-upload-dragger {
        height: 180px;

        .ant-upload-drag-icon {
            margin-bottom: 16px;

            .anticon {
                font-size: 48px;
                color: #1890ff;
            }
        }

        .ant-upload-text {
            font-size: 16px;
            color: #333;
            margin-bottom: 8px;
            font-weight: 500;
        }

        .ant-upload-hint {
            color: #999;
            font-size: 14px;
        }
    }
}



.lawyer-files-container {
    margin-top: 16px;
}

.lawyer-file-info,
.lawyer-error-message {
    margin-bottom: 8px;
    padding: 12px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.lawyer-file-info {
    background: #f0f8ff;
    border: 1px solid #d6e4ff;
    color: #333;

    .lawyer-file-name {
        flex: 1;
        word-break: break-all;
    }
}

.lawyer-file-summary {
    margin-top: 8px;
    padding: 8px 12px;
    background: #f6ffed;
    border: 1px solid #b7eb8f;
    border-radius: 6px;
    color: #52c41a;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.lawyer-error-message {
    background: #fff2f0;
    border: 1px solid #ffccc7;
    color: #ff4d4f;
}

.lawyer-upload-status {
    text-align: center;
    padding: 24px;

    .lawyer-status-header {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 16px;
        margin-bottom: 24px;

        .lawyer-icon-container {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;

            .anticon {
                font-size: 24px;
                color: #fff;
            }

            &.lawyer-rocket {
                background: linear-gradient(135deg, #ffd666, #faad14);
            }

            &.lawyer-success {
                background: linear-gradient(135deg, #73d13d, #52c41a);
            }
        }

        .lawyer-status-info {
            text-align: left;

            .lawyer-status-title {
                font-size: 16px;
                font-weight: 600;
                color: #333;
                margin-bottom: 8px;
            }

            .lawyer-file-detail {
                font-size: 14px;
                color: #666;
                margin-bottom: 4px;
            }

            .lawyer-success-message {
                font-size: 14px;
                color: #52c41a;
                font-weight: 500;
                margin-top: 8px;
            }
        }
    }

    .lawyer-progress-text {
        margin-top: 12px;
        font-size: 14px;
        color: #faad14;
        font-weight: 500;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
    }
}

.lawyer-modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid #f0f0f0;
}
</style>
