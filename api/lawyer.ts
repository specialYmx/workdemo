export default {
  // ==================== 首页统计相关接口 (rule-statistic-controller) ====================
  getCheckCompleteList: '/legal/getCheckCompleteList', // 获取检查完成列表
  getUpdateCount: '/legal/getUpdateCount', // 获取更新数量 参数：condition : month|quarter|year
  getUpdateTimelinessCount: '/legal/getUpdateTimeLinessCount', // 获取更新及时性统计 参数：condition : month|quarter|year
  getWebSiteRatio: '/legal/getWebSiteRatio', // 获取网站比例统计
  getTodoRuleList: '/legal/getToDoRuleList', // 获取待办列表
  exportStatisticExcel: '/legal/exportStatisticExcel', // 导出Excel报告 参数：condition : month|quarter|year

  // ==================== 大家智库相关接口 (rule-source-controller) ====================
  getLegalCategory: '/legal/getLegalCategory', // 获取专题分类  参数 如id:'2'、id:'3'等，空值表示获取全量数据
  getDepartmentData: '/auth/role/inquireRoles', // 获取部门数据 参数传{current：1，size:999固定这样传参}为了获取所有的部门数据
  deleteRuleSource: '/legal/deleteRuleSource', // 删除法规资源
  downloadRuleFile: '/legal/download', // 下载法规文件
  getRuleSourceCollect: '/legal/getMyCollectionList', // 获取法规收藏
  getRuleSourceDetail: '/legal/getRuleSourceDetail', // 获取法规详情
  updateRuleSourceDetail: '/legal/updateRuleSourceDetail', // 修改法规详情
  getRuleSourceList: '/legal/getRuleSourceList', // 大家智库-列表页
  getRuleUpdateList: '/legal/getRuleUpdateList', // 智库更新-列表页
  saveOrCancelCollect: '/legal/saveOrCancelCollect', // 保存或取消收藏
  updateTimeLinessSchedule: '/legal/updateTimeLinessSchedule', // 更新及时性调度
  uploadRuleSource: '/legal/uploadRuleSource', // 大家智库-上传更新
  getAIRobotAnswer: '/legal/getAIRobotAnswer', // 大家智库-AI问答  searchId文件id  userId用户的empid默认从store的id取 question输入问题  enableNetworkQuery是否联网搜索(可选参数)
  getAdmin: '/legal/getAdmin', // 获取管理员权限状态
  exportWord: '/legal/exportWord', // 导出Word文档 参数：copies (上/下)
  getPreviewUrl: '/legal/preview/url', // 获取iframe预览链接 参数：id

  // ==================== 人工审核相关接口 (rule-to-do-controller) ====================
  approveToDoRule: '/legal/approveToDoRule', // 审核接口（通过approvalComment传递状态）
  deleteToDoRule: '/legal/deleteToDoRule', // 删除待办规则
  exportExcel: '/legal/exportExcel', // 导出Excel
  getDiffResultSchedule: '/legal/getDiffResultSchedule', // 获取差异结果调度
  getToDoRuleDetail: '/legal/getToDoRuleDetail', // 待审核列表-查询详情(比对结果)
  getCheckRuleList: '/legal/getCheckRuleList', // 人工审核与数据管理-查询

  // ==================== 爬取统计相关接口 (rule-crawl-controller) ====================
  getCrawlHtmlList: '/legal/crawl/getHtmlList', // 获取爬取HTML列表
  executeCrawlTask: '/legal/crawl/runTask', // 执行爬取任务
  getCrawlHistory: '/legal/crawl/getCrawlHistory', // 查询执行网页的历史记录
  updateCrawlStatus: '/legal/crawl/updateStatus', // 修改爬取状态
  getTaskHistory: '/legal/crawl/getTaskHistory', // 获取定时任务的执行记录
  getCrawlCheckRuleList: '/legal/crawl/getCheckRuleList', // 查看爬虫对应的审核条数

  // ==================== 爬取配置相关接口 (crawl-config-controller) ====================
  getCrawlConfigList: '/legal/crawl/getConfigList', // 获取爬取配置列表
  addCrawlConfig: '/legal/crawl/addConfig', // 新增爬取配置
  updateCrawlConfig: '/legal/crawl/updateConfig', // 更新爬取配置
  deleteCrawlConfig: '/legal/crawl/deleteConfig', // 删除爬取配置

  // ==================== AI对比相关接口 ====================
  getRuleDetailList: '/legal/getRuleDetailList', // 获取规则详情列表
  generateComparison: '/legal/generateComparison', // 生成对比结果
  deleteComparison: '/legal/deleteComparison' // 清除对比结果
} as Record<string, string>;
