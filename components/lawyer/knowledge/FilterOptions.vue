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
      <!-- 新增按钮 - 只有管理员可见 -->
      <a-button
        v-if="isAdmin"
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
      <div class="lawyer-filter-group">
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
      <div class="lawyer-filter-group">
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
      <div class="lawyer-filter-group">
        <a-cascader
          :value="topicCategory"
          change-on-select
          :options="topicCategoryOptions"
          placeholder="分类"
          :show-search="true"
          @change="onTopicCategoryChange"
        />
      </div>
      <!-- 来源筛选 -->
      <div class="lawyer-filter-group">
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
      <div class="lawyer-filter-group">
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
      <div class="lawyer-filter-group">
        <a-select :value="sortOrder" placeholder="排序方式" @change="onSortOrderChange">
          <a-select-option value="desc"> 按发布日期 (新→旧) </a-select-option>
          <a-select-option value="asc"> 按发布日期 (旧→新) </a-select-option>
        </a-select>
      </div>

      <!-- 发文字号 -->
      <div class="lawyer-filter-group">
        <a-input
          :value="documentNumberFilter"
          placeholder="发文字号"
          style="width: 100%"
          :allow-clear="true"
          @input="onDocumentNumberInput"
          @clear="onDocumentNumberClear"
        />
      </div>
      <!-- 责任部门 -->
      <div class="lawyer-filter-group">
        <a-select
          :value="departmentFilter || undefined"
          style="width: 100%"
          placeholder="责任部门"
          :allow-clear="true"
          @change="onDepartmentChange"
          :show-search="true"
          :filter-option="false"
          :max-tag-count="2"
          :max-tag-text-length="8"
          max-tag-placeholder="..."
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
      <div class="lawyer-filter-group">
        <a-select
          :value="isAppendixFilter || undefined"
          style="width: 100%"
          placeholder="是否附录"
          :allow-clear="true"
          @change="onAppendixChange"
        >
          <a-select-option value="true">是</a-select-option>
          <a-select-option value="false">否</a-select-option>
        </a-select>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  import { Component, Vue, Prop, Emit } from 'nuxt-property-decorator';
  import {
    WebsiteOption,
    FilterOption,
    CascaderOption,
    SearchButton,
    DepartmentOption
  } from '~/model/LawyerModel';

  @Component({ name: 'lawyer-knowledge-filter-options' })
  export default class LawyerKnowledgeFilterOptions extends Vue {
    @Prop({ required: true }) categoryName!: string;
    @Prop({ required: true }) isAdmin!: boolean;
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

    @Emit('update:timelinessFilter')
    onTimelinessChange(value: string | undefined): string {
      const result = value || '';
      this.$nextTick(() => {
        this.filterChange();
      });
      return result;
    }

    @Emit('update:effectivenessLevelFilter')
    onEffectivenessLevelChange(value: string | undefined): string {
      const result = value || '';
      this.$nextTick(() => {
        this.filterChange();
      });
      return result;
    }

    @Emit('update:topicCategory')
    onTopicCategoryChange(value: string[]): string[] {
      this.$nextTick(() => {
        this.filterChange();
      });
      return value;
    }

    @Emit('update:filterSource')
    onFilterSourceChange(value: string | undefined): string {
      const result = value || '';
      this.$nextTick(() => {
        this.filterChange();
      });
      return result;
    }

    @Emit('update:publishDate')
    onPublishDateChange(value: string | null | undefined): string {
      // 将null/undefined转换为空字符串，避免Vue props验证警告
      const result = value || '';
      this.$nextTick(() => {
        this.filterChange();
      });
      return result;
    }

    @Emit('update:sortOrder')
    onSortOrderChange(value: string): string {
      this.$nextTick(() => {
        this.filterChange();
      });
      return value;
    }

    @Emit('update:departmentFilter')
    onDepartmentChange(value: string | undefined): string {
      const result = value || '';
      this.$nextTick(() => {
        this.filterChange();
      });
      return result;
    }

    @Emit('update:isAppendixFilter')
    onAppendixChange(value: string | undefined): string {
      const result = value || '';

      this.$nextTick(() => {
        this.filterChange();
      });
      return result;
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
  }
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
      flex: 1;
      flex-basis: 200px;
    }
  }
</style>
