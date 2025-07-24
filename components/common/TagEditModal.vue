<template>
  <a-modal
    :title="title"
    :visible="visible"
    @ok="handleOk"
    @cancel="handleCancel"
    :width="600"
    okText="确认"
    cancelText="取消"
  >
    <div class="lawyer-tag-edit-content">
      <!-- 标签分类选择 -->
      <div class="lawyer-tag-select-row">
        <label>选择分类</label>
        <a-cascader
          v-model="selectedTagPath"
          :options="tagOptions"
          placeholder="全部分类"
          :show-search="true"
          :change-on-select="allowParentSelect"
          style="width: 300px"
        />
      </div>

      <!-- 施行日期选择 -->
      <div class="lawyer-tag-select-row">
        <label>施行日期</label>
        <a-date-picker 
          v-model="effectDate" 
          format="YYYY-MM-DD" 
          placeholder="请选择施行日期"
          style="width: 300px"
        />
      </div>

      <!-- 文档状态选择（仅在文档详情页显示） -->
      <div v-if="showDocumentStatus" class="lawyer-tag-select-row">
        <label>文档状态</label>
        <a-select
          v-model="selectedStatus"
          placeholder="请选择文档状态"
          style="width: 300px"
        >
          <a-select-option
            v-for="status in documentStatusOptions"
            :key="status.value"
            :value="status.value"
          >
            {{ status.label }}
          </a-select-option>
        </a-select>
      </div>
    </div>
  </a-modal>
</template>

<script lang="ts">
// @ts-nocheck
import { Component, Vue, Prop, Watch, Emit } from "nuxt-property-decorator";
import { cascaderOptions } from "~/enum/Category";

interface TagOption {
  value: string;
  label: string;
  children?: TagOption[];
}

interface StatusOption {
  value: string;
  label: string;
}

@Component
export default class TagEditModal extends Vue {
  @Prop({ type: Boolean, default: false }) visible!: boolean;
  @Prop({ type: String, default: "选择分类" }) title!: string;
  @Prop({ type: Array, default: () => [] }) currentTags!: string[];
  @Prop({ type: String, default: "" }) currentStatus!: string;
  @Prop({ type: Boolean, default: false }) showDocumentStatus!: boolean;
  @Prop({ type: Boolean, default: true }) allowParentSelect!: boolean;
  @Prop({ type: String, default: null }) currentEffectDate!: string | null;

  // 内部状态
  selectedTagPath: string[] = [];
  selectedStatus = "";
  effectDate: string | null = null;

  // 标签选项数据（从常量文件导入）
  tagOptions: TagOption[] = cascaderOptions;

  // 文档状态选项
  documentStatusOptions: StatusOption[] = [
    { value: "effective", label: "已生效" },
    { value: "pending", label: "待生效" },
    { value: "draft", label: "草案" },
    { value: "deprecated", label: "已废止" },
    { value: "under_review", label: "审查中" },
    { value: "consultation", label: "征求意见中" },
  ];

  @Watch("visible")
  onVisibleChange(newVal: boolean) {
    if (newVal) {
      this.initializeValues();
    } else {
      this.resetValues();
    }
  }

  // 初始化值
  initializeValues() {
    // 设置当前标签路径
    this.selectedTagPath = this.findTagPath(this.currentTags);

    // 设置当前状态
    this.selectedStatus = this.currentStatus;
    
    // 设置施行日期
    this.effectDate = this.currentEffectDate;
  }

  // 重置值
  resetValues() {
    this.selectedTagPath = [];
    this.selectedStatus = "";
    this.effectDate = null;
  }

  // 查找标签在级联选项中的路径
  findTagPath(tags: string[]): string[] {
    if (!tags || tags.length === 0) return [];

    // 如果有两个标签，尝试匹配父子关系
    if (tags.length >= 2) {
      const [firstTag, secondTag] = tags;
      for (const option of this.tagOptions) {
        if (option.value === firstTag && option.children) {
          for (const child of option.children) {
            if (child.value === secondTag) {
              return [firstTag, secondTag];
            }
          }
        }
      }
    }

    // 如果只有一个标签或者没有找到匹配的父子关系
    const currentTag = tags[0];

    // 先检查是否为一级标签
    for (const option of this.tagOptions) {
      if (option.value === currentTag) {
        return [currentTag];
      }

      // 检查是否为二级标签
      if (option.children) {
        for (const child of option.children) {
          if (child.value === currentTag) {
            return [option.value, currentTag];
          }
        }
      }
    }

    return [];
  }

  // 处理确认
  handleOk() {
    // 生成显示标签
    let tagDisplay = "";
    if (this.selectedTagPath.length === 1) {
      tagDisplay = this.selectedTagPath[0];
    } else if (this.selectedTagPath.length >= 2) {
      tagDisplay = `${this.selectedTagPath[0]}/${this.selectedTagPath[1]}`;
    }

    const result: any = {
      tags: this.selectedTagPath,
      tagDisplay: tagDisplay,
      effectDate: this.effectDate
    };

    if (this.showDocumentStatus) {
      result.status = this.selectedStatus;
    }

    this.emitConfirm(result);
  }

  // 处理取消
  handleCancel() {
    this.emitCancel();
  }

  // Emit 装饰器方法
  @Emit("confirm")
  emitConfirm(data: { 
    tags: string[]; 
    tagDisplay: string; 
    effectDate: string | null;
    status?: string; 
  }) {
    return data;
  }

  @Emit("cancel")
  emitCancel() {
    // 无需返回值
  }
}
</script>

<style lang="less" scoped>
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
</style>
