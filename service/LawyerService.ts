import { AxiosInstance } from "axios";
import {
  LawyerService,
  FileCompareDetail,
  KnowledgeDataItem,
} from "~/model/LawyerModel";
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

  async getRuleSourceList(params): Promise<KnowledgeDataItem[]> {
    try {
      const res = await $axios.post(
        `${api.lawyer.getRuleSourceList}`,
        toFormData(params)
      );
      if (res.data?.data !== undefined && res.data?.data !== null) {
        return res.data.data;
      }
      return [];
    } catch (error) {
      console.error("Error fetching rule source list:", error);
      return [];
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
      // 支持ids数组参数
      let requestUrl = `${api.lawyer.exportExcel}`;

      if (params.ids && Array.isArray(params.ids)) {
        // 将ids数组转换为JSON字符串传递给后端
        const formData = new FormData();
        formData.append("ids", JSON.stringify(params.ids));

        console.log("导出参数:", JSON.stringify(params.ids));

        const res = await $axios.post(requestUrl, formData, {
          responseType: "blob",
        });

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
      // 使用固定的mock数据，因为真实API只有id=1的数据
      const data = {
        newFileVersion: 2, // 修改为数字值
        effect_date: "2023-03-03",
        newFileContent:
          "中华人民共和国保险法\n2015年第三次修正\n\n（1995年6月30日第八届全国人民代表大会常务委员会第十四次会议通过　根据2002年10月28日第九届全国人民代表大会常务委员会第三十次会议《关于修改〈中华人民共和国保险法〉的决定》第一次修正　2009年2月28日第十一届全国人民代表大会常务委员会第七次会议修订 根据2014年8月31日第十二届全国人民代表大会常务委员会第十次会议《关于修改<中华人民共和国保险法>等五部法律的决定》第二次修正 根据2015年4月24日第十二届全国人民代表大会常务委员会第十四次会议《关于修改<中国人民共和国计量法>等五部法律的决定》第三次修正）\n第一章　总则22\n第一条  为了规范保险活动，保护保险活动当事人的合法权益，加强对保险业的监督管理，维护社会经济秩序和社会公共利益，促进保险事业的健康发展，制定本法。\n第二条  本法aa所称保险，是指投保人根据合同约定，向保险人支付保险费，保险人对于合同约定的可能发生的事故因其发生所造成的财产损失承担赔偿保险金责任，或者当被保险人死亡、伤残、疾病或者达到合同约定的年龄、期限等条件时承担给付保险金责任的商业保险行为。\n第三条  在中华人民共和国境内从事保险活动，适用本法。\n第四条  从事保险活动必须遵守法律、行政法规，尊重社会公德，不得损害社会公共利益。\n第五条  保险活动当事人行使权利、履行义务应当遵循诚实信用原则。\n第六条  保险业务bb由依照本法设立的保险公司以及法律、行政法规规定的其他保险组织经营，其他单位和个人不得经营保险业务。\n第七条  在中华人民共和国境内的法人和其他组织需要办理境内保险的，应当向中华人民共和国境内的保险公司投保。\n第九条  国务院保险监督管理机构依法对保险业实施监督管理。\n国务院保险监督管理机构根据履行职责的需要设立派出机构。派出机构按照国务院保险监督管理机构的授权履行监督管理职责。\n第十条  cccc",
        categoryMain: "公司治理",
        newPublishTime: "2023-03-03",
        oldFileContent:
          "中华人民共和国保险法\n2015年第三次修正\n\n（1995年6月30日第八届全国人民代表大会常务委员会第十四次会议通过　根据2002年10月28日第九届全国人民代表大会常务委员会第三十次会议《关于修改〈中华人民共和国保险法〉的决定》第一次修正　2009年2月28日第十一届全国人民代表大会常务委员会第七次会议修订 根据2014年8月31日第十二届全国人民代表大会常务委员会第十次会议《关于修改<中华人民共和国保险法>等五部法律的决定》第二次修正 根据2015年4月24日第十二届全国人民代表大会常务委员会第十四次会议《关于修改<中国人民共和国计量法>等五部法律的决定》第三次修正）\n第一章　总则\n第一条  为了规范保险活动，保护保险活动当事人的合法权益，加强对保险业的监督管理，维护社会经济秩序和社会公共利益，促进保险事业的健康发展，制定本法。\n第二条  本法所称保险，是指投保人根据合同约定，向保险人支付保险费，保险人对于合同约定的可能发生的事故因其发生所造成的财产损失承担赔偿保险金责任，或者当被保险人死亡、伤残、疾病或者达到合同约定的年龄、期限等条件时承担给付保险金责任的商业保险行为。\n第三条  在中华人民共和国境内从事保险活动，适用本法。\n第四条  从事保险活动必须遵守法律、行政法规，尊重社会公德，不得损害社会公共利益。\n第五条  保险活动当事人行使权利、履行义务应当遵循诚实信用原则。\n第六条  保险业务由依照本法设立的保险公司以及法律、行政法规规定的其他保险组织经营，其他单位和个人不得经营保险业务。\n第七条  在中华人民共和国境内的法人和其他组织需要办理境内保险的，应当向中华人民共和国境内的保险公司投保。\n第八条  保险业和银行业、证券业、信托业实行分业经营、分业管理，保险公司与银行、证券、信托业务机构分别设立。国家另有规定的除外。\n第九条  国务院保险监督管理机构依法对保险业实施监督管理。\n国务院保险监督管理机构根据履行职责的需要设立派出机构。派出机构按照国务院保险监督管理机构的授权履行监督管理职责。\n",
        oldFileVersion: 1, // 添加修改前文档版本
        oldPublishTime: "2022-08-15", // 添加修改前文档发布时间
        categorySub: "银行保险机构公司治理监管评估办法",
        checkResult:
          '[{第壹章-标题变更=由"总则"修改为"总则22"}, {第一章 总则-第二条=1. 修改内容：由"本法"修改为："本法aa"；2. 新增条款：22}, {第一章 总则-第六条=1. 修改内容：由"保险业务"修改为："保险业务bb"}, {第一章　总则 第八条=删除条款： 保险业和银行业、证券业、信托业实行分业经营、分业管理，保险公司与银行、证券、信托业务机构分别设立。国家另有规定的除外。}, {第一章=新增条款：第一章　总则22 第十条  cccc}]',
        currentMaxFileVersion: 2,
        id: params.id,
        checkStatus: "0", // 待审核状态
      };
      return data;

      // 注释掉真实API调用
      // const res = await $axios.post(
      //   `${api.lawyer.getToDoRuleDetail}`,
      //   toFormData(params)
      // );
      // if (res.data?.data !== undefined && res.data?.data !== null) {
      //   return res.data.data;
      // }
      // return {};
    } catch (error) {
      console.error("Error fetching todo rule detail:", error);
      // 返回一个符合 FileCompareDetail 类型的空对象
      return {
        newFileVersion: 0,
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

  async getCheckRuleList(params) {
    try {
      const res = await $axios.post(
        `${api.lawyer.getCheckRuleList}`,
        toFormData(params)
      );
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
