import Vue from "vue";
import echarts from "echarts";

// 将echarts对象挂载到Vue原型上，方便在组件中使用
Vue.prototype.$echarts = echarts;
