// Vue 2 模板类型修复 - 解决装饰器组件的ComponentPublicInstance错误
import Vue from "vue";

// 修复Vue模板中的this上下文类型推断问题
declare module "vue/types/vue" {
  interface Vue {
    // 允许访问任意属性，解决装饰器组件的类型推断问题
    [key: string]: any;
  }
}

// 修复Vue组件选项类型
declare module "vue/types/options" {
  interface ComponentOptions<V extends Vue> {
    [key: string]: any;
  }
}

// 移除对 VueConstructor 的宽泛重写，避免污染全局类型

export {};
