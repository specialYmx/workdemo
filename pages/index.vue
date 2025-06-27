<template>
  <div class="lawyer-page-container">
    <!-- 页面头部 -->
    <section class="lawyer-page-header">
      <div class="lawyer-page-header-top">
        <h1>首页概览仪表盘</h1>
        <div class="lawyer-page-header-actions">
          <div class="lawyer-time-range">
            <button
              v-for="(timeOption, index) in timeOptions"
              :key="index"
              :class="[
                'lawyer-time-btn',
                { active: activeTimeRange === timeOption.value },
              ]"
              @click="activeTimeRange = timeOption.value"
            >
              {{ timeOption.label }}
            </button>
          </div>
          <a-button type="primary" icon="file-pdf"> 导出报告 </a-button>
        </div>
      </div>
    </section>

    <!-- 顶部仪表盘 -->
    <div class="lawyer-dashboard-top-row">
      <!-- 左侧面板 -->
      <div class="lawyer-dashboard-left-panel">
        <!-- 统计卡片 -->
        <div class="lawyer-top-stat-cards-container">
          <!-- 使用v-for循环渲染统计卡片 -->
          <div
            v-for="(stat, index) in statCards"
            :key="index"
            class="lawyer-stat-card"
          >
            <div :class="['lawyer-stat-icon', stat.iconClass]">
              <a-icon :type="stat.icon" />
            </div>
            <div class="lawyer-stat-info">
              <div class="lawyer-stat-value">
                {{ stat.value }}
                <span
                  v-if="stat.change"
                  :class="[
                    'lawyer-stat-change',
                    getChangeClass(stat.changeValue),
                  ]"
                >
                  {{ stat.changeValue >= 0 ? "+" : "" }}{{ stat.changeValue }}
                </span>
              </div>
              <div class="lawyer-stat-label">{{ stat.label }}</div>
            </div>
          </div>
        </div>

        <!-- 最近完成审核列表 -->
        <a-card class="lawyer-chart-card" :bordered="false">
          <div class="lawyer-chart-header">
            <h3 class="lawyer-chart-title">近期完成审核</h3>
            <div class="lawyer-chart-actions">
              <a-button
                size="small"
                icon="arrow-right"
                type="link"
                @click="goToReviewPage"
              >
                查看全部
              </a-button>
            </div>
          </div>

          <div class="lawyer-review-list">
            <div
              class="lawyer-review-item"
              v-for="(item, index) in recentReviews"
              :key="index"
            >
              <div class="lawyer-review-content">
                <div class="lawyer-review-title">{{ item.title }}</div>
                <div class="lawyer-review-subtitle">
                  <span>{{ item.date }}</span>
                  <a-divider type="vertical" />
                  <span>审核人: {{ item.reviewer }}</span>
                </div>
              </div>
              <a-tag :color="getReviewStatusColor(item.status)">{{
                getReviewStatusText(item.status)
              }}</a-tag>
            </div>
          </div>
        </a-card>
      </div>

      <!-- 右侧趋势图 -->
      <a-card
        class="lawyer-chart-card"
        :bordered="false"
        id="complianceTrendCard"
      >
        <div class="lawyer-chart-header">
          <h3 class="lawyer-chart-title">法规更新趋势</h3>
          <div class="lawyer-chart-actions">
            <a-select
              v-model="trendChartPeriod"
              size="small"
              style="width: 120px"
              class="lawyer-btn"
            >
              <a-select-option value="month">本月</a-select-option>
              <a-select-option value="quarter">本季度</a-select-option>
              <a-select-option value="year">全年</a-select-option>
            </a-select>
          </div>
        </div>
        <div class="lawyer-chart-container">
          <v-chart
            :options="trendChartOptions"
            :auto-resize="true"
            style="width: 100%; height: 100%"
          />
        </div>
      </a-card>
    </div>

    <!-- Top 5 需要人工审核 -->
    <a-card
      class="lawyer-chart-card"
      :bordered="false"
      style="margin-bottom: 24px"
    >
      <div class="lawyer-chart-header">
        <h3 class="lawyer-chart-title">Top 5 需要人工审核</h3>
        <div class="lawyer-chart-actions">
          <a-button
            size="small"
            icon="arrow-right"
            type="link"
            @click="goToReviewPage"
          >
            查看全部
          </a-button>
        </div>
      </div>

      <a-table
        :columns="reviewColumns"
        :dataSource="topReviews"
        :pagination="false"
        size="middle"
      >
        <template slot="titleColumn" slot-scope="text, record">
          <div style="font-weight: 500">{{ record.title }}</div>
          <div style="font-size: 12px; color: var(--lawyer-text-light)">
            文号：{{ record.docNumber }}
          </div>
        </template>

        <template slot="category" slot-scope="text">
          <a-tag :color="getCategoryColor(text)">{{ text }}</a-tag>
        </template>

        <template slot="status" slot-scope="text">
          <a-tag :color="getReviewStatusColor(text)">{{
            getReviewStatusText(text)
          }}</a-tag>
        </template>

        <template slot="action" slot-scope="text, record">
          <div class="lawyer-table-actions">
            <a-button
              type="default"
              size="small"
              @click="() => viewReviewDetail(record)"
            >
              查看
            </a-button>
            <template v-if="record.status === 'pending'">
              <a-button
                v-for="(action, index) in getRecordActions(record)"
                :key="index"
                :type="action.type"
                size="small"
                @click="() => action.handler(record)"
              >
                {{ action.text }}
              </a-button>
            </template>
          </div>
        </template>
      </a-table>
    </a-card>

    <!-- 环形图表 -->
    <div class="lawyer-two-column-chart-grid">
      <!-- 使用v-for循环渲染饼图卡片 -->
      <a-card
        v-for="(chart, index) in pieCharts"
        :key="index"
        class="lawyer-chart-card"
        :bordered="false"
      >
        <div class="lawyer-chart-header">
          <h3 class="lawyer-chart-title">{{ chart.title }}</h3>
          <div class="lawyer-chart-actions"></div>
        </div>
        <div class="lawyer-chart-container">
          <v-chart
            :options="chart.options"
            :auto-resize="true"
            style="width: 100%; height: 100%; max-width: 100%"
          />
        </div>
      </a-card>
    </div>

    <!-- 最新法规更新卡片 -->
    <a-card
      class="lawyer-chart-card"
      :bordered="false"
      style="margin-top: 24px"
    >
      <div class="lawyer-chart-header">
        <h3 class="lawyer-chart-title">最新法规更新</h3>
        <div class="lawyer-chart-actions">
          <a-button
            size="small"
            icon="arrow-right"
            type="link"
            @click="goToUpdatesPage"
          >
            查看全部
          </a-button>
        </div>
      </div>

      <div class="lawyer-update-list">
        <div
          v-for="(item, index) in latestUpdates"
          :key="index"
          class="lawyer-update-item"
        >
          <div :class="['lawyer-update-icon', getUpdateIconClass(item.status)]">
            <a-icon :type="getUpdateIconType(item.status || item.icon)" />
          </div>
          <div class="lawyer-update-content">
            <div class="lawyer-update-header">
              <h4 class="lawyer-update-title">
                <a @click="viewUpdateDetail(item)">{{ item.title }}</a>
              </h4>
              <span class="lawyer-update-time">{{ item.date }}</span>
            </div>
            <p class="lawyer-update-description">
              {{ item.description }}
            </p>
            <div class="lawyer-update-ai-analysis" v-if="item.analysis">
              <div class="lawyer-update-ai-header">
                <a-icon type="robot" /> AI智能解读主要变更点
              </div>
              <ul class="lawyer-update-ai-points">
                <li v-for="(point, i) in item.analysis" :key="i">
                  {{ point }}
                </li>
              </ul>
            </div>
            <div class="lawyer-update-tags">
              <a-tag :color="getCategoryColor(item.category)">
                {{ item.category }}
              </a-tag>
              <a-tag :color="getUpdateStatusColor(item.status)">
                {{ getUpdateStatusText(item.status) }}
              </a-tag>
            </div>
          </div>
        </div>
      </div>
    </a-card>
  </div>
