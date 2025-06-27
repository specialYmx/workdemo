import Vue from "vue";
import VueECharts from "vue-echarts";
import echarts from "echarts";

// 注册ECharts组件
Vue.component("v-chart", VueECharts);

// 将echarts对象挂载到Vue原型上，方便在组件中使用
Vue.prototype.$echarts = echarts;
