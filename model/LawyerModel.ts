// 法律合规智能系统数据模型

// ==================== 通用类型定义 ====================

/**
 * 搜索匹配位置信息
 */
export interface MatchPosition {
  start: number; // 匹配开始位置
  length: number; // 匹配长度
}

/**
 * 搜索匹配位置集合
 */
export type MatchesPosition = Record<string, MatchPosition[]>;

/**
 * 通用查询参数接口
 */
export interface QueryParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  [key: string]: string | number | boolean | undefined;
}

/**
 * 文件删除参数
 */
export interface DeleteRuleParams {
  id: string;
  [key: string]: string | number | boolean;
}

/**
 * 文件下载参数
 */
export interface DownloadFileParams {
  id: string;
  fileType?: string;
  [key: string]: string | number | boolean | undefined;
}

/**
 * 收藏操作参数
 */
export interface CollectParams {
  searchId: string;
  empId: string;
  isCollect: boolean;
  [key: string]: string | number | boolean;
}

/**
 * 文件上传参数
 */
export interface UploadParams {
  file: File;
  category?: string;
  description?: string;
  [key: string]: File | string | number | boolean | undefined;
}

/**
 * 审核操作参数
 */
export interface ApprovalParams {
  id: string;
  approvalComment: string;
  effectDate?: string | null;
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * 导出参数
 */
export interface ExportParams {
  ids?: string[];
  id?: string;
  format?: "excel" | "pdf";
}

/**
 * HTTP响应头接口
 */
export interface ResponseHeaders {
  [key: string]: string | string[] | undefined;
  "content-disposition"?: string;
  "content-type"?: string;
  "content-length"?: string;
}

// ==================== 首页统计相关数据模型 ====================

/**
 * 首页统计概览数据
 */
export interface HomeStatistics {
  totalRules: number; // 总法规数量
  pendingReviews: number; // 待审核数量
  riskAlerts: number; // 风险告警数量
  complianceRate: number; // 合规率
  updateTime: string; // 更新时间
}

/**
 * 风险分析数据
 */
export interface RiskAnalysis {
  riskLevel: "high" | "medium" | "low";
  riskCount: number;
  riskDescription: string;
  affectedAreas: string[];
  createTime: string;
}

/**
 * 合规状态统计
 */
export interface ComplianceStatus {
  compliant: number; // 合规数量
  nonCompliant: number; // 不合规数量
  pending: number; // 待确认数量
  total: number; // 总数量
  complianceRate: number; // 合规率
}

/**
 * 趋势分析数据
 */
export interface TrendAnalysis {
  date: string;
  ruleCount: number;
  reviewCount: number;
  complianceRate: number;
}

// ==================== 大家智库相关数据模型 ====================

/**
 * 法规文档信息（基于真实API数据结构）
 */
export interface KnowledgeDataItem {
  revokeDateTimestamp: number | null;
  modifyDateTimestamp: number | null;
  effectDateStr: string | null;
  _matchesPosition: MatchesPosition;
  compilationType: string | null;
  categorySub: string;
  readCount: number;
  filePathTxt: string;
  checkStatus: string | null;
  effectDateTimestamp: number | null;
  ruleName: string;
  createdTime: string | null;
  publishDateTimestamp: number;
  filePathOther: string;
  id: string;
  initDataFlag: number;
  fileVersion: number;
  updateTimeStr: string | null;
  revokeDateStr: string | null;
  summary: string;
  publishTime: string | null;
  effectDate: string | null;
  createdTimeStr: string;
  createdTimestamp: number;
  topicCategory: string | null;
  updateTime: string | null;
  isCollect?: boolean; // 收藏状态字段
  publishDateStr: string;
  docNo: string | null;
  url: string | null;
  updateTimestamp: number | null;
  thinktankType: string | null;
  websiteName: string;
  legalSource?: string; // 发布机构或来源信息，替代 websiteName 使用
  effectivenessLevel: string;
  diffResultId: string | null;
  categoryMain: string;
  deleted: number;
  checkTime: string | null;
  timeLiness: string;
  fileContent: string;
  modifyDateStr: string | null;
}

/**
 * 法规更新列表项接口（基于真实API数据结构）
 */
export interface RuleUpdateItem {
  id: string;
  ruleName: string;
  websiteName: string;
  legalSource?: string; // 发布机构或来源信息，替代 websiteName 使用
  createdTimeStr: string;
  createdTimestamp: number;
  categoryMain: string | null;
  categorySub: string | null;
  timeLiness: string;
  fileContent: string;
  publishDateStr: string | null;
  publishDateTimestamp: number | null;
  effectDateStr: string | null;
  effectDateTimestamp: number | null;
  modifyDateStr: string | null;
  modifyDateTimestamp: number | null;
  revokeDateStr: string | null;
  revokeDateTimestamp: number | null;
  filePathTxt: string | null;
  filePathOther: string | null;
  fileVersion: number | null;
  currentMaxFileVersion: number | null;
  updateTimeStr: string | null;
  updateTime: string | null;
  updateTimestamp: number | null;
  summary: string;
  readCount: number;
  documentNo: string | null;
  docNo: string | null;
  url: string | null;
  checkStatus: string | null;
  checkTime: string | null;
  thinktankType: string | null;
  compilationType: string | null;
  effectivenessLevel: string | null;
  topicCategory: string | null;
  diffResultId: string | null;
  initDataFlag: string | null;
  deleted: number;
  _matchesPosition: MatchesPosition;
}

/**
 * 法规文档信息（保留原有接口以兼容其他代码）
 */
export interface RuleSourceItem {
  id: string;
  title: string;
  content: string;
  category: string;
  categoryName: string;
  publishDate: string;
  effectiveDate: string;
  status: "active" | "inactive" | "draft";
  source: string; // 来源
  tags: string[];
  createTime: string;
  updateTime: string;
}

/**
 * 法规分类
 */
export interface RuleCategory {
  id: string;
  name: string;
  parentId?: string;
  level: number;
  ruleCount: number;
  children?: RuleCategory[];
}

/**
 * 研究报告
 */
export interface ResearchReport {
  id: string;
  title: string;
  abstract: string;
  author: string;
  publishDate: string;
  category: string;
  tags: string[];
  downloadUrl: string;
  viewCount: number;
  createTime: string;
}

/**
 * 案例分析
 */
export interface CaseAnalysis {
  id: string;
  title: string;
  caseNumber: string;
  court: string;
  judgmentDate: string;
  category: string;
  summary: string;
  keyPoints: string[];
  relatedRules: string[];
  createTime: string;
}

// ==================== 人工审核相关数据模型 ====================

/**
 * 人工审核列表项接口（基于mock数据结构）
 */
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

/**
 * 已完成审核列表项接口（基于completeRuleList数据结构）
 */
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

/**
 * 审核历史记录接口
 */
export interface ReviewHistory {
  id: string;
  ruleId: string;
  ruleName: string;
  reviewerId: string;
  reviewerName: string;
  action: "submit" | "approve" | "reject" | "assign";
  comment: string;
  reviewTime: string;
  previousStatus: string;
  currentStatus: string;
}

/**
 * 审核流程接口
 */
export interface ReviewProcess {
  id: string;
  ruleId: string;
  currentStep: number;
  totalSteps: number;
  stepName: string;
  stepDescription: string;
  assignee: string;
  assigneeName: string;
  status: "pending" | "in_progress" | "completed";
  deadline: string;
}

// ==================== 通用数据模型 ====================

/**
 * 文件信息接口
 */
export interface FileInfo {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  uploadTime: string;
  uploader: string;
  uploaderName: string;
}

/**
 * 用户权限接口
 */
export interface UserPermission {
  userId: string;
  userName: string;
  role: string;
  permissions: string[];
  departmentId: string;
  departmentName: string;
}

/**
 * 分页查询参数
 */
export interface PageParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * 分页响应结果
 */
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
/**
 * 法律合规智能系统服务接口定义
 */
export interface RoadLawyerService {
  // ==================== 首页统计相关方法 ====================
  getCheckCompleteList: (params?: QueryParams) => Promise<CompletedRuleItem[]>;
  getUpdateCount: (params?: QueryParams) => Promise<number>;
  getUpdateTimeLinessCount: (params?: QueryParams) => Promise<any>;
  getWebSiteRatio: (params?: QueryParams) => Promise<any>;
  exportStatisticExcel: (params: {
    condition: string;
  }) => Promise<{ data: Blob; headers: ResponseHeaders } | null>;

