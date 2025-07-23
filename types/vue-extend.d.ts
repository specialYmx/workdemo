import Vue from "vue";
import { Route } from "vue-router";
import { LawyerService } from "~/model/LawyerModel";

// 扩展 Vue 实例类型
declare module "vue/types/vue" {
  interface Vue {
    $router: any;
    $route: Route;
    $message: {
      success(content: string, duration?: number): void;
      error(content: string, duration?: number): void;
      info(content: string, duration?: number): void;
      warning(content: string, duration?: number): void;
      warn(content: string, duration?: number): void;
      loading(content: string, duration?: number): void;
    };
    $notification: any;
    $confirm: any;
    $info: any;
    $success: any;
    $error: any;
    $warning: any;
    $modal: any;
    $service: {
      lawyer: LawyerService;
    };
  }
}

// 扩展Nuxt上下文类型
declare module "@nuxt/types" {
  interface Context {
    $message: Vue["$message"];
    $service: Vue["$service"];
  }
}

// 声明插槽作用域类型
declare module "vue/types/options" {
  interface ComponentOptions<V extends Vue> {
    scopedSlots?: {
      [key: string]: (props: any) => any;
    };
  }
}

// 扩展 Vue 作用域插槽类型
declare module "vue/types/v3-component-options" {
  interface ScopedSlotsFixed {
    [key: string]: (props: any) => any;
  }
}

// 扩展 Ant Design Vue 组件类型
declare module "ant-design-vue/types" {
  interface TableColumn {
    customRender?: string;
    scopedSlots?: { customRender: string };
  }
}
