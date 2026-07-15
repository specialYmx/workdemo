<template>
  <div>
    <h1>{{ categoryName }}</h1>
    <p>搜索和浏览法律法规、政策文件、典型案例和解读材料，获取最新的合规信息和专业指导。</p>

    <div class="lawyer-search-form">
      <a-input
        :value="searchText"
        placeholder="输入关键词搜索法规、案例、解读..."
        size="large"
        class="lawyer-search-input"
        :allow-clear="true"
        @keyup.enter="onSearch"
        @input="onSearchInputChange"
        @change="onSearchInputChange"
      />
      <a-button
        v-for="(btn, index) in searchButtons"
        :key="index"
        :type="btn.isActive ? 'primary' : btn.type || 'default'"
        :icon="btn.icon"
        size="large"
        :loading="btn.loading"
        :class="{ 'lawyer-btn-active': btn.isActive }"
        @click="btn.handler"
      >
        {{ btn.text }}{{ btn.count ? ` (${btn.count})` : '' }}
      </a-button>
      <!-- 导出按钮 - 只在法规汇编页面显示 -->
      <a-button
        v-if="categoryName === '法规汇编'"
        type="default"
        icon="download"
        size="large"
        @click="showExportModal"
      >
        导出
      </a-button>
      <!-- 新增按钮 - 只有管理员可见 -->
      <!-- v-if="isAdmin" -->
      <a-button
        v-if="!isRegulation"
        type="primary"
        icon="plus"
        size="large"
        @click="showAddDocumentModal"
      >
        新增文档
      </a-button>
    </div>

    <div class="lawyer-filter-options">
      <!-- 时效性选择器 -->
      <div v-if="filterConfig.showTimeliness" class="lawyer-filter-group">
        <a-select
          :value="timelinessFilter || undefined"
          style="width: 100%"
          placeholder="时效性"
          :allow-clear="true"
          @change="onTimelinessChange"
        >
          <a-select-option
            v-for="option in timelinessOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </a-select-option>
        </a-select>
      </div>
      <!-- 效力位阶选择器 -->
      <div v-if="filterConfig.showEffectivenessLevel" class="lawyer-filter-group">
        <a-select
          :value="effectivenessLevelFilter || undefined"
          style="width: 100%"
          placeholder="效力位阶"
          :allow-clear="true"
          @change="onEffectivenessLevelChange"
        >
          <a-select-option
            v-for="option in effectivenessLevelOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </a-select-option>
        </a-select>
      </div>
      <!-- 分类级联选择器 -->
      <div v-if="filterConfig.showCategory" class="lawyer-filter-group">
        <a-cascader
          class="lawyer-category-cascader"
          :value="topicCategory"
          change-on-select
          :options="topicCategoryOptions"
          placeholder="分类"
          :show-search="true"
          @change="onTopicCategoryChange"
        />
      </div>
      <!-- 来源筛选 -->
      <div v-if="filterConfig.showSource" class="lawyer-filter-group">
        <a-select
          :value="filterSource || undefined"
          style="width: 100%"
          placeholder="选择来源"
          :allow-clear="true"
          @change="onFilterSourceChange"
        >
          <a-select-option
            v-for="option in websiteOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </a-select-option>
        </a-select>
      </div>
      <!-- 发布时间筛选 -->
      <div v-if="filterConfig.showPublishDate" class="lawyer-filter-group">
        <a-date-picker
          :value="publishDate"
          placeholder="发布时间"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          :allow-clear="true"
          @change="onPublishDateChange"
        />
      </div>
      <!-- 排序方式 -->
      <div v-if="filterConfig.showSortOrder" class="lawyer-filter-group">
        <a-select :value="sortOrder" placeholder="排序方式" @change="onSortOrderChange">
          <a-select-option value=""> 按相关度排序 </a-select-option>
          <a-select-option value="desc"> 按发布日期 (新→旧) </a-select-option>
          <a-select-option value="asc"> 按发布日期 (旧→新) </a-select-option>
        </a-select>
      </div>

      <!-- 发文字号 -->
      <div v-if="filterConfig.showDocumentNumber" class="lawyer-filter-group">
        <a-input
          :value="documentNumberFilter"
          placeholder="发文字号"
          style="width: 100%"
          :allow-clear="true"
          @input="onDocumentNumberInput"
          @clear="onDocumentNumberClear"
        />
      </div>
      <!-- 印发部门 -->
      <div v-if="filterConfig.showDepartment" class="lawyer-filter-group">
        <a-select
          :value="departmentFilter || undefined"
          style="width: 100%"
          placeholder="印发部门"
          :allow-clear="true"
          :show-search="true"
          :filter-option="false"
          :max-tag-count="2"
          :max-tag-text-length="8"
          max-tag-placeholder="..."
          @change="onDepartmentChange"
        >
          <a-select-option
            v-for="option in departmentOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </a-select-option>
        </a-select>
      </div>
      <!-- 是否附录 -->
      <div v-if="filterConfig.showAppendix" class="lawyer-filter-group">
        <a-select
          :value="isAppendixFilter || undefined"
          style="width: 100%"
          placeholder="是否附录"
          :allow-clear="true"
          @change="onAppendixChange"
        >
          <a-select-option value="true">仅附录</a-select-option>
          <a-select-option value="false">非附录</a-select-option>
        </a-select>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  import { Component, Vue, Prop, Emit } from 'nuxt-property-decorator';
  import type {
    WebsiteOption,
    FilterOption,
    CascaderOption,
    SearchButton,
    DepartmentOption
  } from '~/model/LawyerModel';

  @Component({ name: 'lawyer-knowledge-filter-options' })
  class LawyerKnowledgeFilterOptions extends Vue {
    @Prop({ required: true }) categoryName!: string;
    @Prop({ required: true }) isAdmin!: boolean;
    @Prop({ default: false }) isRegulation!: boolean;
    @Prop({ required: true }) searchText!: string;
    @Prop({ required: true }) searchButtons!: SearchButton[];
    @Prop({ required: true }) timelinessFilter!: string;
    @Prop({ required: true }) effectivenessLevelFilter!: string;
    @Prop({ required: true }) topicCategory!: string[];
    @Prop({ required: true }) filterSource!: string;
    @Prop({ required: true }) publishDate!: string | null;
    @Prop({ required: true }) sortOrder!: string;
    @Prop({ required: true }) documentNumberFilter!: string;
    @Prop({ required: true }) departmentFilter!: string;
    @Prop({ required: true }) isAppendixFilter!: string;
    @Prop({ required: true }) websiteOptions!: WebsiteOption[];
    @Prop({ required: true }) topicCategoryOptions!: CascaderOption[];
    @Prop({ required: true }) departmentOptions!: DepartmentOption[];

    // 根据当前路由判断页面类型，返回筛选条件显示配置
    get filterConfig(): {
      showTimeliness: boolean;
      showEffectivenessLevel: boolean;
      showCategory: boolean;
      showSource: boolean;
      showPublishDate: boolean;
      showSortOrder: boolean;
      showDocumentNumber: boolean;
      showDepartment: boolean;
      showAppendix: boolean;
    } {
      const routePath = this.$route.path;
      const showDepartmentInKnowledge = routePath.includes('/lawyerKnowledge');

      // 新规解读、处罚汇编、研究集锦、法规合规季刊：只显示"分类"、"发布时间"、"排序方式"
      if (
        routePath.includes('/newRegulationInterpretation') ||
        routePath.includes('/punishmentCompilation') ||
        routePath.includes('/researchCollection') ||
        routePath.includes('/legalComplianceQuarterly')
      ) {
        return {
          showTimeliness: false,
          showEffectivenessLevel: false,
          showCategory: true,
          showSource: false,
          showPublishDate: true,
          showSortOrder: true,
          showDocumentNumber: false,
          showDepartment: false,
          showAppendix: false
        };
      }

      // 制度库：去掉"时效性"、"效力位阶"、"来源"
      if (routePath.includes('/institutionLibrary')) {
        return {
          showTimeliness: false,
          showEffectivenessLevel: false,
          showCategory: true,
          showSource: false,
          showPublishDate: true,
          showSortOrder: true,
          showDocumentNumber: true,
          showDepartment: true,
          showAppendix: true
        };
      }

      // 法规汇编、大家智库：保持所有筛选条件
      return {
        showTimeliness: true,
        showEffectivenessLevel: true,
        showCategory: true,
        showSource: true,
        showPublishDate: true,
        showSortOrder: true,
        showDocumentNumber: true,
        showDepartment: showDepartmentInKnowledge,
        showAppendix: true
      };
    }

    // 发文字号输入处理 - 仅更新值，不触发搜索
    @Emit('update:documentNumberFilter')
    onDocumentNumberInput(e: Event): string {
      const value = (e.target as HTMLInputElement).value;
      return value;
    }

    // 发文字号清空处理 - 仅更新值，不触发搜索
    onDocumentNumberClear(): void {
      this.updateDocumentNumberFilter('');
    }

    get timelinessOptions(): FilterOption[] {
      return [
        { value: '待生效', label: '待生效' },
        { value: '已施行', label: '已施行' },
        { value: '已修订', label: '已修订' },
        { value: '已废止', label: '已废止' }
      ];
    }

    get effectivenessLevelOptions(): FilterOption[] {
      return [
        { value: '法律法规', label: '法律法规' },
        { value: '部门规章规范性文件', label: '部门规章规范性文件' },
        { value: '自律规则', label: '自律规则' },
        { value: '其他', label: '其他' }
      ];
    }

    // 通用的筛选变更处理：将空值统一转换为空字符串并触发筛选刷新
    private handleStringFilterChange(value: string | undefined | null): string {
      const result = value || '';
      this.$nextTick(() => {
        this.filterChange();
      });
      return result;
    }

    // 通用的筛选变更处理：保持原值类型，仅负责触发筛选刷新
    private handleFilterChange<T>(value: T): T {
      this.$nextTick(() => {
        this.filterChange();
      });
      return value;
    }

    @Emit('update:timelinessFilter')
    onTimelinessChange(value: string | undefined): string {
      return this.handleStringFilterChange(value);
    }

    @Emit('update:effectivenessLevelFilter')
    onEffectivenessLevelChange(value: string | undefined): string {
      return this.handleStringFilterChange(value);
    }

    @Emit('update:topicCategory')
    onTopicCategoryChange(value: string[]): string[] {
      return this.handleFilterChange(value);
    }

    @Emit('update:filterSource')
    onFilterSourceChange(value: string | undefined): string {
      return this.handleStringFilterChange(value);
    }

    @Emit('update:publishDate')
    onPublishDateChange(value: string | null | undefined): string {
      // 将 null/undefined 转换为空字符串，避免 Vue props 验证警告
      return this.handleStringFilterChange(value);
    }

    @Emit('update:sortOrder')
    onSortOrderChange(value: string): string {
      return this.handleFilterChange(value);
    }

    @Emit('update:departmentFilter')
    onDepartmentChange(value: string | undefined): string {
      return this.handleStringFilterChange(value);
    }

    @Emit('update:isAppendixFilter')
    onAppendixChange(value: string | undefined): string {
      return this.handleStringFilterChange(value);
    }

    @Emit('filter-change')
    filterChange(): void {
      // 触发筛选变化事件
    }

    @Emit('search-input-clear')
    searchInputClear(): void {
      // 触发搜索输入清空事件
    }

    @Emit('update:documentNumberFilter')
    updateDocumentNumberFilter(value: string): string {
      return value;
    }

    @Emit('search')
    onSearch(): void {
      // 触发搜索事件
    }

    @Emit('update:searchText')
    onSearchInputChange(e: Event): string {
      const value = (e.target as HTMLInputElement).value;

      // 当输入框被清空时，触发清空高亮的事件
      if (!value.trim()) {
        this.searchInputClear();
      }

      return value;
    }

    @Emit('show-add-document-modal')
    showAddDocumentModal(): void {
      // 触发显示新增文档模态框事件
    }

    @Emit('show-export-modal')
    showExportModal(): void {
      // 触发显示导出模态框事件
    }
  }
  export default LawyerKnowledgeFilterOptions;
</script>

<style lang="less" scoped>
  .lawyer-search-form {
    display: flex;
    gap: 12px;
    align-items: center;
    margin-bottom: 24px;
    flex-wrap: wrap;

    .lawyer-search-input {
      flex: 1;
      min-width: 300px;
    }

    .ant-btn {
      height: 40px;
      border-radius: 6px;
      font-weight: 500;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }

      &.lawyer-btn-active {
        background-color: #1890ff;
        color: white;
        border-color: #1890ff;
      }

      &.lawyer-btn-add {
        margin-left: 8px;
        background-color: #52c41a;
        border-color: #52c41a;

        &:hover {
          background-color: #73d13d;
          border-color: #73d13d;
        }
      }
    }
  }

  .lawyer-filter-options {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    margin-bottom: 24px;

    .lawyer-filter-group {
      min-width: 200px;
    }

    .lawyer-category-cascader {
      width: 320px;
    }
  }
</style>
