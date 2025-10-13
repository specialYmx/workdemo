import { BaseQueryParams, MixedMap } from './LawyerModel';

// ==================== 公共类型定义 ====================
// 处理状态类型
export type ProcessStatus = '爬取成功' | '爬取失败' | '爬取中';

// ==================== 爬取统计相关数据模型 ====================

// 爬取数据项
export interface CrawlDataItem {
  id: string;
  websiteCode: string;
  websiteName: string;
  articleTitle: string;
  detailUrl: string;
  attachments: string | null;
  processStatus: ProcessStatus;
  extractStatus?: string; // 对比状态
  publishDate: string;
  detailHtml: string;
  fireCrawlContent: string;
  fireCrawlHtml: string;
  createdTime: string | null;
  updateTime: string;
}

// 爬取统计查询参数
export interface CrawlStatisticsQueryParams extends BaseQueryParams {
  websiteCode?: string;
  websiteName?: string;
  articleTitle?: string;
  detailUrl?: string;
  attachments?: string;
  publishDate?: string;
  processStatus?: ProcessStatus; // 处理状态过滤
  orderBy?: string;
  sortRules?: string;
  current?: number;
  size?: number;
}

// 爬取统计响应数据
export interface CrawlStatisticsResponse {
  status: number;
  message: string;
  success: boolean;
  timestamp: number;
  data: {
    total: number;
    size: number;
    current: number;
    records: CrawlDataItem[];
  };
}

// 执行爬取任务参数
export interface ExecuteCrawlTaskParams extends MixedMap {
  id: string;
}

// 执行爬取任务响应
export interface ExecuteCrawlTaskResponse {
  status: number;
  message: string;
  success: boolean;
  timestamp: number;
  data: string;
}

// 修改爬取状态参数（完整参数，保留兼容性）
export interface UpdateCrawlStatusParams {
  id: string;
  articleTitle: string;
  attachments?: string;
  detailUrl: string;
  extractStatus?: string;
  processStatus: ProcessStatus;
  publishDate: string;
  websiteCode: string;
  websiteName: string;
}

// 修改爬取状态参数（简化版，仅状态字段）
export interface UpdateCrawlStatusSimpleParams {
  id: string;
  processStatus: ProcessStatus;
  extractStatus?: string;
}

// 修改爬取状态响应
export interface UpdateCrawlStatusResponse {
  status: number;
  message: string;
  success: boolean;
  timestamp: number;
  data: string;
}

// ==================== 爬取配置相关数据模型 ====================

// 爬取配置项
export interface CrawlConfigItem {
  id: number;
  websiteCode: string;
  websiteName: string;
  websiteUrl: string;
  maxPageLimit: number;
  searchTemplate?: string;
  keywords?: string[];
  invalidKeywords?: string[]; // 无效关键词
  columnName?: string[]; // 列名
  remarks?: string;
  enabled: 0 | 1; // 0-禁用, 1-启用
  crawlStartDate?: string; // 爬取起始时间
  createdBy?: string;
  createdTime?: string;
  updateTime?: string;
  switchLoading?: boolean; // 开关加载状态（前端使用）
}

// 爬取配置查询参数
export interface CrawlConfigQueryParams extends BaseQueryParams {
  websiteCode?: string;
  websiteName?: string;
  websiteUrl?: string;
  enabled?: number;
  createdBy?: string;
  maxPageLimit?: number;
  remarks?: string;
  searchTemplate?: string;
  keywords?: string; // 关键词搜索
  current?: number;
  size?: number;
  sortRules?: string;
}

// 爬取配置响应数据
export interface CrawlConfigResponse {
  status: number;
  message: string;
  success: boolean;
  timestamp: number;
  data: {
    total: number;
    size: number;
    current: number;
    records: CrawlConfigItem[];
    optimizeCountSql: boolean;
    hitCount: boolean;
    countId: string | null;
    maxLimit: string | null;
    searchCount: boolean;
    pages: number;
  };
}