</template>

<script lang="ts">
// @ts-nocheck
import { Component, Vue } from "nuxt-property-decorator";

@Component({
  head() {
    return {
      title: "首页概览 - 法律合规智能系统",
    };
  },
})
export default class IndexPage extends Vue {
  // 时间范围选项
  timeOptions = [
    { label: "本月", value: "month" },
    { label: "本季度", value: "quarter" },
    { label: "本年", value: "year" },
  ];

  // 当前选中的时间范围
  activeTimeRange = "month";

  // 图表相关
  trendChartPeriod = "month";

  // 统计卡片数据
  statCards = [
    {
      icon: "file-text",
      iconClass: "lawyer-updates",
      value: 12,
      label: "本月法规更新",
      change: true,
      changeValue: 3,
    },
    {
      icon: "edit",
      iconClass: "lawyer-manual-review",
      value: 5,
      label: "待人工审核",
      change: true,
      changeValue: -2,
    },
  ];

  // 审核列表表格列定义
  reviewColumns = [
    {
      title: "标题 / 文号",
      key: "title",
      scopedSlots: { customRender: "titleColumn" },
    },
    {
      title: "分类",
      dataIndex: "category",
      key: "category",
      scopedSlots: { customRender: "category" },
      width: 120,
    },
    {
      title: "来源",
      dataIndex: "source",
      key: "source",
      width: 120,
    },
    {
      title: "提交时间",
      dataIndex: "date",
      key: "date",
      width: 150,
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 100,
      scopedSlots: { customRender: "status" },
    },
    {
      title: "操作",
      key: "action",
      width: 240,
      scopedSlots: { customRender: "action" },
    },
  ];

