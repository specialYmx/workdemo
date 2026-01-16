import { AxiosInstance } from 'axios';
import api from '~/api/index';
import type {
  RoadLawyerService,
  KnowledgeDataItem,
  QueryParams,
  DeleteRuleParams,
  DownloadFileParams,
  CollectParams,
  UploadParams,
  ApprovalParams,
  ExportParams,
  CompletedRuleItem,
  RuleUpdateQueryParams,
  RuleUpdateListResponse,
  RuleSourceQueryParams,
  CheckRuleQueryParams,
  LegalCategoryParams,
  LegalCategoryItem,
  RuleDetailItem
} from '~/model/LawyerModel';
import type {
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
// 将对象转换为FormData的辅助函数
const toFormData = (obj: unknown): FormData => {
  const formData = new FormData();

  if (!obj || typeof obj !== 'object') {
    return formData;
  }

  // 检查值是否可以添加到FormData
  const isValidFormDataValue = (value: unknown): value is string | number | boolean | Blob => {
    return (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value instanceof Blob
    );
  };

  // 添加单个值到FormData
  const appendValue = (key: string, value: unknown): void => {
    if (isValidFormDataValue(value)) {
      const formValue = value instanceof Blob ? value : String(value);
      formData.append(key, formValue);
    }
  };

  Object.entries(obj as Record<string, unknown>).forEach(([key, value]) => {
    // 跳过null和undefined值
    if (value === null || value === undefined) {
      return;
    }

    if (Array.isArray(value)) {
      // 处理数组参数 - 每个元素使用相同的key名
      value.forEach(item => appendValue(key, item));
    } else {
      // 处理单个值
      appendValue(key, value);
    }
  });

  return formData;
};

export default ($axios: AxiosInstance): RoadLawyerService => ({
  // ==================== 首页统计相关方法 ====================
  async getCheckCompleteList(params: QueryParams = {}): Promise<CompletedRuleItem[]> {
    try {
      const res = await $axios.post(`${api.lawyer.getCheckCompleteList}`, toFormData(params));
      if (res.data?.data) {
        return res.data.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching check complete list:', error);
      return [];
    }
  },

  async getUpdateCount(params: QueryParams = {}): Promise<number> {
    try {
      const res = await $axios.post(`${api.lawyer.getUpdateCount}`, toFormData(params));
      if (res.data?.data !== undefined && res.data?.data !== null) {
        return Number(res.data.data);
      }
      return 0;
    } catch (error) {
      console.error('Error fetching update count:', error);
      return 0;
    }
  },

  async getUpdateTimelinessCount(params: QueryParams = {}) {
    try {
      const res = await $axios.post(`${api.lawyer.getUpdateTimelinessCount}`, toFormData(params));
      if (res.data?.data) {
        return res.data.data;
      }
      return {};
    } catch (error) {
      console.error('Error fetching update timeliness count:', error);
      return {};
    }
  },

  async getWebSiteRatio(params: QueryParams = {}) {
    try {
      const res = await $axios.post(`${api.lawyer.getWebSiteRatio}`, toFormData(params));
      if (res.data?.data) {
        return res.data.data;
      }
      return {};
    } catch (error) {
      console.error('Error fetching website ratio:', error);
      return {};
    }
  },

  async exportStatisticExcel(params: { condition: string }) {
    try {
      const res = await $axios.post(`${api.lawyer.exportStatisticExcel}`, toFormData(params), {
        responseType: 'blob'
      });
      if (res.data) return { data: res.data, headers: res.headers };
      return null;
    } catch (error) {
      console.error('Error exporting statistic excel:', error);
      throw error;
    }
  },

  // ==================== 大家智库相关方法 ====================
  async deleteRuleSource(params: DeleteRuleParams) {
    try {
      const res = await $axios.post(`${api.lawyer.deleteRuleSource}`, toFormData(params));
      return res.data?.success || false;
    } catch (error) {
      console.error('Error deleting rule source:', error);
      return false;
    }
  },

  async downloadRuleFile(params: DownloadFileParams) {
    try {
      // 使用POST请求和FormData参数，与其他接口保持一致
      const res = await $axios.post(`${api.lawyer.downloadRuleFile}`, toFormData(params), {
        responseType: 'blob'
      });
      if (res.data) return { data: res.data, headers: res.headers };
      return null;
    } catch (error) {
      console.error('Error downloading rule file:', error);
      return null;
    }
  },

  async getRuleSourceCollect(params: QueryParams) {
    try {
      const res = await $axios.post(`${api.lawyer.getRuleSourceCollect}`, toFormData(params));
      // 返回完整的响应结构，包含分页信息
      return res.data;
    } catch (error) {
      console.error('Error fetching rule source collect:', error);
      return {
        status: 500,
        message: '获取收藏数据失败',
        success: false,
        data: {
          page: 1,
          pageSize: 10,
          totalPages: 0,
          totalSize: 0,
          data: []
        }
      };
    }
  },

  async getRuleSourceDetail(params: {
    searchId: string;
    isRevoke?: boolean;
  }): Promise<KnowledgeDataItem | null> {
    try {
      const res = await $axios.post(`${api.lawyer.getRuleSourceDetail}`, toFormData(params));
      if (res.data?.data) {
        // 检查返回的数据是否为数组，如果是数组则取第一个元素
        const data = res.data.data;
        if (Array.isArray(data) && data.length > 0) {
          return data[0];
        } else if (!Array.isArray(data)) {
          return data;
        }
      }
      return null;
    } catch (error) {
      console.error('Error fetching rule source detail:', error);
      return null;
    }
  },

  // 修改法规详情
  async updateRuleSourceDetail(params: {
    searchId: string;
    timeLiness?: string;
    effectivenessLevel?: string | null;
    categoryId?: string;
    categoryMain?: string;
    legalSource?: string;
    publishDateStr?: string;
    department?: string | string[];
    appendix?: boolean;
    documentNo?: string;
    categorySub?: string;
    effectDate?: string;
  }): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await $axios.post(`${api.lawyer.updateRuleSourceDetail}`, toFormData(params));
      return {
        success: res.data?.success || false,
        message: res.data?.message || '更新成功'
      };
    } catch (error) {
      console.error('Error updating rule source detail:', error);
      return {
        success: false,
        message: '更新失败，请重试'
      };
    }
  },

  // 获取法规源列表
  // 接口参数：
  // query - 搜索关键词
  // effectivenessLevel - 时效性（现行有效、已废止、尚未生效、已修订）
  // timeLiness - 时效性
  // categoryMain - 主要分类
  // categorySub - 子分类
  // publishDateStr - 发布日期字符串
  // websiteName - 网站名称
  // publishDateSort - 发布日期排序
  // empId - 员工ID（用于收藏功能，从store获取）
  async getRuleSourceList(params: RuleSourceQueryParams) {
    try {
      const res = await $axios.post(`${api.lawyer.getRuleSourceList}`, toFormData(params));
      // 返回完整的响应结构，包含分页信息
      return res.data;
    } catch (error) {
      console.error('Error fetching rule source list:', error);
      return {
        status: 500,
        message: '获取数据失败',
        success: false,
        data: {
          page: 1,
          pageSize: 10,
          totalPages: 0,
          totalSize: 0,
          data: []
        }
      };
    }
  },

  async getRuleUpdateList(params: RuleUpdateQueryParams): Promise<RuleUpdateListResponse> {
    try {
      const res = await $axios.post(`${api.lawyer.getRuleUpdateList}`, toFormData(params));
      // 返回完整的响应结构，包含分页信息
      return res.data;
    } catch (error) {
      console.error('Error fetching rule update list:', error);
      return {
        status: 500,
        message: '获取数据失败',
        success: false,
        data: {
          pageNum: 1,
          pageSize: 10,
          totalPages: 0,
          totalSize: 0,
          data: []
        }
      };
    }
  },

  async initData(params: QueryParams = {}) {
    try {
      const res = await $axios.post(`${api.lawyer.initData}`, toFormData(params));
      if (res.data?.data) {
        return res.data.data;
      }
      return {};
    } catch (error) {
      console.error('Error initializing data:', error);
      return {};
    }
  },

  async saveOrCancelCollect(params: CollectParams) {
    try {
      const res = await $axios.post(`${api.lawyer.saveOrCancelCollect}`, toFormData(params));
      return res.data?.success || false;
    } catch (error) {
      console.error('Error saving or canceling collect:', error);
      return false;
    }
  },

  async uploadRuleSource(params: UploadParams) {
    try {
      const res = await $axios.post(`${api.lawyer.uploadRuleSource}`, toFormData(params));
      return res.data?.success || false;
    } catch (error) {
      console.error('Error uploading rule source:', error);
      return false;
    }
  },

  async getAdmin(params: QueryParams = {}): Promise<boolean> {
    try {
      const res = await $axios.post(`${api.lawyer.getAdmin}`, toFormData(params));
      // 根据接口返回格式，管理员权限在 res.data.data 中
      return res.data?.data === true;
    } catch (error) {
      console.error('Error checking admin permission:', error);
      return false;
    }
  },

  async getLegalCategory(params: LegalCategoryParams): Promise<LegalCategoryItem[]> {
    try {
      const res = await $axios.post(`${api.lawyer.getLegalCategory}`, toFormData(params));
      return res.data?.data || [];
    } catch (error) {
      console.error('Error fetching legal category:', error);
      return [];
    }
  },

  // 导出Word文档
  async exportWord(params: { copies: string }) {
    try {
      const res = await $axios.post(`${api.lawyer.exportWord}`, null, {
        params: { copies: params.copies },
        responseType: 'blob'
      });
      if (res.data) return { data: res.data, headers: res.headers };
      return null;
    } catch (error) {
      console.error('Error exporting word:', error);
      throw error;
    }
  },

  // 获取预览链接
  async getPreviewUrl(params: { id: string }): Promise<string> {
    try {
      // TODO: 临时注释掉真实接口，等待权限配置完成
      // const res = await $axios.get(`${api.lawyer.getPreviewUrl}`, {
      //   params: { id: params.id }
      // });
      // return res.data?.data || '';

      // 临时返回固定 URL
      return 'https://www.baidu.com/';
    } catch (error) {
      console.error('Error getting preview url:', error);
      return '';
    }
  },

  // 获取部门数据
  async getDepartmentData(params: { current: number; size: number } = { current: 1, size: 999 }) {
    try {
      // 临时使用mock数据，后续可以切换到真实接口
      const { department } = await import('~/mock/dep.js');
      return department.records;

      // 真实接口调用（暂时注释）
      // const res = await $axios.post(
      //   `${api.lawyer.getDepartmentData}`,
      //   toFormData(params)
      // );
      // return res.data?.records || [];
    } catch (error) {
      console.error('Error fetching department data:', error);
      return [];
    }
  },
  // ==================== 人工审核相关方法 ====================
  async approveToDoRule(params: ApprovalParams) {
    try {
      const res = await $axios.post(`${api.lawyer.approveToDoRule}`, toFormData(params));

      // 检查业务逻辑是否成功
      if (res.data?.success !== true) {
        const errorMsg = res.data?.message || res.data?.msg || '审核操作失败';
        throw new Error(errorMsg);
      }

      return true;
    } catch (error) {
      console.error('Error approving todo rule:', error);
      // 直接重新抛出异常，让调用方处理
      throw error;
    }
  },

  async deleteToDoRule(params: DeleteRuleParams) {
    try {
      const res = await $axios.post(`${api.lawyer.deleteToDoRule}`, toFormData(params));
      return res.data?.success || false;
    } catch (error) {
      console.error('Error deleting todo rule:', error);
      return false;
    }
  },

  async exportExcel(params: ExportParams) {
    try {
      if (params.ids && Array.isArray(params.ids)) {
        const res = await $axios.post(
          `${api.lawyer.exportExcel}`,
          toFormData(params as Record<string, unknown>),
          {
            responseType: 'blob'
          }
        );
        if (res.data) return { data: res.data, headers: res.headers };
        return null;
      } else {
        throw new Error('缺少必要的导出参数：需要提供 ids 数组');
      }
    } catch (error) {
      console.error('导出Excel错误:', error);
      return null;
    }
  },

  async getToDoRuleDetail(params: { id: string }) {
    try {
      const res = await $axios.post(`${api.lawyer.getToDoRuleDetail}`, toFormData(params));

      if (res.data?.data) {
        return res.data.data;
      }

      // 如果接口返回空数据，返回默认结构
      return {
        newFileVersion: null,
        effectDate: '',
        newFileContent: '',
        categoryMain: '',
        newPublishTime: '',
        oldFileContent: '',
        checkResult: '',
        currentMaxFileVersion: 0
      };
    } catch (error) {
      console.error('Error fetching todo rule detail:', error);
      // 返回一个符合 FileCompareDetail 类型的空对象
      return {
        newFileVersion: null,
        effectDate: '',
        newFileContent: '',
        categoryMain: '',
        newPublishTime: '',
        oldFileContent: '',
        checkResult: '',
        currentMaxFileVersion: 0
      };
    }
  },

  // 智能规则列表获取方法 - 根据使用场景自动选择合适的接口
  async getRuleList(
    params: CheckRuleQueryParams = {},
    useCase: 'homepage' | 'management' = 'management'
  ) {
    try {
      // 根据使用场景选择接口：
      // homepage: 首页待办列表，使用 getTodoRuleList
      // management: 人工审核管理页面，使用 getCheckRuleList
      const apiEndpoint =
        useCase === 'homepage' ? api.lawyer.getTodoRuleList : api.lawyer.getCheckRuleList;

      const res = await $axios.post(apiEndpoint, toFormData(params));

      if (useCase === 'management') {
        // 人工审核页面返回完整的分页响应结构
        return (
          res.data || {
            status: 500,
            message: '获取数据失败',
            success: false,
            data: {
              records: [],
              total: 0,
              size: params.pageSize || 10,
              current: params.page || 1,
              pages: 0
            }
          }
        );
      } else {
        // 首页保持原有逻辑，只返回数据数组
        if (res.data?.data) {
          return res.data.data;
        }
        return [];
      }
    } catch (error) {
      console.error(`Error fetching rule list (${useCase}):`, error);
      if (useCase === 'management') {
        return {
          status: 500,
          message: '获取数据失败',
          success: false,
          data: {
            records: [],
            total: 0,
            size: params.pageSize || 10,
            current: params.page || 1,
            pages: 0
          }
        };
      }
      return [];
    }
  },
  // ==================== 爬取统计相关方法 ====================
  async getCrawlHtmlList(params: CrawlStatisticsQueryParams): Promise<CrawlStatisticsResponse> {
    const defaultData = {
      total: 0,
      size: params.size || 10,
      current: params.current || 1,
      records: []
    };

    try {
      const res = await $axios.post(api.lawyer.getCrawlHtmlList, params);
      return (
        res.data || {
          status: 'error',
          message: 'No data received',
          success: false,
          timestamp: Date.now(),
          data: defaultData
        }
      );
    } catch (error) {
      console.error('Error fetching crawl html list:', error);
      return {
        status: 201,
        message: error instanceof Error ? error.message : 'Unknown error',
        success: false,
        timestamp: Date.now(),
        data: defaultData
      };
    }
  },

  async executeCrawlTask(params: ExecuteCrawlTaskParams): Promise<ExecuteCrawlTaskResponse> {
    const defaultResponse = {
      status: 201,
      message: 'No response received',
      success: false,
      timestamp: Date.now(),
      data: ''
    };

    try {
      const res = await $axios.post(api.lawyer.executeCrawlTask, toFormData(params));
      return res.data || defaultResponse;
    } catch (error) {
      console.error('Error executing crawl task:', error);
      return {
        ...defaultResponse,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
  async getCrawlHistory(params: CrawlHistoryQueryParams): Promise<CrawlHistoryResponse> {
    const defaultData = {
      countId: '',
      current: params.current || 1,
      hitCount: true,
      maxLimit: 0,
      optimizeCountSql: true,
      pages: 0,
      records: [],
      searchCount: true,
      size: params.size || 10,
      total: 0
    };

    try {
      const res = await $axios.post(api.lawyer.getCrawlHistory, params);
      return (
        res.data || {
          status: 500,
          message: 'No data received',
          success: false,
          timestamp: Date.now(),
          data: defaultData
        }
      );
    } catch (error) {
      console.error('Error fetching crawl history:', error);
      return {
        status: 500,
        message: error instanceof Error ? error.message : 'Unknown error',
        success: false,
        timestamp: Date.now(),
        data: defaultData
      };
    }
  },

  async updateCrawlStatus(params: UpdateCrawlStatusParams): Promise<UpdateCrawlStatusResponse> {
    try {
      const res = await $axios.post(api.lawyer.updateCrawlStatus, params);
      return (
        res.data || {
          status: 500,
          message: 'No data received',
          success: false,
          timestamp: Date.now(),
          data: ''
        }
      );
    } catch (error) {
      console.error('Error updating crawl status:', error);
      return {
        status: 500,
        message: error instanceof Error ? error.message : 'Unknown error',
        success: false,
        timestamp: Date.now(),
        data: ''
      };
    }
  },

  // 简化的状态更新方法，只传递必要的状态参数
  async updateCrawlStatusSimple(
    params: UpdateCrawlStatusSimpleParams
  ): Promise<UpdateCrawlStatusResponse> {
    try {
      const res = await $axios.post(api.lawyer.updateCrawlStatus, params);
      return (
        res.data || {
          status: 500,
          message: 'No data received',
          success: false,
          timestamp: Date.now(),
          data: ''
        }
      );
    } catch (error) {
      console.error('Error updating crawl status (simple):', error);
      return {
        status: 500,
        message: error instanceof Error ? error.message : 'Unknown error',
        success: false,
        timestamp: Date.now(),
        data: ''
      };
    }
  },

  async getTaskHistory(params: TaskHistoryQueryParams): Promise<TaskHistoryResponse> {
    const defaultData = {
      countId: '',
      current: params.pageNum || 1,
      hitCount: true,
      maxLimit: 0,
      optimizeCountSql: true,
      orders: [],
      pages: 0,
      records: [],
      searchCount: true,
      size: params.pageSize || 10,
      total: 0
    };

    try {
      const res = await $axios.post(api.lawyer.getTaskHistory, toFormData(params));
      return (
        res.data || {
          status: 500,
          message: 'No data received',
          success: false,
          timestamp: Date.now(),
          data: defaultData
        }
      );
    } catch (error) {
      console.error('Error getting task history:', error);
      return {
        status: 500,
        message: error instanceof Error ? error.message : 'Unknown error',
        success: false,
        timestamp: Date.now(),
        data: defaultData
      };
    }
  },

  async getCrawlCheckRuleList(
    params: CrawlCheckRuleListParams
  ): Promise<CrawlCheckRuleListResponse> {
    try {
      const res = await $axios.post(api.lawyer.getCrawlCheckRuleList, null, {
        params: { id: params.id }
      });
      return (
        res.data || {
          status: 500,
          message: 'No data received',
          success: false,
          timestamp: Date.now(),
          data: []
        }
      );
    } catch (error) {
      console.error('Error getting crawl check rule list:', error);
      return {
        status: 500,
        message: error instanceof Error ? error.message : 'Unknown error',
        success: false,
        timestamp: Date.now(),
        data: []
      };
    }
  },

  // ==================== 爬取配置相关方法 ====================
  async getCrawlConfigList(params: CrawlConfigQueryParams): Promise<CrawlConfigResponse> {
    const defaultData = {
      total: 0,
      size: params.size || 10,
      current: params.current || 1,
      records: [],
      optimizeCountSql: true,
      hitCount: false,
      countId: null,
      maxLimit: null,
      searchCount: true,
      pages: 0
    };

    try {
      const res = await $axios.post(api.lawyer.getCrawlConfigList, params);
      return (
        res.data || {
          status: 500,
          message: 'No data received',
          success: false,
          timestamp: Date.now(),
          data: defaultData
        }
      );
    } catch (error) {
      console.error('Error fetching crawl config list:', error);
      return {
        status: 500,
        message: error instanceof Error ? error.message : 'Unknown error',
        success: false,
        timestamp: Date.now(),
        data: defaultData
      };
    }
  },

  async addCrawlConfig(params: AddCrawlConfigParams): Promise<CrawlConfigOperationResponse> {
    const defaultResponse = {
      status: 500,
      message: 'No response received',
      success: false,
      timestamp: Date.now(),
      data: ''
    };

    try {
      const res = await $axios.post(api.lawyer.addCrawlConfig, params);
      return res.data || defaultResponse;
    } catch (error) {
      console.error('Error adding crawl config:', error);
      return {
        ...defaultResponse,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  async updateCrawlConfig(params: UpdateCrawlConfigParams): Promise<CrawlConfigOperationResponse> {
    const defaultResponse = {
      status: 500,
      message: 'No response received',
      success: false,
      timestamp: Date.now(),
      data: ''
    };

    try {
      const res = await $axios.post(api.lawyer.updateCrawlConfig, params);
      return res.data || defaultResponse;
    } catch (error) {
      console.error('Error updating crawl config:', error);
      return {
        ...defaultResponse,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  async deleteCrawlConfig(params: DeleteCrawlConfigParams): Promise<CrawlConfigOperationResponse> {
    const defaultResponse = {
      status: 500,
      message: 'No response received',
      success: false,
      timestamp: Date.now(),
      data: ''
    };

    try {
      const res = await $axios.post(api.lawyer.deleteCrawlConfig, null, {
        params: { id: params.id }
      });
      return res.data || defaultResponse;
    } catch (error) {
      console.error('Error deleting crawl config:', error);
      return {
        ...defaultResponse,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
  // ==================== AI对比相关方法 ====================
  async getRuleDetailList(): Promise<RuleDetailItem[]> {
    try {
      const res = await $axios.post(api.lawyer.getRuleDetailList);
      const responseData = res.data || { data: [] };
      return (responseData.data || []).map((item: RuleDetailItem) => ({
        id: item.id,
        fileContent: item.fileContent,
        ruleName: item.ruleName,
        publishDateStr: item.publishDateStr
      }));
    } catch (error) {
      console.error('Error fetching rule detail list:', error);
      return [];
    }
  },

  async generateComparison(params: { oldId: string; newId: string }): Promise<string> {
    try {
      const res = await $axios.post(api.lawyer.generateComparison, null, {
        params
      });
      const responseData = res.data || {};
      return responseData.data || '';
    } catch (error) {
      console.error('Error generating comparison:', error);
      throw error;
    }
  },

  async deleteComparison(params: { id: string }): Promise<boolean> {
    try {
      const res = await $axios.post(api.lawyer.deleteComparison, null, {
        params
      });
      return res.data?.success || false;
    } catch (error) {
      console.error('Error deleting comparison:', error);
      return false;
    }
  }
});
