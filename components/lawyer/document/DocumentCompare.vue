<template>
  <div ref="documentCompareContainer" class="document-compare-wrapper">
    <div class="lawyer-compare-page">
      <header class="lawyer-compare-header">
        <div class="lawyer-header-content">
          <div class="lawyer-title-row">
            <h3>{{ document.title }}</h3>
            <!-- 文档标签区域 - 只有来自人工审核页面时才显示编辑功能 -->
            <div v-if="isFromManualReviewPage" class="lawyer-document-tags">
              <a-tag
                v-if="displayTag"
                color="orange"
                class="lawyer-editable-tag"
                @click="showTagEditModal"
              >
                {{ displayTag }}
                <a-icon type="edit" class="lawyer-tag-edit-icon" />
              </a-tag>
              <a-tag
                v-else
                color="orange"
                class="lawyer-editable-tag lawyer-empty-tag"
                @click="showTagEditModal"
              >
                点击设置分类
                <a-icon type="plus" class="lawyer-tag-edit-icon" />
              </a-tag>
            </div>
            <!-- 来自其他页面时只显示标签，不可编辑 -->
            <div v-else-if="displayTag" class="lawyer-document-tags">
              <a-tag color="orange">
                {{ displayTag }}
              </a-tag>
            </div>
          </div>
        </div>
        <div class="lawyer-header-actions">
          <div v-if="shouldShowWarning" class="lawyer-version-warning">
            {{ getReviewWarningMessage() }}
          </div>
          <a-button class="lawyer-back-btn" @click="goBack">
            <a-icon type="arrow-left" />
            返回
          </a-button>
        </div>
      </header>

      <div class="lawyer-compare-main-container">
        <!-- 文档列 -->
        <div v-for="col in documentColumns" :key="col.title" class="lawyer-document-column">
          <div class="lawyer-column-header">
            {{ col.title }}
            （<span v-if="col.version">{{ col.version }}</span
            ><span v-if="col.version && col.date"> - </span
            ><span v-if="col.date">{{ col.date }}</span
            >）
            <a-select
              v-if="col.title === '修改前文档' && isFromManualReviewPage"
              v-model="selectedRuleId"
              placeholder="选择其他制度文档对比"
              :loading="ruleLoading"
              :disabled="comparisonLoading || isAiComparisonNotCompleted"
              show-search
              option-filter-prop="children"
              style="width: 280px !important"
              @change="handleRuleChange"
            >
              <a-select-option v-for="rule in ruleDetailList" :key="rule.id" :value="rule.id">
                {{ rule.ruleName }}（{{ rule.publishDateStr }}）
              </a-select-option>
            </a-select>
          </div>
          <div class="lawyer-column-content">
            <v-md-preview :text="col.content || '暂无数据'" />
          </div>
        </div>

        <!-- 审阅内容 -->
        <div class="review-content-column">
          <div class="lawyer-column-header">
            审阅内容
            <span class="version-info">
              (V{{ Number(document.oldFileVersion) || '' }} vs V{{
                Number(document.newFileVersion) || ''
              }})
            </span>
          </div>

          <div v-if="!hasSpecialInfo" class="review-summary">
            <a-icon type="exclamation-circle" class="summary-icon" />
            共有
            <span class="change-count">{{ document.changes.length }}</span>
            大类变动
          </div>

          <div class="review-content">
            <div v-if="document.changes.length === 0" class="no-changes">暂无数据</div>

            <div
              v-for="(change, index) in document.changes"
              :key="`${change.type}-${index}`"
              class="change-item"
            >
              <!-- 处理特殊信息类型 -->
              <div v-if="change.type === 'info'" class="info-message">
                <a-icon type="info-circle" class="info-icon" />
                <span v-if="change.position === '无旧版文件'"> 无旧版文档数据 </span>
                <span v-else-if="change.position === '无新版文件'"> 无新版文档数据 </span>
                <span v-else>{{ change.position }}</span>
              </div>

              <!-- 正常变更内容 -->
              <div v-else>
                <div class="change-title">
                  {{ change.sectionDisplay || change.position || '' }}
                </div>

                <div class="change-detail">
                  <div v-if="change.type === 'add'" class="change-text">
                    新增内容：<span class="highlight-text">{{ change.newText }}</span>
                  </div>
                  <div v-else-if="change.type === 'delete'" class="change-text">
                    删除了"<span class="deleted-text">{{ change.oldText }}</span
                    >"
                  </div>
                  <div v-else-if="change.type === 'modify'" class="change-text">
                    修改内容：<span class="highlight-text">{{ change.newText }}</span
                    >，原内容："{{ change.oldText }}"
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 审核按钮固定在右下角 - 只有来自人工审核页面时才显示 -->
      <div v-if="shouldShowReviewButtons && isFromManualReviewPage" class="tx-r">
        <a-button
          v-for="action in reviewActions"
          :key="action.text"
          class="ml-8"
          :type="action.type"
          :loading="submitting"
          @click="action.handler"
        >
          {{ action.text }}
        </a-button>
      </div>

      <!-- 标签编辑模态框 -->
      <a-modal
        title="编辑文档分类和施行日期"
        :visible="tagEditVisible"
        :width="600"
        ok-text="确认"
        cancel-text="取消"
        :get-container="() => $refs.documentCompareContainer"
        @ok="handleTagEditConfirm"
        @cancel="handleTagEditCancel"
      >
        <div class="lawyer-tag-edit-content">
          <!-- 标签分类选择 -->
          <div class="lawyer-tag-select-row">
            <label>选择分类</label>
            <a-cascader
              v-model="tempSelectedTagPath"
              :options="tagOptions"
              placeholder="全部分类"
              :show-search="true"
              :change-on-select="true"
              style="width: 300px"
            />
          </div>

          <!-- 施行日期选择 -->
          <div class="lawyer-tag-select-row">
            <label>施行日期</label>
            <a-date-picker
              v-model="tempEffectDate"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              placeholder="请选择施行日期"
              style="width: 300px"
            />
          </div>
        </div>
      </a-modal>
    </div>
  </div>
