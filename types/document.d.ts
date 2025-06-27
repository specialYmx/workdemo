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

// 文档对比数据接口
export interface DocumentCompareData {
  id: string;
  title: string;
  versions: {
    id: string;
    date: string;
    author: string;
    status: string;
  }[];
  diffContent: string;
}
