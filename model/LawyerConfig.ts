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
