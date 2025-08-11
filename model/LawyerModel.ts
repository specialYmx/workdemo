// 法律合规智能系统数据模型

// ==================== 核心类型定义（优先导出）====================

// 饼图系列数据
export interface PieChartSeries {
  data: PieChartDataItem[];
  type?: string;
  name?: string;
}

// 饼图数据项
export interface PieChartDataItem {
  name: string;
  value: number;
  itemStyle?: {
    color?: string;
  };
}

// 趋势图轴数据
export interface TrendChartAxisData {
  data: string[] | number[];
}

// 趋势图系列数据
export interface TrendChartSeriesData {
  data: number[];
}

// 文档变更项
export interface DocumentChange {
  section?: string;
  position?: string;
  sectionDisplay?: string; // 展示用的原始章节文本（如“第一章”“第四条”）
  type: "add" | "delete" | "modify";
  oldText?: string;
  newText?: string;
}

// 图表数据结构
export interface ChartData {
  series: PieChartSeries[];
}

// 趋势图数据结构
export interface TrendChartData {
  xAxis?: TrendChartAxisData;
  series?: TrendChartSeriesData[];
}

// 文档查看器显示的文档对象
export interface DocumentViewerData {
  id: string;
  title: string;
  date: string;
  effectiveDate: string;
  publisher: string;
  fileNumber: string;
  status: string;
  views: number;
  content: string;
  isRevoke: boolean;
  timeLiness: string;
}

// 文档比较数据
export interface DocumentCompareData {
  id: string;
  title: string;
  status: string;
  tags?: string[];
  effectDate?: string | null;
  newFileVersion?: number | null;
  oldFileVersion?: number | null;
  currentMaxFileVersion?: number | null;
  originalContent?: string;
  newContent?: string;
  oldPublishTime?: string;
  newPublishTime?: string;
  modifiedDate?: string;
  changes: DocumentChange[];
}

// 审核提交数据
export interface ReviewSubmitData {
  action: string;
  comment: string;
}

// 文件上传配置
export interface UploadConfig {
  multiple?: boolean;
  acceptTypes?: string;
  maxFileSize?: number;
  maxFileCount?: number;
  uploadText?: string;
  hintText?: string;
  autoUpload?: boolean;
}

// 文件变化事件数据
export interface FileChangeData {
  files: File[];
  currentFile: File | null;
}

// 上传成功事件数据
export interface UploadSuccessData {
  files: File[];
  file: File | null;
  documentId: string;
}

// 上传失败事件数据
export interface UploadErrorData {
  files: File[];
  error: Error | unknown;
}

// ==================== 通用类型定义 ====================

// 搜索匹配位置信息
export interface MatchPosition {
  start: number; // 匹配开始位置
  length: number; // 匹配长度
}

// 搜索匹配位置集合
export type MatchesPosition = Record<string, MatchPosition[]>;

// ==================== 基础参数接口 ====================

// 通用字符串映射接口
export interface StringMap {
  [key: string]: string;
}

// 通用混合类型映射接口
export interface MixedMap {
  [key: string]: string | number | boolean | null | undefined;
}

// 基础查询参数接口
export interface BaseQueryParams extends MixedMap {}

// 通用查询参数接口（继承基础参数）
export interface QueryParams extends BaseQueryParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ==================== 专用参数接口 ====================

// 文件删除参数
export interface DeleteRuleParams extends MixedMap {
  id: string;
}

// 文件下载参数
export interface DownloadFileParams extends MixedMap {
  searchId: string;
  fileType?: string;
}

// 收藏操作参数
export interface CollectParams extends MixedMap {
  searchId: string;
  empId: string;
  isCollect: boolean;
}

// 文件上传参数
export interface UploadParams {
  id: string;
  file: File;
  [key: string]: File | string | number | boolean | undefined;
}

// 审核操作参数
export interface ApprovalParams extends MixedMap {
  id: string;
  approvalComment: string;
  effectDateStr?: string | null;
  categoryMain?: string;
  categorySub?: string;
}

// 导出参数
export interface ExportParams {
  ids?: string[];
  id?: string;
  format?: "excel" | "pdf";
}

// HTTP响应头接口
export interface ResponseHeaders {
  [key: string]: string | string[] | undefined;
  "content-disposition"?: string;
  "content-type"?: string;
  "content-length"?: string;
}

// ==================== 首页统计相关数据模型 ====================

// ==================== 大家智库相关数据模型 ====================