</template>

<script lang="ts">
  import { Component, Vue, Prop, Emit } from 'nuxt-property-decorator';
  import {
    DocumentCompareData,
    ReviewAction,
    DocumentColumn,
    CascaderOption,
    ReviewSubmitData,
    LegalCategoryItem,
    RuleDetailItem
  } from '~/model/LawyerModel';

  @Component({ name: 'document-compare' })
  class DocumentCompare extends Vue {
    @Prop({ required: true }) document!: DocumentCompareData;
    @Prop({ default: false }) submitting!: boolean;
    @Prop({ default: () => [] }) ruleDetailList!: RuleDetailItem[];
    @Prop({ default: false }) ruleLoading!: boolean;
    @Prop({ default: false }) comparisonLoading!: boolean;

    // 标签编辑相关
    tagEditVisible: boolean = false;
    tempSelectedTagPath: string[] = [];
    tempEffectDate: string | null = null;

    // 规则选择
    selectedRuleId: string = '';

    // 标签选项数据
    tagOptions: CascaderOption[] = [];

    // 分类ID到名称的映射缓存，用于显示
    private categoryMap: Map<string, string> = new Map();
    // 分类加载版本计数：加载完成后自增，用于触发计算属性重算
    categoriesVersion: number = 0;

    // 判断是否来自人工审核页面
    get isFromManualReviewPage(): boolean {
      const sourcePath = this.$route.query.source as string;
      return sourcePath && sourcePath.includes('/manualReview');
    }

    // 判断AI对比是否未完成（completed === "0"）
    get isAiComparisonNotCompleted(): boolean {
      return this.document.completed === '0';
    }

    // 组件挂载时加载专题分类数据
    async mounted(): Promise<void> {
      await this.loadCategoryOptions();
    }

    // 加载专题分类数据 - 固定获取全部数据
    async loadCategoryOptions(): Promise<void> {
      try {
        console.log('开始加载专题分类数据（全量）');

        const categories: LegalCategoryItem[] = await this.$roadLawyerService.getLegalCategory({
          // 不传 id 参数，获取全部专题分类数据
        });

        if (categories && categories.length > 0) {
          this.tagOptions = this.convertToCascaderOptions(categories);
          // 构建分类ID到名称的映射缓存
          this.categoryMap.clear();
          this.buildCategoryMap(categories);
          this.categoriesVersion++;
        } else {
          console.warn('未获取到分类数据');
          this.tagOptions = [];
          this.categoryMap.clear();
          this.categoriesVersion++;
        }
      } catch (error) {
        console.error('加载专题分类数据失败:', error);
        this.tagOptions = [];
        this.categoryMap.clear();
        this.categoriesVersion++;
      }
    }

    // 构建分类ID到名称的映射缓存
    private buildCategoryMap(categories: LegalCategoryItem[]): void {
      categories.forEach(category => {
        this.categoryMap.set(category.id, category.name);
        if (category.children && category.children.length > 0) {
          this.buildCategoryMap(category.children);
        }
      });
    }

    // 将API数据转换为级联选择器格式
    convertToCascaderOptions(categories: LegalCategoryItem[]): CascaderOption[] {
      return categories.map(
        (category: LegalCategoryItem): CascaderOption => ({
          value: category.id,
          label: category.name,
          children: this.convertToCascaderOptions(category.children || [])
        })
      );
    }

    // 通过叶子ID在级联树中回溯完整路径（返回ID数组），未找到则返回空数组
    private findFullPathById(targetId: string): string[] {
      const dfs = (options: CascaderOption[] | undefined, path: string[]): string[] => {
        if (!options || options.length === 0) return [];
        for (const option of options) {
          const nextPath = [...path, String(option.value)];
          if (String(option.value) === String(targetId)) {
            return nextPath;
          }
          const child = dfs(option.children, nextPath);
          if (child.length > 0) return child;
        }
        return [];
      };
      return dfs(this.tagOptions, []);
    }

    // 根据分类ID获取分类名称（使用缓存提升性能）
    getCategoryNameById(categoryId: string): string {
      return this.categoryMap.get(categoryId) || '';
    }

    // 将标签数组（ID）规范化为 ID 路径（不再支持名称）
    private resolveTagsToIds(tags: string[]): string[] {
      if (!tags || tags.length === 0) return [];
      return tags.filter(tag => !!tag).map(tag => String(tag));
    }

    // 显示标签（合并为单个标签）- 将ID转换为名称显示
    get displayTag(): string {
      if (!this.document) return '';
      const tags: string[] = this.document.tags || [];
      if (tags.length === 0) return '';
      // 分类未加载完成时不显示（或可返回占位文案）
      if (this.categoriesVersion === 0) return '';
      let resolvedTags = this.resolveTagsToIds(tags);
      // 若仅有一个叶子ID，尝试回溯完整路径用于展示
      if (resolvedTags.length === 1 && this.tagOptions && this.tagOptions.length > 0) {
        const fullPath = this.findFullPathById(resolvedTags[0]);
        if (fullPath.length > 0) {
          resolvedTags = fullPath;
        }
      }
      if (resolvedTags.length === 0) return '';
      // 将ID转换为名称，支持多级分类
      const tagNames = resolvedTags.map(tagId => this.getCategoryNameById(tagId) || tagId);
      // 使用 / 连接所有级别的分类
      return tagNames.join('/');
    }

    // 审核操作按钮
    get reviewActions(): ReviewAction[] {
      return [
        {
          text: '通过',
          type: 'primary',
          handler: this.handleApprove
        },
        {
          text: '驳回',
          type: 'danger',
          handler: this.handleReject
        }
      ];
    }

    // 是否显示审核按钮
    get shouldShowReviewButtons(): boolean {
      // 只检查文档的审核状态是否为'待审核'，并确保内容没有错误
      return this.document.checkStatus === '待审核' && this.canReview;
    }

    // 是否显示警告信息
    get shouldShowWarning(): boolean {
      // 显示警告当状态不是待审核或者内容有错误
      return this.document.checkStatus !== '待审核' || !this.canReview;
    }

    // 是否有特殊信息（无旧版文件或无新版文件）
    get hasSpecialInfo(): boolean {
      return this.document.changes.some(change => change.type === 'info');
    }

    // 获取版本和内容状态信息
    private getVersionStatus(): {
      hasContentError: boolean;
    } {
      return {
        hasContentError: this.documentColumns.some(
          col => col.content === 'error' || col.content === '加载失败，请刷新页面重试'
        )
      };
    }

    // 是否允许审核操作
    get canReview(): boolean {
      const { hasContentError } = this.getVersionStatus();
      // 只根据checkStatus判断是否允许审核，并检查内容是否加载成功
      return this.document.checkStatus === '待审核' && !hasContentError;
    }

    // 检查审核状态并显示错误信息
    checkReviewStatusAndShowError(): boolean {
      const { hasContentError } = this.getVersionStatus();

      if (hasContentError) {
        this.$message.error('文档内容加载失败，请刷新页面重试后再进行审核');
        return false;
      } else if (this.document.checkStatus !== '待审核') {
        this.$message.error('当前状态不允许审核');
        return false;
      }
      return true;
    }

    // 检查分类标签和施行日期是否已设置
    checkTagsAndEffectDate(): boolean {
      const hasTag = this.document.tags && this.document.tags.length > 0;
      const hasEffectDate = this.document.effectDate;

      if (!hasTag || !hasEffectDate) {
        const missingItems = [];
        if (!hasTag) missingItems.push('分类标签');
        if (!hasEffectDate) missingItems.push('施行日期');

        this.$message.error(`请先设置${missingItems.join('和')}后再进行审核`);
        return false;
      }

      return true;
    }

    // 获取审核警告信息
    getReviewWarningMessage(): string {
      const { hasContentError } = this.getVersionStatus();

      if (hasContentError) {
        return '文档内容加载失败，请刷新页面重试';
      } else if (this.document.checkStatus !== '待审核') {
        return '当前状态不允许审核';
      }
      return '';
    }

    // 文档列数据
    get documentColumns(): DocumentColumn[] {
      return [
        {
          title: '修改前文档',
          version: this.document.oldFileVersion ? `V${this.document.oldFileVersion}` : undefined,
          date: this.document.oldPublishTime || '',
          content: this.document.originalContent || '暂无数据'
        },
        {
          title: '修改后文档',
          version: this.document.newFileVersion ? `V${this.document.newFileVersion}` : undefined,
          date: this.document.modifiedDate || this.document.newPublishTime || '',
          content: this.document.newContent || '暂无数据'
        }
      ];
    }

    // 返回上一页
    goBack(): void {
      this.emitGoBack();
    }

    // 通用审核处理方法（根据动作进行差异化校验与确认）
    handleReview(action: 'approve' | 'reject'): void {
      // 防止重复提交
      if (this.submitting) {
        return;
      }

      // 检查是否允许审核
      if (!this.checkReviewStatusAndShowError()) {
        return;
      }

      const isApprove = action === 'approve';
      // 通过需要检查分类标签与施行日期；驳回无需检查
      if (isApprove && !this.checkTagsAndEffectDate()) {
        return;
      }

      const title = isApprove ? '确认通过' : '确认驳回';
      const content = isApprove ? '确定要通过此文档的审核吗？' : '确定要驳回此文档吗？';
      const okText = isApprove ? '确认通过' : '确认驳回';
      const okType = isApprove ? 'primary' : 'danger';

      this.$confirm({
        title,
        content,
        okText,
        okType,
        cancelText: '取消',
        onOk: () => {
          this.emitSubmitReview({
            action,
            comment: ''
          });
        }
      });
    }

    // 处理通过审核
    handleApprove(): void {
      this.handleReview('approve');
    }

    // 处理驳回审核
    handleReject(): void {
      this.handleReview('reject');
    }

    // 显示标签编辑模态框
    showTagEditModal(): void {
      // 检查文档状态，只有待审核状态才能编辑
      if (this.document.checkStatus !== '待审核') {
        this.$message.warning('当前文档状态不允许编辑');
        return;
      }

      // 统一解析为 ID 路径（支持多级），若仅有叶子ID则回溯完整路径用于级联回显
      const current = this.resolveTagsToIds(this.document.tags || []);
      if (current.length === 1 && this.tagOptions && this.tagOptions.length > 0) {
        const fullPath = this.findFullPathById(current[0]);
        this.tempSelectedTagPath = fullPath.length > 0 ? fullPath : current;
      } else {
        this.tempSelectedTagPath = current;
      }
      this.tempEffectDate = this.document.effectDate || null;
      this.tagEditVisible = true;
    }

    // 处理标签编辑确认
    handleTagEditConfirm(): void {
      // 多级通用：将所选 ID 路径映射为名称并用 / 连接
      const tagNames = (this.tempSelectedTagPath || []).map(
        id => this.getCategoryNameById(id) || id
      );
      const tagDisplay = tagNames.join('/');

      // 通过事件通知父组件更新文档数据
      this.emitUpdateDocument({
        tags: [...this.tempSelectedTagPath],
        effectDate: this.tempEffectDate
      });

      if (tagDisplay) {
        this.$message.success(`已设置标签为: ${tagDisplay}`);
      }

      this.tagEditVisible = false;
    }

    // 处理标签编辑取消
    handleTagEditCancel(): void {
      this.tagEditVisible = false;
    }

    // 处理规则选择变更
    handleRuleChange(ruleId: string): void {
      this.emitRuleSelected(ruleId);
    }

    // Emit 装饰器方法
    @Emit('go-back')
    emitGoBack(): void {
      // 无需返回值
    }

    @Emit('submit-review')
    emitSubmitReview(data: ReviewSubmitData): ReviewSubmitData & {
      categoryMain?: string;
      categoryId?: string;
      effectDateStr?: string | null;
    } {
      // 根据新的后端逻辑，categoryMain是最终选择的分类名称，categoryId是最终选择的分类ID
      let categoryMain: string | undefined;
      let categoryId: string | undefined;

      if (this.document.tags && this.document.tags.length > 0) {
        const resolvedTags = this.resolveTagsToIds(this.document.tags);
        const lastResolvedTag = resolvedTags[resolvedTags.length - 1];
        categoryId = lastResolvedTag;
        categoryMain = this.getCategoryNameById(lastResolvedTag) || lastResolvedTag;
      }

      const effectDateStr = this.document.effectDate;

      return {
        ...data,
        categoryMain,
        categoryId,
        effectDateStr
      };
    }

    @Emit('update-document')
    emitUpdateDocument(updateData: { tags: string[]; effectDate: string | null }): {
      tags: string[];
      effectDate: string | null;
    } {
      return updateData;
    }

    @Emit('rule-selected')
    emitRuleSelected(ruleId: string): string {
      return ruleId;
    }
  }

  export default DocumentCompare;
