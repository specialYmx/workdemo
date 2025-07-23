import { AxiosInstance } from "axios";
import { LawyerService } from "~/model/LawyerModel";
import api from "~/api";

// 将对象转换为FormData的辅助函数
const toFormData = (obj: any): FormData => {
  const formData = new FormData();
  if (obj && typeof obj === "object") {
    Object.keys(obj).forEach((key) => {
      const value = obj[key];
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          // 处理数组参数
          value.forEach((item, index) => {
            formData.append(`${key}[${index}]`, item);
          });
        } else {
          formData.append(key, value);
        }
      }
    });
  }
  return formData;
};

export default ($axios: AxiosInstance): LawyerService => ({
  // ==================== 首页统计相关方法 ====================
  async getCheckComplateList(params = {}) {
    try {
      const res = await $axios.post(
        `${api.lawyer.getCheckComplateList}`,
        toFormData(params)
      );
      if (res.data?.data !== undefined && res.data?.data !== null) {
        return res.data.data;
      }
      return [];
    } catch (error) {
      console.error("Error fetching check complete list:", error);
      return [];
    }
  },

  async getUpdateCount(params = {}) {
    try {
      const res = await $axios.post(
        `${api.lawyer.getUpdateCount}`,
        toFormData(params)
      );
      if (res.data?.data !== undefined && res.data?.data !== null) {
        return res.data.data;
      }
      return 0;
    } catch (error) {
      console.error("Error fetching update count:", error);
      return 0;
    }
  },

  async getUpdateTimeLinessCount(params = {}) {
    try {
      const res = await $axios.post(
        `${api.lawyer.getUpdateTimeLinessCount}`,
        toFormData(params)
      );
      if (res.data?.data !== undefined && res.data?.data !== null) {
        return res.data.data;
      }
      return {};
    } catch (error) {
      console.error("Error fetching update timeliness count:", error);
      return {};
    }
  },

  async getWebSiteRatio(params = {}) {
    try {
      const res = await $axios.post(
        `${api.lawyer.getWebSiteRatio}`,
        toFormData(params)
      );
      if (res.data?.data !== undefined && res.data?.data !== null) {
        return res.data.data;
      }
      return {};
    } catch (error) {
      console.error("Error fetching website ratio:", error);
      return {};
    }
  },

  // ==================== 大家智库相关方法 ====================
  async deleteRuleSource(params) {
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

  async downloadRuleFile(params) {
    try {
      // GET请求保持不变，使用params参数
      const res = await $axios.get(`${api.lawyer.downloadRuleFile}`, {
        params,
        responseType: "blob",
      });
      if (res.data) return { data: res.data, headers: res.headers };
      return null;
    } catch (error) {
      console.error("Error downloading rule file:", error);
      return null;
    }
  },

  async getRuleSourceCollect(params) {
    try {
      const res = await $axios.post(
        `${api.lawyer.getRuleSourceCollect}`,
        toFormData(params)
      );
      if (res.data?.data !== undefined && res.data?.data !== null) {
        return res.data.data;
      }
      return [];
    } catch (error) {
      console.error("Error fetching rule source collect:", error);
      return [];
    }
  },

  async getRuleSourceDetail(params) {
    try {
      const res = await $axios.post(
        `${api.lawyer.getRuleSourceDetail}`,
        toFormData(params)
      );
      if (res.data?.data !== undefined && res.data?.data !== null) {
        return res.data.data;
      }
      return {};
    } catch (error) {
      console.error("Error fetching rule source detail:", error);
      return {};
    }
  },

  async getRuleSourceList(params) {
    try {
      const res = await $axios.post(
        `${api.lawyer.getRuleSourceList}`,
        toFormData(params)
      );
      if (res.data?.data !== undefined && res.data?.data !== null) {
        return res.data.data;
      }
      return { list: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };
    } catch (error) {
      console.error("Error fetching rule source list:", error);
      return { list: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };
    }
  },

  async getRuleUpdateList(params) {
    try {
      const res = await $axios.post(
        `${api.lawyer.getRuleUpdateList}`,
        toFormData(params)
      );
      if (res.data?.data !== undefined && res.data?.data !== null) {
        return res.data.data;
      }
      return { list: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };
    } catch (error) {
      console.error("Error fetching rule update list:", error);
      return { list: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };
    }
  },

  async initData(params = {}) {
    try {
      const res = await $axios.post(
        `${api.lawyer.initData}`,
        toFormData(params)
      );
      if (res.data?.data !== undefined && res.data?.data !== null) {
        return res.data.data;
      }
      return {};
    } catch (error) {
      console.error("Error initializing data:", error);
      return {};
    }
  },

  async saveOrCancelCollect(params) {
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

  async updateTimeLinessSchedule(params) {
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

  async uploadRuleSource(params) {
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
  async approveToDoRule(params) {
    try {
      const res = await $axios.post(
        `${api.lawyer.approveToDoRule}`,
        toFormData(params)
      );
      return res.data?.success || false;
    } catch (error) {
      console.error("Error approving todo rule:", error);
      return false;
    }
  },

  async deleteToDoRule(params) {
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

  async exportExcel(params) {
    try {
      // 支持新的ids数组参数和旧的id参数
      let requestUrl = `${api.lawyer.exportExcel}`;
      let requestData = {};

      if (params.ids && Array.isArray(params.ids)) {
        // 新的批量导出方式：使用POST请求体传递ids数组
        requestData = { ids: params.ids };
      } else if (params.id) {
        // 兼容旧的单个id导出方式
        requestUrl = `${api.lawyer.exportExcel}?id=${params.id}`;
      } else {
        throw new Error("缺少必要的导出参数：需要提供 ids 数组或 id");
      }

      const res = await $axios.post(requestUrl, toFormData(requestData), {
        responseType: "blob",
      });

      if (res.data) return { data: res.data, headers: res.headers };
      return null;
    } catch (error) {
      console.error("Error exporting excel:", error);
      return null;
    }
  },

  async getDiffResultSchedule(params) {
    try {
      const res = await $axios.post(
        `${api.lawyer.getDiffResultSchedule}`,
        toFormData(params)
      );
      if (res.data?.data !== undefined && res.data?.data !== null) {
        return res.data.data;
      }
      return {};
    } catch (error) {
      console.error("Error fetching diff result schedule:", error);
      return {};
    }
  },

  async getToDoRuleDetail(params) {
    try {
      const res = await $axios.post(
        `${api.lawyer.getToDoRuleDetail}`,
        toFormData(params)
      );
      if (res.data?.data !== undefined && res.data?.data !== null) {
        return res.data.data;
      }
      return {};
    } catch (error) {
      console.error("Error fetching todo rule detail:", error);
      return {};
    }
  },

  async getCheckRuleList(params) {
    try {
      const res = await $axios.post(
        `${api.lawyer.getCheckRuleList}`,
        toFormData(params)
      );
      console.log("🚀 ~ getCheckRuleList ~ res:", res);

      // 处理响应数据，确保即使data为null也能正确处理
      if (res.data?.data) {
        return res.data.data;
      }
      return [];
    } catch (error) {
      console.error("Error fetching check rule list:", error);
      return [];
    }
  },
});