  // 近期完成审核（模拟数据）
  recentReviews = [
    {
      title: "《新版数据跨境传输安全管理办法》解读",
      date: "2023-06-18",
      reviewer: "张律师",
      status: "approved",
    },
    {
      title: "关于临时部署特定数据安全措施的建议",
      date: "2023-06-17",
      reviewer: "王审核",
      status: "rejected",
    },
    {
      title: "内部审计计划更新与国税总局报告",
      date: "2023-06-16",
      reviewer: "李专家",
      status: "approved",
    },
  ];

  // Top 5 需要人工审核（模拟数据）
  topReviews = [
    {
      key: "1",
      title: "《个人信息保护法》第二十五条解释说明",
      docNumber: "法规解释[2023]25号",
      date: "2023-06-15 14:30",
      category: "法律法规",
      source: "合规部",
      status: "pending",
    },
    {
      key: "2",
      title: "《网络安全法》实施细则修订版",
      docNumber: "网安实施[2023]02号",
      date: "2023-06-14 09:15",
      category: "监管政策",
      source: "安全部",
      status: "pending",
    },
    {
      key: "3",
      title: "数据出境安全评估操作指南",
      docNumber: "数据安全[2023]18号",
      date: "2023-06-13 16:45",
      category: "内部指南",
      source: "数据部",
      status: "pending",
    },
    {
      key: "4",
      title: "企业数据合规手册",
      docNumber: "数据合规[2023]07号",
      date: "2023-06-12 11:30",
      category: "内部指南",
      source: "合规部",
      status: "pending",
    },
    {
      key: "5",
      title: "互联网行业广告合规指南",
      docNumber: "广告合规[2023]03号",
      date: "2023-06-11 10:00",
      category: "法律法规",
      source: "营销部",
      status: "pending",
    },
  ];

