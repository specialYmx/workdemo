import { AxiosInstance } from "axios";
import {
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
  RuleSourceQueryParams,
  CheckRuleQueryParams,
} from "~/model/LawyerModel";
import api from "~/api";

// 将对象转换为FormData的辅助函数
const toFormData = (obj: Record<string, unknown>): FormData => {
  const formData = new FormData();
  if (obj && typeof obj === "object") {
    Object.keys(obj).forEach((key) => {
      const value = obj[key];
      // 修复：正确处理布尔值false，只排除null和undefined
      if (value !== null && value !== undefined) {
        if (Array.isArray(value)) {
          // 处理数组参数 - 每个元素使用相同的key名
          value.forEach((item) => {
            if (
              typeof item === "string" ||
              typeof item === "number" ||
              typeof item === "boolean"
            ) {
              formData.append(key, String(item));
            } else if (item instanceof Blob) {
              formData.append(key, item);
            }
          });
        } else {
          // 确保值是可以添加到FormData的类型
          if (
            typeof value === "string" ||
            typeof value === "number" ||
            typeof value === "boolean"
          ) {
            formData.append(key, String(value));
          } else if (value instanceof Blob) {
            formData.append(key, value);
          }
        }
      }
    });
  }
  return formData;
};

export default ($axios: AxiosInstance): RoadLawyerService => ({
  // ==================== 首页统计相关方法 ====================
  async getCheckCompleteList(
    params: QueryParams = {}
  ): Promise<CompletedRuleItem[]> {
    try {
      const res = await $axios.post(
        `${api.lawyer.getCheckCompleteList}`,
        toFormData(params)
      );
      if (res.data?.data) {
        return res.data.data;
      }
      return [];
    } catch (error) {
      console.error("Error fetching check complete list:", error);
      return [];
    }
  },

  async getUpdateCount(params: QueryParams = {}): Promise<number> {
    try {
      const res = await $axios.post(
        `${api.lawyer.getUpdateCount}`,
        toFormData(params)
      );
      if (res.data?.data !== undefined && res.data?.data !== null) {
        return Number(res.data.data);
      }
      return 0;
    } catch (error) {
      console.error("Error fetching update count:", error);
      return 0;
    }
  },

  async getUpdateTimeLinessCount(params: QueryParams = {}) {
    try {
      const res = await $axios.post(
        `${api.lawyer.getUpdateTimeLinessCount}`,
        toFormData(params)
      );
      if (res.data?.data) {
        return res.data.data;
      }
      return {};
    } catch (error) {
      console.error("Error fetching update timeliness count:", error);
      return {};
    }
  },

  async getWebSiteRatio(params: QueryParams = {}) {
    try {
      const res = await $axios.post(
        `${api.lawyer.getWebSiteRatio}`,
        toFormData(params)
      );
      if (res.data?.data) {
        return res.data.data;
      }
      return {};
    } catch (error) {
      console.error("Error fetching website ratio:", error);
      return {};
    }
  },

  async exportStatisticExcel(params: { condition: string }) {
    try {
      const res = await $axios.post(
        `${api.lawyer.exportStatisticExcel}`,
        toFormData(params),
        {
          responseType: "blob",
        }
      );
      if (res.data) return { data: res.data, headers: res.headers };
      return null;
    } catch (error) {
      console.error("Error exporting statistic excel:", error);
      throw error;
    }
  },

  // ==================== 大家智库相关方法 ====================
  async deleteRuleSource(params: DeleteRuleParams) {
    try {
      const res = await $axios.post(
        `${api.lawyer.deleteRuleSource}`,
        toFormData(params)
      );
      return res.data?.success || false;
    } catch (error) {
      console.error("Error deleting rule source:", error);
      return false;
    }
  },

  async downloadRuleFile(params: DownloadFileParams) {
    try {
      // 使用POST请求和FormData参数，与其他接口保持一致
      const res = await $axios.post(
        `${api.lawyer.downloadRuleFile}`,
        toFormData(params),
        {
          responseType: "blob",
        }
      );
      if (res.data) return { data: res.data, headers: res.headers };
      return null;
    } catch (error) {
      console.error("Error downloading rule file:", error);
      return null;
    }
  },

  async getRuleSourceCollect(params: QueryParams) {
    try {
      const res = await $axios.post(
        `${api.lawyer.getRuleSourceCollect}`,
        toFormData(params)
      );
      if (res.data?.data) {
        return res.data.data;
      }
      return [];
    } catch (error) {
      console.error("Error fetching rule source collect:", error);
      return [];
    }
  },

  async getRuleSourceDetail(params: {
    searchId: string;
    isRevoke?: boolean;
  }): Promise<KnowledgeDataItem | null> {
    try {
      const res = await $axios.post(
        `${api.lawyer.getRuleSourceDetail}`,
        toFormData(params)
      );
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
      console.error("Error fetching rule source detail:", error);
      return null;
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
  async getRuleSourceList(
    params: RuleSourceQueryParams
  ): Promise<KnowledgeDataItem[]> {
    try {
      const res = await $axios.post(
        `${api.lawyer.getRuleSourceList}`,
        toFormData(params)
      );
      if (res.data?.data) {
        return res.data.data;
      }
      return [];
    } catch (error) {
      console.error("Error fetching rule source list:", error);
      return [];
    }
  },

  async getRuleUpdateList(params: RuleUpdateQueryParams) {
    try {
      const res = await $axios.post(
        `${api.lawyer.getRuleUpdateList}`,
        toFormData(params)
      );
      if (res.data?.data) {
        return res.data.data; // 直接返回数组
      }
      return [];
    } catch (error) {
      console.error("Error fetching rule update list:", error);
      return [];
    }
  },

  async initData(params: QueryParams = {}) {
    try {
      const res = await $axios.post(
        `${api.lawyer.initData}`,
        toFormData(params)
      );
      if (res.data?.data) {
        return res.data.data;
      }
      return {};
    } catch (error) {
      console.error("Error initializing data:", error);
      return {};
    }
  },

  async saveOrCancelCollect(params: CollectParams) {
    try {
      const res = await $axios.post(
        `${api.lawyer.saveOrCancelCollect}`,
        toFormData(params)
      );
      return res.data?.success || false;
    } catch (error) {
      console.error("Error saving or canceling collect:", error);
      return false;
    }
  },

  async updateTimeLinessSchedule(params: QueryParams) {
    try {
      const res = await $axios.post(
        `${api.lawyer.updateTimeLinessSchedule}`,
        toFormData(params)
      );
      return res.data?.success || false;
    } catch (error) {
      console.error("Error updating timeliness schedule:", error);
      return false;
    }
  },

  async uploadRuleSource(params: UploadParams) {
    try {
      const res = await $axios.post(
        `${api.lawyer.uploadRuleSource}`,
        toFormData(params)
      );
      return res.data?.success || false;
    } catch (error) {
      console.error("Error uploading rule source:", error);
      return false;
    }
  },

  // ==================== 人工审核相关方法 ====================
  async approveToDoRule(params: ApprovalParams) {
    try {
      const res = await $axios.post(
        `${api.lawyer.approveToDoRule}`,
        toFormData(params)
      );

      // 检查业务逻辑是否成功
      if (res.data?.success !== true) {
        const errorMsg = res.data?.message || res.data?.msg || "审核操作失败";
        throw new Error(errorMsg);
      }

      return true;
    } catch (error) {
      console.error("Error approving todo rule:", error);
      // 直接重新抛出异常，让调用方处理
      throw error;
    }
  },

  async deleteToDoRule(params: DeleteRuleParams) {
    try {
      const res = await $axios.post(
        `${api.lawyer.deleteToDoRule}`,
        toFormData(params)
      );
      return res.data?.success || false;
    } catch (error) {
      console.error("Error deleting todo rule:", error);
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
            responseType: "blob",
          }
        );
        if (res.data) return { data: res.data, headers: res.headers };
        return null;
      } else {
        throw new Error("缺少必要的导出参数：需要提供 ids 数组");
      }
    } catch (error) {
      console.error("导出Excel错误:", error);
      return null;
    }
  },

  async getDiffResultSchedule(params: QueryParams) {
    try {
      const res = await $axios.post(
        `${api.lawyer.getDiffResultSchedule}`,
        toFormData(params)
      );
      if (res.data?.data) {
        return res.data.data;
      }
      return {};
    } catch (error) {
      console.error("Error fetching diff result schedule:", error);
      return {};
    }
  },

  async getToDoRuleDetail(params: { id: string }) {
    try {
      const res = await $axios.post(
        `${api.lawyer.getToDoRuleDetail}`,
        toFormData(params)
      );

      if (res.data?.data) {
        return res.data.data;
      }

      // 如果接口返回空数据，返回默认结构
      return {
        newFileVersion: null,
        effect_date: "",
        newFileContent: "",
        categoryMain: "",
        newPublishTime: "",
        oldFileContent: "",
        checkResult: "",
        currentMaxFileVersion: 0,
      };
    } catch (error) {
      console.error("Error fetching todo rule detail:", error);
      // 返回一个符合 FileCompareDetail 类型的空对象
      return {
        newFileVersion: null,
        effect_date: "",
        newFileContent: "",
        categoryMain: "",
        newPublishTime: "",
        oldFileContent: "",
        checkResult: "",
        currentMaxFileVersion: 0,
      };
    }
  },

  // 智能规则列表获取方法 - 根据使用场景自动选择合适的接口
  async getRuleList(
    params: CheckRuleQueryParams = {},
    useCase: "homepage" | "management" = "management"
  ) {
    try {
      // 根据使用场景选择接口：
      // homepage: 首页待办列表，使用 getTodoRuleList
      // management: 人工审核管理页面，使用 getCheckRuleList
      const apiEndpoint =
        useCase === "homepage"
          ? api.lawyer.getTodoRuleList
          : api.lawyer.getCheckRuleList;

      const res = await $axios.post(apiEndpoint, toFormData(params));

      if (res.data?.data) {
        return res.data.data;
      }
      return [];
    } catch (error) {
      console.error(`Error fetching rule list (${useCase}):`, error);
      return [];
    }
  },
});
