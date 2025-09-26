import {
  CrawlStatisticsQueryParams,
  CrawlStatisticsResponse,
  ExecuteCrawlTaskParams,
  ExecuteCrawlTaskResponse,
  CrawlConfigQueryParams,
  CrawlConfigResponse,
  AddCrawlConfigParams,
  UpdateCrawlConfigParams,
  DeleteCrawlConfigParams,
  CrawlConfigOperationResponse,
  CrawlHistoryQueryParams,
  CrawlHistoryResponse,
  UpdateCrawlStatusParams,
  UpdateCrawlStatusSimpleParams,
  UpdateCrawlStatusResponse,
  TaskHistoryQueryParams,
  TaskHistoryResponse,
  CrawlCheckRuleListParams,
  CrawlCheckRuleListResponse,
} from "~/model/LawyerConfigModel";

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
  tags?: string[];
  effectivenessLevel?: string;
  // 新增字段
  legalSource?: string;
  department?: string | string[];
  documentNo?: string;
  appendix?: boolean;
  publishDateStr?: string;
  effectDateStr?: string;
  topicCategory?: string;
  categoryMain?: string;
  categorySub?: string;
  categoryId?: string;
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
  [key: string]: string | number | boolean | string[] | null | undefined;
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
  // 添加员工ID参数
  empId?: string;
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
  collect: boolean;
}

// 文件上传参数
export interface UploadParams {
  id?: string; // 更新时的文档ID，新增时可选
  file: File;
  timeLiness?: string; // 时效性
  effectivenessLevel?: string; // 效力位阶
  categoryId?: string; // 分类ID
  categoryMain?: string; // 主分类
  legalSource?: string; // 来源
  publishDateStr?: string; // 发布时间
  department?: string | string[]; // 部门（支持字符串数组）
  appendix?: boolean; // 附件标识
  documentNo?: string; // 文档编号
  [key: string]: File | string | string[] | number | boolean | undefined;
}

// 审核操作参数
export interface ApprovalParams extends MixedMap {
  id: string;
  approvalComment: string;
  effectDateStr?: string | null;
  categoryMain?: string;
  categorySub?: string;
  categoryId?: string; // 专题分类ID - 跟大家智库的逻辑一样
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
  categoryId?: string; // 分类ID，用于新的分类系统
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
  filePathTxt: string | null;
  filePathOther: string;
  fileVersion: number;
  updateTimeStr: string | null;
  updateTime: string | null;
  updateTimestamp: number | null;
  summary: string;
  readCount: number;
  url: string | null;
  checkStatus: string | null;
  checkTime: string | null;
  compilationType: string | null;
  effectivenessLevel: string;
  topicCategory: string | null;
  diffResultId: string | null;
  initDataFlag: 0 | 1;
  deleted: number;
  // 新增字段
  department?: string | string[] | null; // 责任部门（支持字符串数组）
  documentNo?: string | null; // 发文字号
  appendix?: boolean; // 是否附录
  assemblyCategoryMain?: string; // 组装分类主字段
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
  effectDate: string | null;
  newFileContent: string;
  categoryMain: string;
  categorySub?: string; // 添加二级分类
  newPublishTime: string;
  oldFileContent: string;
  oldFileVersion?: number | null; // 修改前文档版本
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
    categoryMain?: string;
    categorySub?: string;
    effectivenessLevel?: string;
  }) => Promise<KnowledgeDataItem | null>;
  updateRuleSourceDetail: (params: {
    searchId: string;
    timeLiness?: string;
    effectivenessLevel?: string;
    categoryId?: string;
    categoryMain?: string;
    legalSource?: string;
    publishDateStr?: string;
    department?: string | string[];
    appendix?: boolean;
    documentNo?: string;
    categorySub?: string;
    effectDate?: string;
  }) => Promise<{ success: boolean; message?: string }>;
  getRuleSourceList: (
    params: RuleSourceQueryParams
  ) => Promise<RuleSourceListResponse>;
  getRuleUpdateList: (
    params: RuleUpdateQueryParams
  ) => Promise<RuleUpdateListResponse>;
  initData: (params?: QueryParams) => Promise<boolean>;
  saveOrCancelCollect: (params: CollectParams) => Promise<boolean>;
  updateTimeLinessSchedule: (params: QueryParams) => Promise<boolean>;
  uploadRuleSource: (params: UploadParams) => Promise<boolean>;
  getAdmin: (params?: QueryParams) => Promise<boolean>;
  getLegalCategory: (
    params: LegalCategoryParams
  ) => Promise<LegalCategoryItem[]>;
  getDepartmentData: (params?: {
    current: number;
    size: number;
  }) => Promise<DepartmentItem[]>;

  // ==================== 人工审核相关方法 ====================
  approveToDoRule: (params: ApprovalParams) => Promise<boolean>;
  deleteToDoRule: (params: DeleteRuleParams) => Promise<boolean>;
  exportExcel: (
    params: ExportParams
  ) => Promise<{ data: Blob; headers: ResponseHeaders }>;
  getToDoRuleDetail: (params: { id: string }) => Promise<FileCompareDetail>;
  getRuleList: (
    params?: CheckRuleQueryParams,
    useCase?: "homepage" | "management"
  ) => Promise<ToDoRuleItem[] | CheckRuleListResponse>;
  // ==================== 爬取统计相关方法 ====================
  getCrawlHtmlList: (
    params: CrawlStatisticsQueryParams
  ) => Promise<CrawlStatisticsResponse>;
  executeCrawlTask: (
    params: ExecuteCrawlTaskParams
  ) => Promise<ExecuteCrawlTaskResponse>;
  getCrawlHistory: (
    params: CrawlHistoryQueryParams
  ) => Promise<CrawlHistoryResponse>;
  updateCrawlStatus: (
    params: UpdateCrawlStatusParams
  ) => Promise<UpdateCrawlStatusResponse>;
  updateCrawlStatusSimple: (
    params: UpdateCrawlStatusSimpleParams
  ) => Promise<UpdateCrawlStatusResponse>;
  getTaskHistory: (
    params: TaskHistoryQueryParams
  ) => Promise<TaskHistoryResponse>;
  getCrawlCheckRuleList: (
    params: CrawlCheckRuleListParams
  ) => Promise<CrawlCheckRuleListResponse>;
  // ==================== 爬取配置相关方法 ====================
  getCrawlConfigList: (
    params: CrawlConfigQueryParams
  ) => Promise<CrawlConfigResponse>;
  addCrawlConfig: (
    params: AddCrawlConfigParams
  ) => Promise<CrawlConfigOperationResponse>;
  updateCrawlConfig: (
    params: UpdateCrawlConfigParams
  ) => Promise<CrawlConfigOperationResponse>;
  deleteCrawlConfig: (
    params: DeleteCrawlConfigParams
  ) => Promise<CrawlConfigOperationResponse>;
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
  已过期: string;
  待审核: string;
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