  // ==================== 大家智库相关方法 ====================
  deleteRuleSource: (params: DeleteRuleParams) => Promise<boolean>;
  downloadRuleFile: (
    params: DownloadFileParams
  ) => Promise<{ data: Blob; headers: ResponseHeaders }>;
  getRuleSourceCollect: (params: QueryParams) => Promise<any>;
  getRuleSourceDetail: (params: {
    searchId: string;
    isRevoke?: boolean;
  }) => Promise<KnowledgeDataItem | null>;
  getRuleSourceList: (params: QueryParams) => Promise<KnowledgeDataItem[]>;
  getRuleUpdateList: (params: QueryParams) => Promise<RuleUpdateItem[]>;
  initData: (params?: QueryParams) => Promise<any>;
  saveOrCancelCollect: (params: CollectParams) => Promise<boolean>;
  updateTimeLinessSchedule: (params: QueryParams) => Promise<boolean>;
  uploadRuleSource: (params: UploadParams) => Promise<boolean>;

  // ==================== 人工审核相关方法 ====================
  approveToDoRule: (params: ApprovalParams) => Promise<boolean>;
  deleteToDoRule: (params: DeleteRuleParams) => Promise<boolean>;
  exportExcel: (
    params: ExportParams
  ) => Promise<{ data: Blob; headers: ResponseHeaders }>;
  getDiffResultSchedule: (params: QueryParams) => Promise<any>;
  getToDoRuleDetail: (params: { id: string }) => Promise<FileCompareDetail>;
  getCheckRuleList: (params: QueryParams) => Promise<PageResult<ToDoRuleItem>>;
}