// 法规数据基础接口（公共字段）
export interface BaseRuleItem {
  id: string;
  ruleName: string;
  websiteName: string;
  legalSource?: string;
  createdTimeStr: string;
  createdTimestamp: number;
  categoryMain: string;
  categorySub: string;
  timeLiness: string;
  fileContent: string;
  publishDateStr: string;
  publishDateTimestamp: number;
  effectDateStr: string | null;
  effectDateTimestamp: number | null;
  modifyDateStr: string | null;
  modifyDateTimestamp: number | null;
  revokeDateStr: string | null;
  revokeDateTimestamp: number | null;
  filePathTxt: string;
  filePathOther: string;
  fileVersion: number;
  updateTimeStr: string | null;
  updateTime: string | null;
  updateTimestamp: number | null;
  summary: string;
  readCount: number;
  docNo: string | null;
  url: string | null;
  checkStatus: string | null;
  checkTime: string | null;
  thinktankType: string | null;
  compilationType: string | null;
  effectivenessLevel: string;
  topicCategory: string | null;
  diffResultId: string | null;
  initDataFlag: number;
  deleted: number;
  _matchesPosition: MatchesPosition;
}

// 法规文档信息（基于真实API数据结构）
export interface KnowledgeDataItem extends BaseRuleItem {
  createdTime: string | null;
  publishTime: string | null;
  effectDate: string | null;
  isCollect?: boolean; // 收藏状态字段
}

// 法规更新列表项接口（基于真实API数据结构）
export interface RuleUpdateItem extends BaseRuleItem {
  currentMaxFileVersion: number | null;
  documentNo: string | null;
}

// ==================== 人工审核相关数据模型 ====================

// 人工审核列表项接口（基于mock数据结构）
export interface ToDoRuleItem {
  id: string;
  diffResultId: string | null;
  ruleName: string;
  websiteName: string;
  legalSource?: string; // 发布机构或来源信息，替代 websiteName 使用
  url: string;
  publishTime: string | null;
  effectDate: string | null;
  categoryMain: string;
  categorySub: string;
  thinktankType: string | null;
  compilationType: string | null;
  effectivenessLevel: string | null;
  topicCategory: string | null;
  filePathTxt: string | null;
  filePathOther: string | null;
  fileVersion: string | null;
  updateTime: string | null;
  checkTime: string | null;
  checkStatus: string | null;
  deleted: number;
  createdTime: string;
  newFileVersion?: number | null; // 新增字段：新文件版本
  currentMaxFileVersion?: number | null; // 新增字段：当前最大文件版本
}

// 已完成审核列表项接口（基于completeRuleList数据结构）
export interface CompletedRuleItem {
  id: string;
  diffResultId: string | null;
  ruleName: string;
  documentNo: string | null;
  websiteName: string;
  legalSource?: string; // 发布机构或来源信息，替代 websiteName 使用
  url: string;
  publishTime: string | null;
  effectDate: string | null;
  categoryMain: string | null;
  categorySub: string | null;
  thinktankType: string | null;
  compilationType: string | null;
  effectivenessLevel: string | null;
  topicCategory: string | null;
  filePathTxt: string | null;
  filePathOther: string | null;
  fileVersion: string | null;
  updateTime: string | null;
  checkTime: string;
  checkStatus: string; // "已通过" | "已驳回"
  noticeContent: string | null;
  invokeContent: string | null;
  deleted: number;
  createdTime: string;
  ruleType: string;
  currentMaxFileVersion: number | null;
  pid: string | null;
}

// ==================== 通用数据模型 ====================

// 分页响应结果
export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface FileCompareDetail {
  newFileVersion: number | null;
  effect_date: string;
  newFileContent: string;
  categoryMain: string;
  categorySub?: string; // 添加二级分类
  newPublishTime: string;
  oldFileContent: string;
  oldFileVersion?: number; // 修改前文档版本
  oldPublishTime?: string; // 修改前文档发布时间
  checkResult: string;
  currentMaxFileVersion: number;
  id?: string; // 添加ID
  checkStatus?: string; // 添加审核状态
}
// 法律合规智能系统服务接口定义
export interface RoadLawyerService {
  // ==================== 首页统计相关方法 ====================
  getCheckCompleteList: (params?: QueryParams) => Promise<CompletedRuleItem[]>;
  getUpdateCount: (params?: QueryParams) => Promise<number>;
  getUpdateTimeLinessCount: (
    params?: QueryParams
  ) => Promise<TimelinessCountData>;
  getWebSiteRatio: (params?: QueryParams) => Promise<WebsiteRatioData>;
  exportStatisticExcel: (params: {
    condition: string;
  }) => Promise<{ data: Blob; headers: ResponseHeaders } | null>;

