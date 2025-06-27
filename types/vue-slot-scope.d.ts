import Vue, { VNode } from "vue";

// 为插槽作用域声明类型
declare module "vue/types/vue" {
  interface Vue {
    // 声明 $scopedSlots 的类型
    $scopedSlots: {
      [key: string]: ((props: any) => VNode[] | undefined) | undefined;
    };
  }
}

// 为 Table 等组件的插槽作用域声明特定类型
declare namespace SlotScopes {
  // 表格列自定义渲染参数
  interface TableColumn {
    text: any;
    record: any;
    index: number;
  }

  // 表格行操作参数
  interface TableAction {
    text: any;
    record: any;
    index: number;
  }

  // 表格标题参数
  interface TableTitle {
    text: string;
    record: any;
  }

  // 表格状态参数
  interface TableStatus {
    text: string;
  }

  // 表格类型参数
  interface TableType {
    text: string;
  }
}
