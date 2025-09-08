import Vue from "vue";
import { Route } from "vue-router";
import { RoadLawyerService } from "~/model/LawyerModel";

// 扩展 Route 接口以支持 Nuxt.js 的 query
interface NuxtRoute extends Route {
  query: { [key: string]: string | (string | null)[] | null | undefined };
  path: string;
}

// 扩展 Vue 实例类型
declare module "vue/types/vue" {
  interface Vue {
    $router: any;
    $route: NuxtRoute;
    $message: {
      success(content: string, duration?: number): void;
      error(content: string, duration?: number): void;
      info(content: string, duration?: number): void;
      warning(content: string, duration?: number): void;
      warn(content: string, duration?: number): void;
      loading(content: string, duration?: number): void;
      destroy(): void;
    };
    $notification: any;
    $confirm: any;
    $info: any;
    $success: any;
    $error: any;
    $warning: any;
    $modal: any;
    $store: any;
    $axios: any;
    $roadLawyerService: RoadLawyerService;
    $form: {
      createForm(component: any): any;
    };
  }
}

// 扩展 nuxt-property-decorator 的 Vue 基类
declare module "nuxt-property-decorator" {
  interface Vue {
    $router: any;
    $route: NuxtRoute;
    $message: {
      success(content: string, duration?: number): void;
      error(content: string, duration?: number): void;
      info(content: string, duration?: number): void;
      warning(content: string, duration?: number): void;
      warn(content: string, duration?: number): void;
      loading(content: string, duration?: number): void;
      destroy(): void;
    };
    $notification: any;
    $confirm: any;
    $info: any;
    $success: any;
    $error: any;
    $warning: any;
    $modal: any;
    $store: any;
    $axios: any;
    $roadLawyerService: RoadLawyerService;
    $form: {
      createForm(component: any): any;
    };
  }
}

// 扩展Nuxt上下文类型
declare module "@nuxt/types" {
  interface Context {
    $message: Vue["$message"];
    $roadLawyerService: Vue["$roadLawyerService"];
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
