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
  CrawlCheckRuleListResponse
} from '~/model/LawyerConfigModel';

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
  type: 'add' | 'delete' | 'modify' | 'info';
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
  publishDateStr: string;
  effectDateStr?: string;
  topicCategory?: string;
  categoryMain?: string;
  categorySub?: string;
  categoryId?: string;
  assemblyCategoryMain?: string;
  dataSource?: string; // 数据来源："1"-爬取数据，"2"-人工审核数据
  iframeUrl?: string; // iframe预览链接
}

// 文档比较基础字段
export interface DocumentCompareBaseFields {
  id: string;
  title: string;
  status: string;
  checkStatus?: string;
  tags?: string[];
  effectDate?: string | null;
  changes: DocumentChange[];
}

// 文档比较公共字段
export interface DocumentCompareCommonFields {
  originalContent?: string;
  newContent?: string;
  // 当使用 iframe 预览时的链接（对应修改前/修改后）
  originalIframeUrl?: string;
  newIframeUrl?: string;
  modifiedDate?: string;
  completed?: string; // AI对比是否完成，"0"表示未完成
  oldFileVersion?: number | null;
  newFileVersion?: number | null;
  currentMaxFileVersion?: number | null;
  oldPublishTime?: string | null;
  newPublishTime?: string | null;
}

// 文档比较数据
export interface DocumentCompareData
  extends DocumentCompareBaseFields,
    DocumentCompareCommonFields {}

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

// 分页参数（可复用）
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