  // ==================== 大家智库相关方法 ====================
  deleteRuleSource: (params: DeleteRuleParams) => Promise<boolean>;
  downloadRuleFile: (
    params: DownloadFileParams
  ) => Promise<{ data: Blob; headers: ResponseHeaders }>;
  getRuleSourceCollect: (params: QueryParams) => Promise<KnowledgeDataItem[]>;
  getRuleSourceDetail: (params: {
    searchId: string;
    isRevoke?: boolean;
  }) => Promise<KnowledgeDataItem | null>;
  getRuleSourceList: (
    params: RuleSourceQueryParams
  ) => Promise<KnowledgeDataItem[]>;
  getRuleUpdateList: (
    params: RuleUpdateQueryParams
  ) => Promise<RuleUpdateItem[]>;
  initData: (params?: QueryParams) => Promise<boolean>;
  saveOrCancelCollect: (params: CollectParams) => Promise<boolean>;
  updateTimeLinessSchedule: (params: QueryParams) => Promise<boolean>;
  uploadRuleSource: (params: UploadParams) => Promise<boolean>;

  // ==================== 人工审核相关方法 ====================
  approveToDoRule: (params: ApprovalParams) => Promise<boolean>;
  deleteToDoRule: (params: DeleteRuleParams) => Promise<boolean>;
  exportExcel: (
    params: ExportParams
  ) => Promise<{ data: Blob; headers: ResponseHeaders }>;
  getDiffResultSchedule: (params: QueryParams) => Promise<ScheduleStatusData>;
  getToDoRuleDetail: (params: { id: string }) => Promise<FileCompareDetail>;
  getCheckRuleList: (
    params: CheckRuleQueryParams
  ) => Promise<PageResult<ToDoRuleItem>>;
}

// ==================== 图表数据相关类型定义 ====================

// 图例项
export interface LegendItem {
  name: string;
  value: number;
  color: string;
}

// ECharts 饼图配置选项
export interface PieChartOptions {
  color: string[];
  tooltip: {
    trigger: string;
    formatter: (params: EChartsFormatterParams) => string;
    backgroundColor: string;
    borderColor: string;
    textStyle: {
      color: string;
      fontSize: number;
    };
    extraCssText: string;
  };
  legend: {
    show: boolean;
  };
  series: Array<{
    name: string;
    type: string;
    radius: string[];
    center: string[];
    avoidLabelOverlap: boolean;
    label: {
      show: boolean;
      position: string;
      formatter: (params: EChartsFormatterParams) => string;
      fontSize: number;
      color: string;
      lineHeight: number;
    };
    emphasis: {
      label: {
        show: boolean;
        fontSize: string;
        fontWeight: string;
        color: string;
      };
      itemStyle: {
        shadowBlur: number;
        shadowOffsetX: number;
        shadowColor: string;
      };
    };
    labelLine: {
      show: boolean;
      length: number;
      length2: number;
      lineStyle: {
        color: string;
        width: number;
      };
    };
    data: PieChartDataItem[];
  }>;
}

// 审核状态样式映射
export interface ReviewStatusClassMap extends StringMap {
  已通过: string;
  已驳回: string;
  pending: string;
}

// 时间选项
export interface TimeOption {
  label: string;
  value: string;
}

// ECharts 线图配置选项
export interface LineChartOptions {
  grid: {
    top: string;
    left: string;
    right: string;
    bottom: string;
    containLabel: boolean;
  };
  tooltip: {
    trigger: string;
    axisPointer: {
      type: string;
    };
  };
  xAxis: {
    type: string;
    data: string[] | number[];
    axisTick: {
      alignWithLabel: boolean;
    };
    axisLine: {
      lineStyle: {
        color: string;
      };
    };
    axisLabel: {
      color: string;
    };
  };
  yAxis: {
    type: string;
    axisLine: {
      show: boolean;
    };
    axisTick: {
      show: boolean;
    };
    splitLine: {
      lineStyle: {
        color: string;
      };
    };
    axisLabel: {
      color: string;
    };
  };
  series: Array<{
    name: string;
    type: string;
    smooth: boolean;
    data: number[];
    itemStyle: {
      color: string;
    };
    lineStyle: {
      width: number;
      color: string;
    };
    symbol: string;
    symbolSize: number;
    areaStyle: {
      color: {
        type: string;
        x: number;
        y: number;
        x2: number;
        y2: number;
        colorStops: Array<{
          offset: number;
          color: string;
        }>;
      };
    };
  }>;
}

// 图标类型映射
export interface IconTypeMap extends StringMap {
  已通过: string;
  已驳回: string;
}

// 文档元数据项
export interface DocumentMetaItem {
  icon: string;
  content: string;
}

// 消息服务接口
export interface MessageService {
  success(content: string, duration?: number): void;
  error(content: string, duration?: number): void;
  info(content: string, duration?: number): void;
  warning(content: string, duration?: number): void;
  warn(content: string, duration?: number): void;
  loading(content: string, duration?: number): void;
  destroy(): void;
}