  // 最新法规更新（模拟数据）
  latestUpdates = [
    {
      id: "1",
      title: "《中华人民共和国数据安全法》",
      description:
        "为了规范数据处理活动，保障数据安全，促进数据开发利用，保护个人、组织的合法权益，维护国家主权、安全和发展利益，制定本法。",
      date: "2023-06-10 15:30",
      status: "new",
      category: "法律法规",
      icon: "bank",
      analysis: [
        "确立了数据分类分级管理制度，明确了国家核心数据保护要求",
        "设立数据安全工作协调机制，建立健全集中统一、协调高效的数据安全风险评估机制",
        "明确数据处理者的安全保护义务，加强对数据安全事件的应急处置",
        "明确禁止向外国司法或执法机构提供存储于中国境内的数据，除非经主管机关批准",
      ],
    },
    {
      id: "2",
      title: "《个人信息保护法》",
      description:
        "为了保护个人信息权益，规范个人信息处理活动，促进个人信息合理利用，根据宪法，制定本法。本法明确了个人信息处理的规则，保障个人对个人信息处理的知情权和控制权。",
      date: "2023-06-09 09:20",
      status: "effective",
      category: "法律法规",
      icon: "safety-certificate",
      analysis: [
        "明确了个人信息处理应当遵循合法、正当、必要和诚信原则",
        "个人信息处理应当取得个人的同意，并且提供便捷的撤回同意的方式",
        "增强个人信息主体权利，包括知情权、决定权、查阅权、复制权等",
        "规定了个人敏感信息的特殊保护规则，包括生物识别、宗教信仰、特定身份等",
      ],
    },
    {
      id: "3",
      title: "《汽车数据安全管理若干规定（试行）》",
      description:
        "为规范汽车数据处理活动，保障汽车数据安全，保护个人、组织合法权益，促进汽车数据依法合理有效利用，根据相关法律法规，制定本规定。",
      date: "2023-06-08 14:15",
      status: "updated",
      category: "监管政策",
      icon: "car",
      analysis: [
        "新增对智能网联汽车运行中收集的个人信息和重要数据的特殊管理规定",
        "汽车数据处理者应当建立汽车数据安全管理制度，并进行风险评估",
        "处理重要数据的汽车数据处理者需要按照有关规定进行数据出境安全评估",
        "要求车辆设计默认不记录车外图像、生物特征等敏感信息，除非驾驶员主动开启",
      ],
    },
    {
      id: "4",
      title: "《网络安全审查办法》（修订征求意见稿）",
      description:
        "为了确保关键信息基础设施供应链安全、网络安全和数据安全，保障国家安全，修订本办法。主要修改内容包括扩大审查范围、调整审查重点等方面。",
      date: "2023-06-07 11:30",
      status: "draft",
      category: "征求意见",
      icon: "safety",
      analysis: [
        "扩大网络安全审查范围，新增对赴国外上市企业的审查要求",
        "调整网络安全审查重点，增加对数据处理活动的国家安全风险评估",
        "网络平台运营者掌握超过100万用户个人信息须申报网络安全审查",
        "明确网络安全审查工作机制，增加网信办、证监会等部门协调职责",
      ],
    },
    {
      id: "5",
      title: "关联交易管理制度修订及执行指引",
      description:
        "根据最新监管要求，公司修订关联交易管理制度，制定详细执行指引。修订要点：扩大关联方认定范围、完善审批流程、加强持续监管、明确责任追究机制。",
      date: "2023-06-06 16:45",
      status: "updated",
      category: "内部制度",
      icon: "apartment",
      analysis: [
        "扩大关联方认定范围，新增对实质控制关系的认定标准",
        "完善关联交易审批流程，强化董事会和股东大会在重大关联交易中的决策职责",
        "加强对持续性关联交易的跟踪监管，建立定期评估与报告机制",
        "明确违规责任追究机制，对故意隐瞒关联关系等行为设定惩戒措施",
      ],
    },
  ];

