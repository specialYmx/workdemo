<template>
  <a-select
    :value="text"
    :placeholder="placeholder"
    class="auto-height-select"
    :get-popup-container="getPopContainer"
    show-search
    :mode="mode"
    :disabled="disabled"
    :allow-clear="allowClear"
    :filter-option="false"
    :not-found-content="fetching ? undefined : null"
    :default-active-first-option="false"
    @search="handleSearch"
    @popupScroll="handlePopupScroll"
    @change="onChange"
    @dropdownVisibleChange="dropdownVisibleChange"
  >
    <a-spin v-if="fetching" slot="notFoundContent" size="small" />
    <a-select-option
      v-for="d in dataShowArr"
      :key="d.value || d"
      :value="d.value || d"
      :title="d.label || d"
    >
      {{ d.label || d }}
    </a-select-option>
  </a-select>
</template>
<script lang="ts">
  import { Component, Vue, Prop, Watch, Emit } from 'nuxt-property-decorator';
  import debounce from 'lodash/debounce';

  @Component
  class BigSelectComponent extends Vue {
    @Prop({ required: true })
    public text: string | string[] | number | number[];

    @Prop({ default: '请输入' })
    public placeholder: string;

    @Prop({ default: false })
    public disabled: boolean;

    @Prop({ default: true })
    public allowClear: boolean;

    @Prop({ default: 'default' })
    public mode: string;

    @Prop({ default: true })
    public isSlice: boolean;

    // 是否下拉触发列表查询
    @Prop({ default: false })
    public isDropdownChangeOptions: boolean;

    // 是否默认筛选方式
    @Prop({ default: false })
    public isDefaultFilter: boolean;

    @Prop({
      default: () => {
        return trigger => trigger.parentNode || document.body;
      }
    })
    public getPopContainer;

    @Prop({
      default: () => {
        return [];
      }
    })
    public dataArr: any; // 全部集合

    dataSearchArr: any = []; // 筛选集合
    dataShowArr: any = []; // 显示的集合
    fetching: boolean = false;
    scrollPage: number = 1;
    treePageSize: number = 100;

    handleSearch(val) {
      this.deboSearch(this, val);
    }

    deboSearch = debounce((_this, val) => {
      _this.$set(_this, 'dataShowArr', []);
      _this.scrollPage = 1;
      _this.fetching = true;
      if (_this.isDefaultFilter) {
        _this.filterArray(val);
      } else {
        _this.getData(val);
      }
    }, 500);

    @Emit('getData')
    getData(val) {
      return val;
    }

    filterArray(val) {
      const dataArr = this.dataArr ? [...this.dataArr] : [];
      if (!val) {
        this.changeDataArr(dataArr);
      } else {
        const keyWord: string = val.toLowerCase();
        const dataSearchArr = dataArr.filter(v => {
          return (
            (v.value && v.value.toLowerCase().includes(keyWord)) ||
            (v.label && v.label.toLowerCase().includes(keyWord)) ||
            (v && v.toLowerCase().includes(keyWord))
          );
        });
        this.changeDataArr(dataSearchArr);
      }
      this.fetching = false;
    }

    handlePopupScroll(e) {
      const { target } = e;
      const scrollHeight = target.scrollHeight - target.scrollTop;
      const clientHeight = target.clientHeight;
      if (scrollHeight === 0 && clientHeight === 0) {
        this.scrollPage = 1;
      } else if (scrollHeight < clientHeight + 5) {
        this.scrollPage = this.scrollPage + 1;
        const scrollPage = this.scrollPage; // 获取当前页
        const treePageSize = this.treePageSize * (scrollPage || 1); // 新增数据量
        debounce(_this => {
          let max = null; // max 为能展示的数据的最大条数
          if (_this.dataSearchArr.length > treePageSize) {
            // 如果总数据的条数大于需要展示的数据
            max = treePageSize;
          } else {
            max = _this.dataSearchArr.length;
          }
          console.log('max', scrollPage, treePageSize, max);
          _this.dataShowArr = _this.dataSearchArr.slice(0, max);
        }, 1000)(this);
      }
    }

    @Emit('onChange')
    onChange(val) {
      this.fetching = false;
      return val;
    }

    @Watch('dataArr', { immediate: true })
    changeDataArr(value) {
      this.dataSearchArr = [...value];
      const data = this.isSlice ? value.slice(0, 100) : value;
      this.$set(this, 'dataShowArr', data);
      console.log('changeDataArr', this.dataSearchArr);
      this.fetching = false;
    }

    dropdownVisibleChange() {
      if (this.isDropdownChangeOptions) {
        this.dropdownChangeEvent();
      }
    }

    @Emit('dropdownVisibleChange')
    dropdownChangeEvent() {
      return true;
    }

    created() {
      this.fetching = !!this.isDropdownChangeOptions;
      if (!this.isDefaultFilter && this.text) {
        this.handleSearch(this.text);
      }
    }
  }
  export default BigSelectComponent;
</script>
