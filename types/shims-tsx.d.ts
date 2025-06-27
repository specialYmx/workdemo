import Vue, { VNode } from "vue";

declare global {
  namespace JSX {
    interface Element extends VNode {}
    interface ElementClass extends Vue {}
    interface IntrinsicElements {
      [elem: string]: any;
    }
  }
}

// 扩展Window接口
interface Window {
  [key: string]: any;
}

// 扩展NodeJS接口
declare namespace NodeJS {
  interface Process {
    browser: boolean;
    client: boolean;
    mode: "development" | "production";
    server: boolean;
    static: boolean;
  }
  interface ProcessEnv {
    NODE_ENV: "development" | "production";
    VUE_APP_API_URL: string;
    [key: string]: string | undefined;
  }
}