  // 法规更新趋势图配置
  get trendChartOptions() {
    return {
      color: ["#f59e0b", "#10b981", "#ef4444"],
      tooltip: {
        trigger: "axis",
      },
      legend: {
        data: ["新发布", "修订", "废止"],
        bottom: 0,
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "15%",
        top: "3%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: [
          "1日",
          "3日",
          "5日",
          "7日",
          "9日",
          "11日",
          "13日",
          "15日",
          "17日",
          "19日",
          "21日",
          "23日",
          "25日",
          "27日",
          "29日",
        ],
      },
      yAxis: {
        type: "value",
      },
      series: [
        {
          name: "新发布",
          type: "line",
          smooth: true,
          areaStyle: {
            opacity: 0.15,
          },
          data: [3, 5, 2, 6, 5, 7, 4, 5, 2, 8, 3, 5, 3, 4, 5],
        },
        {
          name: "修订",
          type: "line",
          smooth: true,
          areaStyle: {
            opacity: 0.15,
          },
          data: [3, 3, 5, 4, 4, 3, 3, 4, 5, 3, 4, 4, 4, 5, 5],
        },
        {
          name: "废止",
          type: "line",
          smooth: true,
          areaStyle: {
            opacity: 0.15,
          },
          data: [0, 2, 2, 1, 0, 2, 0, 0, 2, 1, 0, 2, 1, 1, 0],
        },
      ],
    };
  }

  // 法规更新来源分布图表配置
  get sourcesChartOptions() {
    return {
      color: ["#f59e0b", "#10b981", "#ef4444", "#3b82f6", "#8b5cf6"],
      tooltip: {
        trigger: "item",
        formatter: "{a} <br/>{b}: {c} ({d}%)",
      },
      legend: {
        orient: "vertical",
        right: 10,
        top: "center",
        textStyle: {
          width: 100,
          overflow: "break",
        },
        data: ["全国人大", "国务院", "监管部门", "地方政府", "行业协会"],
      },
      series: [
        {
          name: "来源分布",
          type: "pie",
          radius: ["40%", "60%"],
          center: ["40%", "50%"],
          avoidLabelOverlap: false,
          label: {
            show: false,
          },
          emphasis: {
            label: {
              show: true,
              fontSize: "16",
              fontWeight: "bold",
            },
          },
          labelLine: {
            show: false,
          },
          data: [
            { value: 35, name: "全国人大" },
            { value: 30, name: "国务院" },
            { value: 20, name: "监管部门" },
            { value: 10, name: "地方政府" },
            { value: 5, name: "行业协会" },
          ],
        },
      ],
    };
  }

  // 法规更新类型分布图表配置
  get typesChartOptions() {
    return {
      color: ["#f59e0b", "#10b981", "#ef4444", "#3b82f6"],
      tooltip: {
        trigger: "item",
        formatter: "{a} <br/>{b}: {c} ({d}%)",
      },
      legend: {
        orient: "vertical",
        right: 10,
        top: "center",
        textStyle: {
          width: 100,
          overflow: "break",
        },
        data: ["法律", "行政法规", "部门规章", "规范性文件"],
      },
      series: [
        {
          name: "类型分布",
          type: "pie",
          radius: ["40%", "60%"],
          center: ["40%", "50%"],
          avoidLabelOverlap: false,
          label: {
            show: false,
          },
          emphasis: {
            label: {
              show: true,
              fontSize: "16",
              fontWeight: "bold",
            },
          },
          labelLine: {
            show: false,
          },
          data: [
            { value: 15, name: "法律" },
            { value: 25, name: "行政法规" },
            { value: 35, name: "部门规章" },
            { value: 25, name: "规范性文件" },
          ],
        },
      ],
    };
  }

  // 获取审核状态标签颜色
  getReviewStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      pending: "orange",
      approved: "green",
      rejected: "red",
    };
    return colorMap[status] || "blue";
  }

  // 获取审核状态显示文本
  getReviewStatusText(status: string): string {
    const textMap: Record<string, string> = {
      pending: "待审核",
      approved: "已通过",
      rejected: "已驳回",
    };
    return textMap[status] || "未知";
  }

  // 获取更新状态标签颜色
  getUpdateStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      new: "#f50",
      updated: "#108ee9",
      effective: "#87d068",
      draft: "#2db7f5",
    };
    return colorMap[status] || "default";
  }

  // 获取更新状态显示文本
  getUpdateStatusText(status: string): string {
    const textMap: Record<string, string> = {
      new: "新发布",
      updated: "已更新",
      effective: "已生效",
      draft: "征求意见",
    };
    return textMap[status] || "未知";
  }

  // 获取分类标签颜色
  getCategoryColor(category: string): string {
    const colorMap: Record<string, string> = {
      法律法规: "red",
      监管政策: "orange",
      内部指南: "green",
    };
    return colorMap[category] || "blue";
  }

  // 审核通过
  approveDocument(record: any): void {
    this.$message.success(`已批准: ${record.title}`);
    // 实际项目中应该调用API并刷新数据
  }

  // 审核驳回
  rejectDocument(record: any): void {
    this.$message.warning(`已驳回: ${record.title}`);
    // 实际项目中应该调用API并刷新数据
  }

  // 移除文档
  removeDocument(record: any): void {
    this.$message.info(`已移除: ${record.title}`);
    // 实际项目中应该调用API并刷新数据
  }

  // 跳转到审核页面
  goToReviewPage() {
    this.$router.push("/db");
  }

  // 跳转到更新页面
  goToUpdatesPage() {
    this.$router.push("/updates");
  }

  // 查看审核详情
  viewReviewDetail(record: any) {
    this.$router.push(`/document-compare/${record.key}`);
  }

  // 查看更新详情
  viewUpdateDetail(item: any) {
    this.$router.push(`/document/${item.id || "1"}`);
  }

  // 获取更新图标类
  getUpdateIconClass(status: string): string {
    const classMap: Record<string, string> = {
      new: "lawyer-icon-primary",
      updated: "lawyer-icon-warning",
      effective: "lawyer-icon-success",
      draft: "lawyer-icon-info",
    };
    return classMap[status] || "lawyer-icon-primary";
  }

  // 获取更新图标类型
  getUpdateIconType(status: string): string {
    const typeMap: Record<string, string> = {
      new: "file-text",
      updated: "file-text",
      effective: "file-text",
      draft: "file-text",
    };
    return typeMap[status] || "file-text";
  }

  // 获取变化样式类
  getChangeClass(value) {
    return value >= 0 ? "lawyer-positive" : "lawyer-negative";
  }

  // 获取记录的操作按钮
  getRecordActions(record) {
    return [
      {
        type: "primary",
        text: "批准",
        handler: this.approveDocument,
      },
      {
        type: "danger",
        text: "驳回",
        handler: this.rejectDocument,
      },
      {
        type: "default",
        text: "移除",
        handler: this.removeDocument,
      },
    ];
  }

  // 饼图数据
  get pieCharts() {
    return [
      {
        title: "法规更新来源分布",
        options: this.sourcesChartOptions,
      },
      {
        title: "法规更新类型分布",
        options: this.typesChartOptions,
      },
    ];
  }
}
</script>

