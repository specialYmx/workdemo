import { ScopedSlot } from "vue/types/vnode";

// 自定义分页类型
export interface CustomPagination {
  current?: number;
  pageSize: number;
  total?: number;
  showLessItems?: boolean;
  showTotal: (total: number) => string;
  size?: string;
  showQuickJumper?: boolean;
  showSizeChanger?: boolean;
  pageSizeOptions?: string[];
  onChange?: (page: number, pageSize: number) => void;
  onShowSizeChange?: (page: number, pageSize: number) => void;
}

export interface CustomScroll {
  x: number | boolean;
  y: number | boolean;
  scrollToFirstRowOnChange?: boolean;
}
export interface ColumnFilterItem {
  text?: string;
  value?: string;
  children?: any;
  dataIndex?: string;
}

export declare type SortOrder = "ascend" | "descend";
export interface CustomColumn {
  align?: string;
  ellipsis?: boolean;
  colSpan?: number;
  dataIndex?: string;
  defaultFilteredValue?: string[];
  defaultSortOrder?: SortOrder;
  filterDropdown?: any;
  filterDropdownVisible?: boolean;
  filtered?: boolean;
  filteredValue?: string | string[];
  filterIcon?: any;
  filterMultiple?: boolean;
  filters?: ColumnFilterItem[];
  fixed?: boolean | string;
  key?: string;
  customRender?: Function | ScopedSlot;
  sorter?: boolean | Function;
  sortOrder?: boolean | SortOrder;
  sortDirections?: string[];
  title?: any;
  width?: string | number;
  customCell?: (
    record: any,
    rowIndex: number
  ) => Partial<{
    props: object;
    attrs: object;
    on: object;
    class: object;
    style: object;
    nativeOn: object;
  }>;

  customHeaderCell?: (column: any) => {
    props: object;
    attrs: object;
    on: object;
    class: object;
    style: object;
    nativeOn: object;
  };
  onFilter?: Function;

  onFilterDropdownVisibleChange?: (visible: boolean) => void;

  slots?: object;

  scopedSlots?: object;
}

// antd formRuleType
export interface ValidationRule {
  trigger?: string;
  message?: string | (() => string);
  type?: string;
  required?: boolean;
  whitespace?: boolean;
  len?: number;
  min?: number;
  max?: number;
  enum?: string | string[];
  pattern?: RegExp | string;
  transform?: (value: any) => any;
  validator?: (rule: any, value: any, callback: Function) => any;
}
// web操作日志记录
export interface LogInfo {
  // menu: string,
  obj: string; //  页面功能描述
  type: string; //  操作类型详情：比如查询：{查询条件}
  url: string; //  接口地址
}
export interface paramLog {
  paramJson: string; // 请求参数
}
export interface WebLog {
  logInfo: LogInfo;
  paramLog: paramLog;
}
