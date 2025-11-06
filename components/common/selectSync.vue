<template>
  <!-- 下拉列表分页搜索 -->
  <div>
    <a-select
      :value="value"
      :allow-clear="allowClear"
      :disabled="disabled"
      :dropdown-match-select-width="false"
      :mode="mode"
      :dropdown-menu-style="{ maxHeight: '150px' }"
      show-search
      :placeholder="placeholder"
      :max-tag-count="maxTagCount"
      :max-tag-text-length="maxTagTextLength"
      :label-in-value="labelInValue"
      :filter-option="filterOption"
      :get-popup-container="triggerNode => triggerNode.parentNode"
      @popupScroll="popupScroll"
      @search="selectSearch"
      @change="handleChange"
      @blur="handleBlur"
    >
      <template v-if="mode === 'multiple'" slot="maxTagPlaceholder" slot-scope="omittedValues">
        <span :title="getOmittedLabels(omittedValues)">+{{ omittedValues?.value?.length }}...</span>
      </template>
      <a-select-option v-for="opt in dataList" :key="opt.value" :value="opt.value">{{
        opt.label
      }}</a-select-option>
    </a-select>
  </div>
</template>
<script lang="ts">
  import { Component, Vue, Prop, Model, Watch, Emit } from 'nuxt-property-decorator';
  import debounce from 'lodash/debounce';
  interface SelectValue {
    key: string | number;
    label: string;
  }
  @Component
  class SelectSyncComponent extends Vue {
    @Model('change')
    value: SelectValue | SelectValue[] | string | string[];

    @Prop({ default: false })
    disabled: boolean;

    @Prop({ default: true })
    allowClear: boolean;

    @Prop({ default: false })
    labelInValue: boolean;

    @Prop({ default: 'default' })
    mode: string;

    @Prop({ default: '' })
    placeholder: string;

    @Prop({ default: 1 })
    maxTagCount: number;

    @Prop({ default: 20 })
    maxTagTextLength: number;

    @Prop({ default: false })
    isCodeShow: boolean;

    @Prop({ default: () => [] })
    options: any[];

    searchValue: string = '';
    dataList = [];
    // 搜索值改变的时候
    page = {
      current: 1,
      size: 8
    };

    // 下拉懒加载
    @Emit('lazyLoad')
    popupScroll(e) {
      const { scrollHeight, scrollTop, clientHeight } = e.target;
      if (scrollHeight - (scrollTop + clientHeight) < 1) {
        this.page.current++;
        // 向父组件发送懒加载事件
        return {
          ...this.page,
          value: this.searchValue
        };
      } else {
        return null;
      }
      // const { scrollHeight, scrollTop, clientHeight } = e.target
      // // 避免重复触发
      // if (!this.isLazyLoading) return null
      // if (scrollHeight - (scrollTop + clientHeight) < 1) {
      //   this.isLazyLoading = true
      //   this.page.current++
      //   // 向父组件发送懒加载事件
      //   return {
      //     ...this.page,
      //     value: this.valueSync,
      //   }
      // }
    }

    getOmittedLabels(val) {
      return val?.value
        ?.map(item => {
          return item.label;
        })
        .join(',');
    }

    // 搜索
    selectSearch = debounce(this.changeShowTwo, 800);
    @Emit('search')
    changeShowTwo(value) {
      this.searchValue = value;
      this.page.current = 1;
      // 向父组件发送搜索事件
      return {
        value,
        ...this.page
      };
    }

    // 下拉选中触发此函数，$emit必须写，实现自定义双向数据绑定的必要步骤
    @Emit('change')
    handleChange(val) {
      // 选择后可以清空搜索值，以便下次搜索从头开始
      this.onReset();
      return val;
    }

    onReset() {
      this.searchValue = '';
      this.page.current = 1;
      // this.dataList = []
    }

    // 失去焦点时清空搜索条件
    handleBlur() {
      // 可选：在下拉框失去焦点时清空搜索条件
      this.onReset();
    }

    filterOption(input, option) {
      return option.componentOptions?.children?.[0]?.text
        .toLowerCase()
        .includes(input.toLowerCase());
    }

    @Watch('options', { immediate: true })
    onOptionsChanged(newVal) {
      // 如果是第一页，则替换数据；否则追加数据
      if (this.page.current === 1) {
        this.dataList = newVal;
      } else {
        // 合并已有的数据和新传入的数据，避免重复项
        const valueSet = new Set(this.dataList.map(item => item.value));
        this.dataList = [...this.dataList, ...newVal.filter(item => !valueSet.has(item.value))];
      }
    }
  }
  export default SelectSyncComponent;
</script>