// 审核操作
export interface ReviewAction {
  text: string;
  type: string;
  handler: () => void;
}

// 文档列配置
export interface DocumentColumn {
  title: string;
  version?: string;
  date?: string;
  content: string;
  contentClass: string;
}

// 级联选择器选项（统一接口）
export interface CascaderOption {
  value: string;
  label: string;
  children?: CascaderOption[];
}

// AI消息
export interface AiMessage {
  content: string;
  isUser: boolean;
  isWelcome?: boolean; // 标识是否为欢迎消息
}

// 主页图表加载状态
export interface IndexPageChartLoading {
  trend: boolean;
  sources: boolean;
}

// 主页图表数据状态
export interface IndexPageChartData {
  trend: TrendChartData;
  sources: ChartData;
}

// 主页列表加载状态
export interface IndexPageListLoading {
  recentReviews: boolean;
  topReviews: boolean;
  latestUpdates: boolean;
}

// 时间范围映射
export type TimeRangeMap = StringMap;

// 颜色映射
export type SourceColorMap = StringMap;

// 更新项（法规更新列表显示）
export interface UpdateItem {
  id: string;
  title: string;
  description: string;
  fileContent?: string;
  summary?: string;
  date: string;
  source: string;
  category: string;
  type: string;
  tags: string[];
}

// 筛选选项
export interface FilterOption {
  label: string;
  value: string;
}

// 标签类名映射
export type TagClassMap = StringMap;

// 搜索按钮配置
export interface SearchButton {
  text: string;
  icon?: string;
  type?: string;
  loading?: boolean;
  isActive: boolean;
  count?: number;
  handler: () => void;
}

// 网站选项
export interface WebsiteOption {
  value: string;
  label: string;
}

// 文档操作按钮
export interface DocumentAction {
  text: string;
  type?: string;
  class?: string;
  icon?: string;
  handler: () => void;
}

// 上传配置（扩展版本）
export interface KnowledgeUploadConfig {
  multiple: boolean;
  acceptTypes: string;
  maxFileSize: number;
  maxFileCount: number;
  uploadText: string;
  hintText: string;
  autoUpload: boolean;
}

// 章节信息

// 文档变更项
export type ChangeItem = DocumentChange;

// 文档比较页面数据
export interface DocumentComparePageData {
  id: string;
  title: string;
  status: string;
  tags: string[];
  originalVersion: string;
  newVersion: string | number;
  originalContent: string;
  newContent: string;
  changes: ChangeItem[];
  modifiedDate?: string;
  effectDate?: string | null;
  oldFileVersion?: string | number | null;
  oldPublishTime?: string | null;
  newFileVersion?: string | number | null;
  newPublishTime?: string | null;
  currentMaxFileVersion?: number;
}

// 状态映射
export type StatusMap = StringMap;

// 路由查询参数
export interface RouteQuery {
  id?: string;
  pageTitle?: string;
  isRevoke?: string;
  [key: string]: string | string[] | null | undefined;
}

// 法规更新查询参数
export interface RuleUpdateQueryParams extends BaseQueryParams {
  filed?: string;
}

// 法规来源查询参数
export interface RuleSourceQueryParams extends BaseQueryParams {
  query?: string;
  timeLiness?: string;
  effectivenessLevel?: string;
  categoryMain?: string;
  categorySub?: string;
  legalSource?: string;
  publishDateSort?: string;
  empId: string;
}

// 审核查询参数
export interface CheckRuleQueryParams extends BaseQueryParams {
  condition?: string;
  checkStatus?: string;
  category?: string;
}

// 日期范围
export type DateRange = (string | Date | number)[] | null;

// 时间线统计数据
export interface TimelinessCountData {
  modify: number[];
  public: number[];
  revoke: number[];
}

// 网站比例数据
export interface WebsiteRatioData {
  [websiteName: string]: number;
}

// 表格行选择配置（恢复，避免依赖 CommonModel，且不使用 any）
export interface RowSelectionConfig<T = unknown> {
  selectedRowKeys: string[];
  onChange: (selectedRowKeys: string[], selectedRows: T[]) => void;
  onSelectAll: (selected: boolean, selectedRows: T[], changeRows: T[]) => void;
  getCheckboxProps: (record: T) => { disabled: boolean; name: string };
}

// ECharts 格式化器参数
export interface EChartsFormatterParams {
  name: string;
  value: number;
  percent: number;
  data?: unknown;
  seriesName?: string;
  color?: string;
}

// 调度状态数据
export interface ScheduleStatusData {
  status: "running" | "stopped" | "pending";
  lastRun?: string;
  nextRun?: string;
  message?: string;
}
