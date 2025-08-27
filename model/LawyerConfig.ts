import { BaseQueryParams, MixedMap } from "./LawyerModel";
// ==================== 爬取统计相关数据模型 ====================

// 爬取数据项
export interface CrawlDataItem {
  id: string;
  websiteCode: string;
  websiteName: string;
  articleTitle: string;
  detailUrl: string;
  attachments: string | null;
  processStatus: string;
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
  processStatus?: string; // 处理状态过滤
  orderBy?: string;
  sortRules?: string;
  current?: number;
  size?: number;
}

// 爬取统计响应数据
export interface CrawlStatisticsResponse {
  status: string;
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
  status: string;
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
  remarks?: string;
  enabled: number; // 0-禁用, 1-启用
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
    orders: any[];
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
  remarks?: string;
  enabled: number;
  crawlStartDate?: string; // 爬取起始时间
  createdBy?: string;
  createdTime?: string;
  updateTime?: string;
}

// 删除爬取配置参数
export interface DeleteCrawlConfigParams {
  id: string;
}

// 通用操作响应
export interface CrawlConfigOperationResponse {
  status: number;
  message: string;
  success: boolean;
  timestamp: number;
  data: string;
}