</script>

<style lang="less">
  @import '~/assets/styles/lawyer.less';

  .document-compare-wrapper {
    .lawyer-compare-page {
      height: calc(100vh - 190px);
      display: flex;
      flex-direction: column;
      background: var(--lawyer-surface);
      overflow: hidden;
    }

    .lawyer-header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .lawyer-compare-main-container {
      display: flex;
      padding: 5px;
      gap: 24px;
      flex: 1;
      min-height: 0; // 关键：允许flex子项收缩
      overflow: hidden;
    }

    .lawyer-document-column,
    .review-content-column {
      background: var(--lawyer-surface);
      border: 1px solid var(--lawyer-border);
      border-radius: 8px;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.07);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-height: 0; // 关键：允许flex子项收缩
    }

    .lawyer-document-column {
      flex: 1;
      position: relative;

      &.is-loading::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    .review-content-column {
      flex-basis: 300px;
      border-left: 1px solid var(--lawyer-border);
    }

    .lawyer-column-header {
      padding: 8px 20px;
      font-size: 16px;
      font-weight: 600;
      border-bottom: 1px solid #d9d9d9;
    }

    .lawyer-column-content {
      overflow-y: auto;
      flex: 1; // 使用flex占据剩余空间
      min-height: 0; // 允许收缩
      white-space: pre-wrap; // 保留换行符
      word-break: break-word; // 长单词换行
    }

    .lawyer-compare-header {
      background: var(--lawyer-surface);
      padding: 4px 10px;
      display: flex;
      align-items: center;
      flex-shrink: 0;
      z-index: 1000;

      .lawyer-header-content {
        margin-right: auto;

        .lawyer-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        h3 {
          margin: 0;
          font-weight: 600;
          font-size: 18px;
          flex: 1;
          min-width: 0; // 允许标题在必要时收缩
        }

        .lawyer-document-tags {
          display: flex;
          align-items: center;
          gap: 8px;

          .lawyer-editable-tag {
            cursor: pointer;
            transition: all 0.3s;
            font-size: 12px;
            padding: 4px;
            border-radius: 4px;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            .lawyer-tag-edit-icon {
              font-size: 10px;
              opacity: 0.7;
            }

            &.lawyer-empty-tag {
              border-style: dashed;
              opacity: 0.8;
            }
          }
        }
      }
    }

    // 通用版本信息样式
    .version-info {
      color: #666;
      font-weight: normal;
      margin-left: 8px;
    }

    .review-summary {
      padding: 12px 20px;
      background-color: #fff7e6;
      border-bottom: 1px solid #d9d9d9;
      display: flex;
      align-items: center;
      gap: 8px;
      color: #333;
    }

    .summary-icon {
      color: #fa8c16;
      font-size: 16px;
    }

    .change-count {
      color: #fa8c16;
      font-weight: 600;
    }

    .review-content {
      flex: 1;
      overflow-y: auto;
      padding: 16px 20px;
    }

    .no-changes {
      text-align: center;
      color: #999;
      font-style: italic;
      padding: 40px 20px;
    }

    .change-item {
      margin-bottom: 24px;

      &:last-child {
        margin-bottom: 0;
      }
    }

    .change-title {
      font-size: 16px;
      font-weight: 600;
      color: #333;
      margin-bottom: 8px;
      line-height: 1.4;
    }

    .change-detail {
      line-height: 1.6;
    }

    .change-text {
      color: #666;
    }

    .highlight-text {
      background-color: #fff2cc;
      padding: 2px 4px;
      border-radius: 2px;
      color: #333;
      font-weight: 500;
    }

    .deleted-text {
      color: #ff4d4f;
      text-decoration: line-through;
    }

    .info-message {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background-color: #f6ffed;
      border: 1px solid #b7eb8f;
      border-radius: 6px;
      color: #52c41a;
      .info-icon {
        font-size: 16px;
        color: #52c41a;
      }
    }

    .lawyer-empty-content {
      color: #999;
      font-style: italic;
      padding: 20px;
      text-align: center;
    }

    .lawyer-error-content {
      color: var(--lawyer-danger);
      font-weight: 600;
      padding: 20px;
      text-align: center;
      border: 1px dashed var(--lawyer-danger);
      margin: 20px;
      border-radius: 4px;
    }

    .lawyer-loading-spinner {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
    }

    .lawyer-version-warning {
      color: var(--lawyer-danger);
      font-size: 12px;
      margin-top: 8px;
    }

    // 标签编辑弹窗样式
    .lawyer-tag-edit-content {
      .lawyer-tag-select-row {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 20px;
        label {
          font-weight: 500;
          color: #333;
          min-width: 80px;
        }
      }
    }
  }
</style>
