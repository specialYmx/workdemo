// Vue模块声明
declare module "*.vue" {
  import Vue from "vue";
  export default Vue;
}

// Vue类型扩展
declare module "vue/types/vue" {
  interface Vue {
    $router: any;
    $route: any;
    $axios: any;
    $message: any;
    $nuxt: any;
    $store: any;
  }
}

// 路由元数据接口
declare module "vue-router" {
  interface Route {
    meta?: {
      title?: string;
      requiresAuth?: boolean;
      roles?: string[];
      [key: string]: any;
    };
  }
}