<style lang="less" scoped>
.lawyer-dashboard-top-row {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
  align-items: stretch;
}

.lawyer-dashboard-top-row > * {
  flex: 1;
  width: calc(50% - 12px);
}

.lawyer-dashboard-left-panel {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.lawyer-top-stat-cards-container {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
}

.lawyer-top-stat-cards-container > * {
  flex: 1;
  min-width: calc(50% - 12px);
}

.lawyer-stat-card {
  background: var(--lawyer-surface);
  padding: 24px;
  border-radius: 8px;
  border: 1px solid var(--lawyer-border);
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease-in-out;
  display: flex;
  align-items: center;
  gap: 20px;
}

.lawyer-stat-card:hover {
  transform: translateY(-2px);
  border-color: var(--lawyer-primary-light);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.07);
}

.lawyer-stat-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.lawyer-updates {
  background-color: rgba(var(--lawyer-primary-rgb), 0.1);
  color: var(--lawyer-primary);
}

.lawyer-manual-review {
  background-color: rgba(var(--lawyer-danger-rgb), 0.1);
  color: var(--lawyer-danger);
}

.lawyer-stat-info {
  flex-grow: 1;
}

.lawyer-stat-value {
  font-size: 28px;
  font-weight: 600;
  color: var(--lawyer-text);
  margin-bottom: 4px;
}

.lawyer-stat-label {
  font-size: 14px;
  color: var(--lawyer-text-light);
}

.lawyer-stat-change {
  font-size: 13px;
  margin-left: 8px;

  &.lawyer-positive {
    color: var(--lawyer-success);
  }

  &.lawyer-negative {
    color: var(--lawyer-danger);
  }
}

.lawyer-chart-card {
  background: var(--lawyer-surface);
  border-radius: 8px;
  border: 1px solid var(--lawyer-border);
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease-in-out;
  display: flex;
  flex-direction: column;
}

