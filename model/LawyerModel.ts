// 法律合规智能系统数据模型

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
  _matchesPosition: Record<string, any>;
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
  publishDateStr: string;
  docNo: string | null;
  url: string | null;
  updateTimestamp: number | null;
  thinktankType: string | null;
  websiteName: string;
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
  newFileVersion: number;
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
export interface LawyerService {
  // ==================== 首页统计相关方法 ====================
  getCheckComplateList: (params?: any) => Promise<any>;
  getUpdateCount: (params?: any) => Promise<any>;
  getUpdateTimeLinessCount: (params?: any) => Promise<any>;
  getWebSiteRatio: (params?: any) => Promise<any>;

  // ==================== 大家智库相关方法 ====================
  deleteRuleSource: (params: any) => Promise<boolean>;
  downloadRuleFile: (params: any) => Promise<{ data: Blob; headers: any }>;
  getRuleSourceCollect: (params: any) => Promise<any>;
  getRuleSourceDetail: (params: any) => Promise<RuleSourceItem>;
  getRuleSourceList: (params: any) => Promise<KnowledgeDataItem[]>;
  getRuleUpdateList: (params: any) => Promise<PageResult<any>>;
  initData: (params?: any) => Promise<any>;
  saveOrCancelCollect: (params: any) => Promise<boolean>;
  updateTimeLinessSchedule: (params: any) => Promise<boolean>;
  uploadRuleSource: (params: any) => Promise<boolean>;

  // ==================== 人工审核相关方法 ====================
  approveToDoRule: (params: {
    id: string;
    approvalComment: string;
    effectDate?: string | null;
  }) => Promise<boolean>;
  deleteToDoRule: (params: any) => Promise<boolean>;
  exportExcel: (params: {
    ids?: string[];
    id?: string;
  }) => Promise<{ data: Blob; headers: any }>;
  getDiffResultSchedule: (params: any) => Promise<any>;
  getToDoRuleDetail: (params: { id: string }) => Promise<FileCompareDetail>;
  getCheckRuleList: (
    params: Record<string, string>
  ) => Promise<PageResult<ToDoRuleItem>>;
}