// 新增爬取配置参数
export interface AddCrawlConfigParams {
  websiteCode: string;
  websiteName: string;
  websiteUrl: string;
  maxPageLimit: number;
  searchTemplate?: string;
  keywords?: string[];
  invalidKeywords?: string[]; // 无效关键词
  columnName?: string[]; // 列名
  remarks?: string;
  enabled: number;
  crawlStartDate?: string; // 爬取起始时间
  createdBy?: string;
}

// 更新爬取配置参数
export interface UpdateCrawlConfigParams {
  id: number;
  websiteCode: string;
  websiteName: string;
  websiteUrl: string;
  maxPageLimit: number;
  searchTemplate?: string;
  keywords?: string[];
  invalidKeywords?: string[]; // 无效关键词
  columnName?: string[]; // 列名
  remarks?: string;
  enabled: number;
  crawlStartDate?: string; // 爬取起始时间
  createdBy?: string;
  createdTime?: string;
  updateTime?: string;
}

// 删除爬取配置参数
export interface DeleteCrawlConfigParams {
  id: number;
}

// 通用操作响应
export interface CrawlConfigOperationResponse {
  status: number;
  message: string;
  success: boolean;
  timestamp: number;
  data: string;
}

// ==================== 爬取历史记录相关数据模型 ====================

// 爬取历史记录项
export interface CrawlHistoryItem {
  id: string;
  detailId: string;
  articleTitle: string;
  detailUrl: string;
  processStatus: ProcessStatus;
  exceptionMsg: string;
  createdTime: string;
  aiExtractStatus?: number; // AI提取状态：1为成功，其他为失败
}

// ==================== 任务执行记录相关数据模型 ====================

// 任务执行记录项
export interface TaskHistoryItem {
  id: string;
  taskName: string;
  taskNum: number;
  taskStartTime: string;
  taskResult: string;
}

// 任务执行记录查询参数
export interface TaskHistoryQueryParams extends BaseQueryParams {
  taskName?: string;
  pageNum?: number;
  pageSize?: number;
}

// 任务执行记录响应数据
export interface TaskHistoryResponse {
  status: number;
  message: string;
  success: boolean;
  timestamp: number;
  data: {
    countId: string;
    current: number;
    hitCount: boolean;
    maxLimit: number;
    optimizeCountSql: boolean;
    orders: Array<{
      asc: boolean;
      column: string;
    }>;
    pages: number;
    records: TaskHistoryItem[];
    searchCount: boolean;
    size: number;
    total: number;
  };
}

// ==================== 审核记录相关数据模型 ====================

// 审核记录项
export interface CheckRuleItem {
  id: string;
  aiExtractStatus: number;
  categoryMain: string;
  categorySub: string;
  checkStatus: string;
  checkTime: string;
  createdTime: string;
  currentMaxFileVersion: number;
  deleted: number;
  diffResultId: string;
  documentNo: string;
  effectDate: string;
  effectivenessLevel: string;
  fileLength: number;
  filePathOther: string;
  filePathTxt: string;
  fileVersion: number;
  invokeContent: string;
  legalLabel: string;
  legalSource: string;
  noticeContent: string;
  parentId: string;
  publishTime: string;
  ruleName: string;
  ruleType: string;
  updateTime: string;
  url: string;
  websiteName: string;
}

// 爬虫审核记录查询参数
export interface CrawlCheckRuleListParams {
  id: string;
}

// 爬虫审核记录响应数据
export interface CrawlCheckRuleListResponse {
  status: number;
  message: string;
  success: boolean;
  timestamp: number;
  data: CheckRuleItem[];
}

// 爬取历史记录查询参数
export interface CrawlHistoryQueryParams extends BaseQueryParams {
  detailId?: string;
  current?: number;
  size?: number;
  sortRules?: string;
  logType?: string; // 日志类型：'爬取日志' | '执行日志'
}

// 爬取历史记录响应数据
export interface CrawlHistoryResponse {
  status: number;
  message: string;
  success: boolean;
  timestamp: number;
  data: {
    countId: string;
    current: number;
    hitCount: boolean;
    maxLimit: number;
    optimizeCountSql: boolean;
    pages: number;
    records: CrawlHistoryItem[];
    searchCount: boolean;
    size: number;
    total: number;
  };
}