// ==================== 专题分类相关类型定义 ====================

// 专题分类项
export interface LegalCategoryItem {
  id: string;
  name: string;
  level: number;
  parentId: string;
  sort: number;
  children: LegalCategoryItem[];
}

// 专题分类接口参数
export interface LegalCategoryParams extends Record<string, unknown> {
  id?: string; // 页面ID，如'2'、'3'等，空值表示获取全量数据
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

// 部门数据项接口
export interface DepartmentItem {
  createdDate: string;
  id: string;
  name: string;
  sysId: string | null;
  remarks: string | null;
  parentId: string;
  type: number;
  emplId: string | null;
  type2: string | null;
  typeName: string;
  department: string | null;
  checked: string;
  children: DepartmentItem[] | null;
  parent: DepartmentItem | null;
  sysRes: string | null;
  sysResIds: string | null;
  nameLike: string | null;
}

// 部门选项接口（用于下拉选择）
export interface DepartmentOption {
  value: string;
  label: string;
  id: string;
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
  summaryArray: string[]; // 处理的摘要数组
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
  path?: string;
  [key: string]: string | string[] | null | undefined;
}
// 法规来源列表响应结构
export interface RuleSourceListResponse {
  status: number;
  message: string;
  success: boolean;
  data: {
    pageNum: number;
    pageSize: number;
    totalPages: number;
    totalSize: number;
    data: KnowledgeDataItem[];
  };
}

// 法规更新查询参数
export interface RuleUpdateQueryParams extends BaseQueryParams {
  query?: string;
  field?: string;
  categoryId?: string; // 分类ID参数
  // 分页参数
  page?: number;
  pageSize?: number;
}
// 法规更新列表响应结构
export interface RuleUpdateListResponse {
  status: number;
  message: string;
  success: boolean;
  data: {
    pageNum: number;
    pageSize: number;
    totalPages: number;
    totalSize: number;
    data: RuleUpdateItem[];
  };
}
// 审核规则列表响应结构
export interface CheckRuleListResponse {
  status: number;
  message: string;
  success: boolean;
  data: {
    records: ToDoRuleItem[];
    total: number;
    size: number;
    current: number;
    pages: number;
    orders: unknown[];
    optimizeCountSql: boolean;
    hitCount: boolean;
    countId: string | null;
    maxLimit: string | null;
    searchCount: boolean;
  };
}
// 法规来源查询参数
export interface RuleSourceQueryParams extends BaseQueryParams {
  query?: string;
  keyWord?: string;
  timeLiness?: string;
  effectivenessLevel?: string;
  categoryMain?: string;
  categorySub?: string;
  categoryId?: string;
  legalSource?: string;
  publishDateSort?: string;
  publishDateStr?: string;
  collect?: boolean;
  // 新增字段
  appendix?: boolean;
  department?: string | string[];
  documentNo?: string;
  empId: string;
  // 分页参数
  page?: number;
  pageSize?: number;
}

// 审核查询参数
export interface CheckRuleQueryParams extends BaseQueryParams {
  condition?: string;
  checkStatus?: string | string[];
  category?: string;
  // 分页参数
  page?: number;
  pageSize?: number;
}

// 时间线统计数据
export interface TimelinessCountData {
  modify: number[];
  publish: number[];
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