// 通用查询参数接口（继承基础参数）
export interface QueryParams extends BaseQueryParams, PaginationParams {
  keyword?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  empId?: string; // 员工ID参数
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

// 文档分类字段（可复用）
export interface DocumentCategoryFields {
  categoryId?: string;
  categoryMain?: string;
  categorySub?: string;
  effectivenessLevel?: string;
  legalSource?: string;
}

// 文件上传参数
export interface UploadParams extends DocumentCategoryFields {
  id?: string; // 更新时的文档ID，新增时可选
  file: File;
  timeLiness?: string; // 时效性
  publishDateStr?: string; // 发布时间
  effectDate?: string; // 生效时间
  department?: string | string[]; // 部门（支持字符串数组）
  appendix?: boolean; // 附件标识
  documentNo?: string; // 文档编号
}

// 审核操作参数
export interface ApprovalParams extends MixedMap, DocumentCategoryFields {
  id: string;
  approvalComment: string;
  effectDateStr?: string | null;
}

// 导出参数
export interface ExportParams {
  ids?: string[];
  id?: string;
  format?: 'excel' | 'pdf';
}

// HTTP响应头接口
export interface ResponseHeaders {
  [key: string]: string | string[] | undefined;
  'content-disposition'?: string;
  'content-type'?: string;
  'content-length'?: string;
}

// ==================== 大家智库相关数据模型 ====================

// 核心文档字段（所有文档类型共用）
export interface CoreDocumentFields {
  id: string;
  ruleName: string;
  websiteName: string;
  legalSource?: string | null;
  documentNo?: string | null; // 发文字号
  url: string | null;
  categoryMain: string | null;
  categorySub: string | null;
  categoryId?: string; // 分类ID，用于新的分类系统
  effectivenessLevel: string | null;
  filePathOther: string | null;
  fileVersion: number;
  checkStatus: string | null;
  diffResultId: string | null;
}

// 时间相关字段
export interface DocumentTimeFields {
  createdTime?: string | null;
  createdTimeStr?: string;
  createdTimestamp?: number;
  publishTime?: string | null;
  publishDateStr: string;
  publishDateTimestamp?: number;
  effectDate?: string | null;
  effectDateStr?: string | null;
  effectDateTimestamp?: number | null;
  updateTime?: string | null;
  updateTimeStr?: string | null;
  updateTimestamp?: number | null;
  modifyDateStr?: string | null;
  modifyDateTimestamp?: number | null;
  revokeDateStr?: string | null;
  revokeDateTimestamp?: number | null;
  checkTime?: string | null;
}

// 法规数据基础接口（公共字段）
export interface BaseRuleItem extends CoreDocumentFields, DocumentTimeFields {
  timeLiness: string;
  fileContent: string;
  summary: string;
  readCount: number;
  compilationType: string | null;
  topicCategory: string | null;
  department?: string | string[] | null; // 责任部门（支持字符串数组）
  appendix?: boolean; // 是否附录
  assemblyCategoryMain?: string; // 组装分类主字段
  dataSource?: string; // 数据来源："1"-爬取数据，"2"-人工审核数据
  updateStatus?: string; // 更新状态："1"-已生成对比结果，"0"或其他-未生成
}

// 法规文档信息（基于真实API数据结构）
export interface KnowledgeDataItem extends BaseRuleItem {
  isCollect?: boolean; // 收藏状态字段
}

// 法规更新列表项接口（基于真实API数据结构）
export interface RuleUpdateItem extends BaseRuleItem {
  currentMaxFileVersion: number | null;
  oldId?: string; // 旧版本文档ID（用于 iframe 对比）
}

// ==================== 人工审核相关数据模型 ====================

// 审核特有字段
export interface AuditSpecificFields {
  currentMaxFileVersion: number; // 当前最大文件版本
  parentId: string | null; // 父级ID
  ruleType: string | null; // 规则类型，如："notice_node"
  invokeContent: string | null; // 调用内容
  noticeContent: string | null; // 通知内容，JSON字符串格式
}

// 人工审核基础接口（复用核心字段）
export interface BaseAuditRuleItem extends CoreDocumentFields, AuditSpecificFields {
  publishTime: string | null; // 发布时间
  effectDate: string | null; // 生效日期
  updateTime: string | null; // 更新时间
  checkStatus: string; // 审核状态，如："待审核"、"已通过"、"已驳回"
  createdTime: string; // 创建时间
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

// 文档版本字段
export interface DocumentVersionFields {
  newFileVersion: number | null;
  oldFileVersion?: number | null;
  currentMaxFileVersion: number;
}

// 文件比较详情
export interface FileCompareDetail extends DocumentVersionFields {
  id?: string;
  effectDate: string | null;
  newFileContent: string;
  oldFileContent: string;
  categoryMain: string;
  categorySub?: string;
  categoryId?: string; // 新分类系统ID（若存在则优先使用）
  newPublishTime: string;
  oldPublishTime?: string;
  checkResult: string;
  checkStatus?: string;
  completed?: string; // AI对比是否完成，"0"表示未完成
}
// 法律合规智能系统服务接口定义
export interface RoadLawyerService {
  // ==================== 首页统计相关方法 ====================
  getCheckCompleteList: (params?: QueryParams) => Promise<CompletedRuleItem[]>;
  getUpdateCount: (params?: QueryParams) => Promise<number>;
  getUpdateTimelinessCount: (params?: QueryParams) => Promise<TimelinessCountData>;
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
    effectivenessLevel?: string | null;
    categoryId?: string;
    categoryMain?: string;
    legalSource?: string;
    publishDateStr: string;
    department?: string | string[];
    appendix?: boolean;
    documentNo?: string;
    categorySub?: string;
    effectDate?: string;
  }) => Promise<{ success: boolean; message?: string }>;
  getRuleSourceList: (params: RuleSourceQueryParams) => Promise<RuleSourceListResponse>;
  getRuleUpdateList: (params: RuleUpdateQueryParams) => Promise<RuleUpdateListResponse>;
  initData: (params?: QueryParams) => Promise<boolean>;
  saveOrCancelCollect: (params: CollectParams) => Promise<boolean>;
  updateTimeLinessSchedule: (params: QueryParams) => Promise<boolean>;
  uploadRuleSource: (params: UploadParams) => Promise<boolean>;
  getAdmin: (params?: QueryParams) => Promise<boolean>;
  getLegalCategory: (params: LegalCategoryParams) => Promise<LegalCategoryItem[]>;
  getDepartmentData: (params?: { current: number; size: number }) => Promise<DepartmentItem[]>;
  exportWord: (params: {
    copies: string;
  }) => Promise<{ data: Blob; headers: ResponseHeaders } | null>;
  getPreviewUrl: (params: { id: string }) => Promise<string>;
  getRuleDetailList: () => Promise<RuleDetailItem[]>;
  generateComparison: (params: { oldId: string; newId: string }) => Promise<string>;
  deleteComparison: (params: { id: string }) => Promise<boolean>;

