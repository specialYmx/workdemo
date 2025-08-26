import {
  CrawlStatisticsQueryParams,
  CrawlStatisticsResponse,
  ExecuteCrawlTaskParams,
  ExecuteCrawlTaskResponse,
} from "~/model/LawyerConfig";
// 法律合规智能系统数据模型

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
  type: "add" | "delete" | "modify" | "info";
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
  checkStatus?: string; // 原始审核状态
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
  documentNo: string | null;
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

// 审核相关基础接口（包含共同属性）
export interface BaseAuditRuleItem {
  id: string;
  diffResultId: string | null;
  ruleName: string;
  documentNo: string | null; // 文号，如："银保监发〔2021〕47号"
  websiteName: string; // 网站名称，如："中国政府网"
  legalSource: string | null; // 发布机构，如："国家金融监督管理总局"
  url: string;
  publishTime: string | null; // 发布时间，如："2025-08-06"
  effectDate: string | null; // 生效日期，如："2021-12-08"
  categoryMain: string | null; // 主分类
  categorySub: string | null; // 子分类
  effectivenessLevel: string | null; // 效力层级，如："部门规章规范性文件"
  filePathTxt: string | null; // txt文件路径
  filePathOther: string | null; // 其他文件路径，如docx
  fileVersion: number; // 文件版本号
  updateTime: string | null; // 更新时间
  checkStatus: string; // 审核状态，如："待审核"、"已通过"、"已驳回"
  deleted: number; // 删除标记，0表示未删除
  createdTime: string; // 创建时间，如："2025-08-13T19:14:27"
  currentMaxFileVersion: number; // 当前最大文件版本
  parentId: string | null; // 父级ID
  ruleType: string | null; // 规则类型，如："notice_node"
  invokeContent: string | null; // 调用内容
  noticeContent: string | null; // 通知内容，JSON字符串格式
}

// 人工审核列表项接口（基于真实数据结构）
export interface ToDoRuleItem extends BaseAuditRuleItem {
  checkTime: string | null; // 审核时间（待审核时可能为null）
}

// 已完成审核列表项接口（基于真实数据结构）
export interface CompletedRuleItem extends BaseAuditRuleItem {
  checkTime: string; // 审核时间（已完成审核必然有审核时间）
}

// ==================== 通用数据模型 ====================
export interface FileCompareDetail {
  newFileVersion: number | null;
  effectDate: string;
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
  getRuleList: (
    params?: CheckRuleQueryParams,
    useCase?: "homepage" | "management"
  ) => Promise<ToDoRuleItem[]>;

  // ==================== 爬取统计相关方法 ====================
  getCrawlHtmlList: (
    params: CrawlStatisticsQueryParams
  ) => Promise<CrawlStatisticsResponse>;
  executeCrawlTask: (
    params: ExecuteCrawlTaskParams
  ) => Promise<ExecuteCrawlTaskResponse>;
}

// ==================== 图表数据相关类型定义 ====================

// 图例项
export interface LegendItem {
  name: string;
  value: number;
  color: string;
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

// 颜色映射
export type SourceColorMap = StringMap;

// 更新项（法规更新列表显示）
export interface UpdateItem {
  id: string;
  title: string;
  description: string;
  fileContent?: string;
  summary?: string;
  summaryArray: string[]; // 预处理的摘要数组
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
  checkStatus?: string; // 原始审核状态
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
  query?: string;
  field?: string;
}

// 法规来源查询参数
export interface RuleSourceQueryParams extends BaseQueryParams {
  query?: string;
  keyWord?: string;
  timeLiness?: string;
  effectivenessLevel?: string;
  categoryMain?: string;
  categorySub?: string;
  legalSource?: string;
  publishDateSort?: string;
  publishDateStr?: string;
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

// 调度状态数据
export interface ScheduleStatusData {
  status: "running" | "stopped" | "pending";
  lastRun?: string;
  nextRun?: string;
  message?: string;
}
