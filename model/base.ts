/**
 * 基础模型接口定义
 */

// 文档项目接口
export interface DocumentItem {
  id: string;
  title: string;
  source?: string;
  sourceType?: string;
  date?: string;
  summary?: string;
  description?: string;
  category?: string;
  type?: string;
  views?: number;
  tags?: string[];
}

// 更新项目接口
export interface UpdateItem {
  id: string;
  title: string;
  description: string;
  date: string;
  source: string;
  category: string;
  type: string;
  tags: string[];
  aiSummary?: { title: string; content: string }[];
  status?: string;
  icon?: string;
  analysis?: string[];
}

// 文档比较数据接口
export interface DocumentCompareData {
  id: string;
  title: string;
  originalVersion: string;
  newVersion: string;
  originalContent: string;
  newContent: string;
  changeSummary: string;
  status: "pending" | "approved" | "rejected";
  changes: DocumentChange[];
}

// 文档变更接口
export interface DocumentChange {
  type: "add" | "delete" | "modify";
  section: string;
  position: string;
  oldText?: string;
  newText?: string;
  reason: string;
}

// 文档数据接口
export interface DocumentData {
  id: string;
  title: string;
  category: string;
  date: string;
  effectiveDate: string;
  publisher: string;
  fileNumber: string;
  status: string;
  views: number;
  tags: string[];
  content: string;
}

// 相关文档接口
export interface RelatedDocument {
  id: string;
  title: string;
  date: string;
}

export interface Document {
  id: string;
  title: string;
  version: string;
  docNumber?: string;
  changeType: string;
  type: string;
  submitter: string;
  submitTime: string;
  reviewer?: string;
  reviewTime?: string;
  status: string;
  source?: string;
}