  // ==================== 人工审核相关方法 ====================
  approveToDoRule: (params: ApprovalParams) => Promise<boolean>;
  deleteToDoRule: (params: DeleteRuleParams) => Promise<boolean>;
  exportExcel: (params: ExportParams) => Promise<{ data: Blob; headers: ResponseHeaders }>;
  getToDoRuleDetail: (params: { id: string }) => Promise<FileCompareDetail>;
  getRuleList: (
    params?: CheckRuleQueryParams,
    useCase?: 'homepage' | 'management'
  ) => Promise<ToDoRuleItem[] | CheckRuleListResponse>;
  // ==================== 爬取统计相关方法 ====================
  getCrawlHtmlList: (params: CrawlStatisticsQueryParams) => Promise<CrawlStatisticsResponse>;
  executeCrawlTask: (params: ExecuteCrawlTaskParams) => Promise<ExecuteCrawlTaskResponse>;
  getCrawlHistory: (params: CrawlHistoryQueryParams) => Promise<CrawlHistoryResponse>;
  updateCrawlStatus: (params: UpdateCrawlStatusParams) => Promise<UpdateCrawlStatusResponse>;
  updateCrawlStatusSimple: (
    params: UpdateCrawlStatusSimpleParams
  ) => Promise<UpdateCrawlStatusResponse>;
  getTaskHistory: (params: TaskHistoryQueryParams) => Promise<TaskHistoryResponse>;
  getCrawlCheckRuleList: (params: CrawlCheckRuleListParams) => Promise<CrawlCheckRuleListResponse>;
  // ==================== 爬取配置相关方法 ====================
  getCrawlConfigList: (params: CrawlConfigQueryParams) => Promise<CrawlConfigResponse>;
  addCrawlConfig: (params: AddCrawlConfigParams) => Promise<CrawlConfigOperationResponse>;
  updateCrawlConfig: (params: UpdateCrawlConfigParams) => Promise<CrawlConfigOperationResponse>;
  deleteCrawlConfig: (params: DeleteCrawlConfigParams) => Promise<CrawlConfigOperationResponse>;
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
  需人工处理: string;
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
  content?: string;
  iframeUrl?: string;
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

// 摘要解析结果
export interface SummaryPoint {
  title: string;
  content: string;
}

// 更新项（法规更新列表显示）
export interface UpdateItem {
  id: string;
  title: string;
  description: string;
  fileContent?: string;
  summary?: string;
  summaryArray: SummaryPoint[]; // 解析后的摘要数组，包含标题和内容
  date: string;
  source: string;
  category: string;
  type: string;
  tags: string[];
  assemblyCategoryMain?: string; // 组装分类主字段（用于识别季刊类数据）
  dataSource?: string; // 数据来源："1"-爬取数据，"2"-人工审核数据
  updateStatus?: string; // 更新状态："1"-已生成对比结果，"0"或其他-未生成
  ruleName: string; // 法规名称，用于路由传参
  oldId?: string; // 旧版本文档ID（用于 iframe 对比）
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

// 文档比较页面数据（复用基础字段和公共字段）
export interface DocumentComparePageData
  extends DocumentCompareBaseFields,
    DocumentCompareCommonFields {
  // 覆盖为必需字段
  originalContent: string;
  newContent: string;
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
export interface RuleUpdateQueryParams extends BaseQueryParams, PaginationParams {
  query?: string;
  field?: string;
  categoryId?: string; // 分类ID参数
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
export interface RuleSourceQueryParams
  extends BaseQueryParams,
    PaginationParams,
    DocumentCategoryFields {
  query?: string;
  keyWord?: string;
  timeLiness?: string;
  publishDateSort?: string;
  publishDateStr?: string;
  collect?: boolean;
  appendix?: boolean;
  department?: string | string[];
  documentNo?: string;
  empId: string;
}

// 审核查询参数
export interface CheckRuleQueryParams extends BaseQueryParams, PaginationParams {
  condition?: string;
  checkStatus?: string | string[];
  category?: string;
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

// 规则详情项（用于getRuleDetailList下拉框选项）- 只需id和fileContent两个关键字段
export interface RuleDetailItem {
  id: string;
  fileContent: string;
  ruleName: string;
  publishDateStr: string;
}

// 表格行选择配置（恢复，避免依赖 CommonModel，且不使用 any）
export interface RowSelectionConfig<T = unknown> {
  selectedRowKeys: string[];
  onChange: (selectedRowKeys: string[], selectedRows: T[]) => void;
  onSelectAll: (selected: boolean, selectedRows: T[], changeRows: T[]) => void;
  getCheckboxProps: (record: T) => { disabled: boolean; name: string };
}
