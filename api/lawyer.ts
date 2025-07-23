export default {
  // ==================== 首页统计相关接口 (rule-statistic-controller) ====================
  getCheckComplateList: "/rule/getCheckComplateList", // 获取检查完成列表
  getUpdateCount: "/rule/getUpdateCount", // 获取更新数量
  getUpdateTimeLinessCount: "/rule/getUpdateTimeLinessCount", // 获取更新及时性统计
  getWebSiteRatio: "/rule/getWebSiteRatio", // 获取网站比例统计

  // ==================== 大家智库相关接口 (rule-source-controller) ====================
  deleteRuleSource: "/rule/deleteRuleSource", // 删除法规资源
  downloadRuleFile: "/rule/download", // 下载法规文件
  getRuleSourceCollect: "/rule/getRuleSourceCollect", // 获取法规收藏
  getRuleSourceDetail: "/rule/getRuleSourceDetail", // 获取法规详情
  getRuleSourceList: "/rule/getRuleSourceList", // 大家智库-列表页
  getRuleUpdateList: "/rule/getRuleUpdateList", // 智库更新-列表页
  initData: "/rule/initData", // 初始化数据
  saveOrCancelCollect: "/rule/saveOrCancelCollect", // 保存或取消收藏
  updateTimeLinessSchedule: "/rule/updateTimeLinessSchedule", // 更新及时性调度
  uploadRuleSource: "/rule/uploadRuleSource", // 大家智库-上传更新

  // ==================== 人工审核相关接口 (rule-to-do-controller) ====================
  approveToDoRule: "/rule/approveToDoRule", // 审核接口（通过approvalComment传递状态）
  deleteToDoRule: "/rule/deleteToDoRule", // 删除待办规则
  exportExcel: "/rule/exportExcel", // 导出Excel
  getDiffResultSchedule: "/rule/getDiffResultSchedule", // 获取差异结果调度
  getToDoRuleDetail: "/rule/getToDoRuleDetail", // 待审核列表-查询详情(比对结果)
  getCheckRuleList: "/rule/getCheckRuleList", // 人工审核与数据管理-查询
} as Record<string, string>;
