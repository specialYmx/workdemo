import Vue from "vue";

// 声明 Ant Design Vue 组件类型
declare module "ant-design-vue/types" {
  export interface TableColumn {
    title: string;
    dataIndex?: string;
    key: string;
    customRender?: string;
    sorter?: Function;
    filters?: Array<{ text: string; value: string }>;
    onFilter?: Function;
    scopedSlots?: { customRender: string };
  }

  export interface TableProps {
    columns: TableColumn[];
    dataSource: any[];
    pagination?: any;
    loading?: boolean;
    rowKey?: string | Function;
    rowSelection?: any;
    onChange?: Function;
  }
}

// 扩展 Vue 实例以支持 Ant Design Vue 注入的属性
declare module "vue/types/vue" {
  interface Vue {
    // 消息提示
    $message: {
      success(content: string, duration?: number): void;
      error(content: string, duration?: number): void;
      info(content: string, duration?: number): void;
      warning(content: string, duration?: number): void;
      warn(content: string, duration?: number): void;
      loading(content: string, duration?: number): void;
    };

    // 模态框
    $modal: {
      confirm(options: any): void;
      info(options: any): void;
      success(options: any): void;
      warning(options: any): void;
      error(options: any): void;
    };

    // 通知
    $notification: {
      open(config: any): void;
      success(config: any): void;
      info(config: any): void;
      warning(config: any): void;
      error(config: any): void;
      close(key: string): void;
      destroy(): void;
    };
  }
}

// 声明组件的全局类型
declare module "vue/types/vue" {
  interface VueConstructor {
    component(name: string, component: any): VueConstructor;
  }
}

// 为 slot-scope 声明类型
declare module "vue/types/options" {
  interface ComponentOptions<V extends Vue> {
    scopedSlots?: {
      [key: string]: (props: any) => any;
    };
  }
}
