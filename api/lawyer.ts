export default {
  // ==================== 首页统计相关接口 (rule-statistic-controller) ====================
  getCheckCompleteList: "/legal/getCheckCompleteList", // 获取检查完成列表
  getUpdateCount: "/legal/getUpdateCount", // 获取更新数量 参数：condition : month|quarter|year
  getUpdateTimeLinessCount: "/legal/getUpdateTimeLinessCount", // 获取更新及时性统计 参数：condition : month|quarter|year
  getWebSiteRatio: "/legal/getWebSiteRatio", // 获取网站比例统计
  getTodoRuleList: "/legal/getToDoRuleList", // 获取待办列表
  exportStatisticExcel: "/legal/exportStatisticExcel", // 导出Excel报告 参数：condition : month|quarter|year

  // ==================== 大家智库相关接口 (rule-source-controller) ====================
  deleteRuleSource: "/legal/deleteRuleSource", // 删除法规资源
  downloadRuleFile: "/legal/download", // 下载法规文件
  getRuleSourceCollect: "/legal/getMyCollectionList", // 获取法规收藏
  getRuleSourceDetail: "/legal/getRuleSourceDetail", // 获取法规详情
  getRuleSourceList: "/legal/getRuleSourceList", // 大家智库-列表页
  getRuleUpdateList: "/legal/getRuleUpdateList", // 智库更新-列表页
  saveOrCancelCollect: "/legal/saveOrCancelCollect", // 保存或取消收藏
  updateTimeLinessSchedule: "/legal/updateTimeLinessSchedule", // 更新及时性调度
  uploadRuleSource: "/legal/uploadRuleSource", // 大家智库-上传更新
  getAIRobotAnswer: "/legal/getAIRobotAnswer", // 大家智库-AI问答  searchId文件id  userId用户的empid默认从store的id取 question输入问题  enableNetworkQuery是否联网搜索(可选参数)

  // ==================== 人工审核相关接口 (rule-to-do-controller) ====================
  approveToDoRule: "/legal/approveToDoRule", // 审核接口（通过approvalComment传递状态）
  deleteToDoRule: "/legal/deleteToDoRule", // 删除待办规则
  exportExcel: "/legal/exportExcel", // 导出Excel
  getDiffResultSchedule: "/legal/getDiffResultSchedule", // 获取差异结果调度
  getToDoRuleDetail: "/legal/getToDoRuleDetail", // 待审核列表-查询详情(比对结果)
  getCheckRuleList: "/legal/getCheckRuleList", // 人工审核与数据管理-查询

  // ==================== 爬取统计相关接口 (rule-crawl-controller) ====================
  getCrawlHtmlList: "/legal/crawl/getHtmlList", // 获取爬取HTML列表
  executeCrawlTask: "/legal/crawl/grabThisPage", // 执行爬取任务
} as Record<string, string>;