.lawyer-chart-card:hover {
  transform: translateY(-2px);
  border-color: var(--lawyer-primary-light);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.07);
}

.lawyer-chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--lawyer-border-light);
  padding-bottom: 12px;
}

.lawyer-chart-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--lawyer-text);
  margin-bottom: 0;
}

.lawyer-chart-actions {
  display: flex;
  gap: 8px;
}

.lawyer-chart-container {
  padding: 24px;
  height: 350px;
  position: relative;
  flex-grow: 1;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
}

#complianceTrendCard > .lawyer-chart-container {
  height: 350px;
}

.lawyer-two-column-chart-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
}

.lawyer-two-column-chart-grid > * {
  flex: 1;
  min-width: calc(50% - 12px);
}

.lawyer-review-list {
  overflow-y: auto;
  max-height: 240px;
}

.lawyer-review-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px 0;
  border-bottom: 1px solid var(--lawyer-border-light);
  transition: all 0.2s ease-in-out;
  gap: 16px;
}

.lawyer-review-item:last-child {
  border-bottom: none;
}

.lawyer-review-item:hover {
  background-color: rgba(var(--lawyer-primary-rgb), 0.03);
  border-radius: 6px;
  margin: 0 -12px;
  padding: 16px 12px;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.lawyer-review-content {
  flex-grow: 1;
}

.lawyer-review-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--lawyer-text);
  margin-bottom: 4px;
  line-height: 1.4;
}

.lawyer-review-subtitle {
  font-size: 13px;
  color: var(--lawyer-text-light);
}

.lawyer-update-list {
  margin-bottom: 20px;
  padding-bottom: 12px;
  max-height: 600px;
  overflow-y: auto;
  overflow-x: hidden;
}

.lawyer-update-item {
  display: flex;
  gap: 24px;
  margin-top: 16px;
  border-bottom: 1px solid var(--lawyer-border-light);
  padding: 16px 0;
}

.lawyer-update-item:first-child {
  margin-top: 0;
}

.lawyer-update-item:last-child {
  border-bottom: none;
}

.lawyer-update-item:hover {
  background-color: rgba(var(--lawyer-primary-rgb), 0.03);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.lawyer-update-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.lawyer-update-content {
  flex-grow: 1;
  min-width: 0;
}

.lawyer-update-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.lawyer-update-title {
  font-size: 18px;
  font-weight: 500;
  color: var(--lawyer-text);
  margin: 0 0 4px 0;
  line-height: 1.4;
}

.lawyer-update-title a {
  color: var(--lawyer-text);

  &:hover {
    color: var(--lawyer-primary);
    text-decoration: none;
  }
}

.lawyer-update-time {
  font-size: 13px;
  color: var(--lawyer-text-light);
  margin-left: 16px;
}

.lawyer-update-description {
  font-size: 14px;
  color: var(--lawyer-text-light);
  margin: 0 0 12px 0;
  line-height: 1.5;
}

.lawyer-update-ai-analysis {
  background-color: rgba(var(--lawyer-primary-rgb), 0.05);
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;

  .lawyer-update-ai-header {
    font-weight: 500;
    color: var(--lawyer-primary);
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .lawyer-update-ai-points {
    margin: 0;
    padding-left: 20px;

    li {
      margin-bottom: 4px;
      font-size: 13px;
      color: var(--lawyer-text);
      line-height: 1.5;
    }
  }
}

.lawyer-update-tags {
  display: flex;
  gap: 8px;
}

.lawyer-table-actions {
  display: flex;
  gap: 8px;

  .ant-btn {
    padding: 0 8px;
    height: 24px;
    line-height: 22px;
    font-size: 12px;
  }
}

.lawyer-update-icon {
  &.lawyer-icon-primary {
    background-color: rgba(var(--lawyer-primary-rgb), 0.1);
    color: var(--lawyer-primary);
  }

  &.lawyer-icon-success {
    background-color: rgba(16, 185, 129, 0.1);
    color: #059669;
  }

  &.lawyer-icon-warning {
    background-color: rgba(245, 158, 11, 0.1);
    color: #d97706;
  }

  &.lawyer-icon-info {
    background-color: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
  }
}
</style>
