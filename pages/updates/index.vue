<template>
  <div class="lawyer-page-container">
    <!-- 页面头部 -->
    <section class="lawyer-updates-header">
      <h1>法规更新与通知</h1>
      <div class="lawyer-header-actions">
        <div class="lawyer-filter-tabs">
          <a-button
            v-for="(filter, index) in filterOptions"
            :key="index"
            :class="[
              'lawyer-filter-tab',
              { active: activeFilter === filter.value },
            ]"
            @click="() => setActiveFilter(filter.value)"
            type="link"
          >
            {{ filter.label }}
          </a-button>
        </div>
      </div>
    </section>

    <!-- 法规更新列表 -->
    <div class="lawyer-updates-list">
      <div
        v-for="item in filteredUpdates"
        :key="item.id"
        class="lawyer-update-item"
        :data-type="item.type"
      >
        <div :class="['lawyer-update-icon-container', item.type]">
          <template v-if="item.type === 'law'">⚖️</template>
          <template v-else-if="item.type === 'policy'">📋</template>
          <template v-else-if="item.type === 'internal'">🏢</template>
          <template v-else>🔧</template>
        </div>
        <div class="lawyer-update-content">
          <div class="lawyer-update-header">
            <h3 class="lawyer-update-title">
              <nuxt-link :to="`/document/${item.id}`">{{
                item.title
              }}</nuxt-link>
            </h3>
            <span class="lawyer-update-time">{{ item.date }}</span>
          </div>
          <p class="lawyer-update-summary">{{ item.description }}</p>

          <!-- AI智能解读部分 -->
          <div
            class="lawyer-ai-summary-section"
            v-if="item.aiSummary && item.aiSummary.length > 0"
          >
            <h4 class="lawyer-ai-summary-title">AI智能解读主要变更点：</h4>
            <ul class="lawyer-ai-summary-list">
              <li v-for="(point, idx) in item.aiSummary" :key="idx">
                <strong>{{ point.title }}：</strong> {{ point.content }}
              </li>
            </ul>
          </div>

          <div class="lawyer-update-tags">
            <span
              :class="['lawyer-tag', `lawyer-tag-${item.type}`]"
              v-for="(tag, idx) in item.tags"
              :key="idx"
            >
              {{ tag }}
            </span>
          </div>
          <div class="lawyer-update-actions">
            <a-button
              v-for="(action, index) in updateActions"
              :key="index"
              @click="action.handler(item.id)"
            >
              <a-icon :type="action.icon" /> {{ action.text }}
            </a-button>
          </div>
        </div>
      </div>

      <!-- 无内容展示 -->
      <div class="lawyer-no-updates" v-if="filteredUpdates.length === 0">
        <a-empty description="没有匹配的法规更新" />
      </div>
    </div>

    <!-- 分页器 -->
    <div class="lawyer-pagination">
      <a-pagination
        v-model="currentPage"
        :total="totalItems"
        :page-size="pageSize"
        @change="onPageChange"
      />
    </div>
  </div>
</template>

<script lang="ts">
// @ts-nocheck
import { Component, Vue } from "nuxt-property-decorator";

interface AiSummaryPoint {
  title: string;
  content: string;
}

interface UpdateItem {
  id: string;
  title: string;
  description: string;
  date: string;
  source: string;
  category: string;
  type: string;
  tags: string[];
  aiSummary?: AiSummaryPoint[];
}

@Component({
  head() {
    return {
      title: "法规更新与通知 - 法律合规智能系统",
    };
  },
})
export default class UpdatesPage extends Vue {
  // 筛选相关
  activeFilter = "all";
  currentPage = 1;
  pageSize = 10;
  totalItems = 45;

  // 筛选选项
  filterOptions = [
    { label: "全部更新", value: "all" },
    { label: "法律法规", value: "law" },
    { label: "监管政策", value: "policy" },
    { label: "内部规章", value: "internal" },
    { label: "系统通知", value: "system" },
  ];

  // 法规更新数据（模拟数据）
  updates: UpdateItem[] = [
    {
      id: "1",
      title: "关于进一步规范保险资金股权投资有关事项的通知",
      description:
        "为进一步规范保险资金股权投资行为，防范投资风险，保护被保险人利益，现就有关事项通知如下：一是明确投资决策程序，二是加强风险管控措施，三是强化信息披露要求...",
      date: "2024-01-15 14:30",
      source: "金融监管总局",
      category: "法律法规",
      type: "law",
      tags: ["重要法规", "资金运用"],
      aiSummary: [
        {
          title: "投资决策程序优化",
          content:
            "强调董事会在重大股权投资中的核心决策地位，细化了事前评估、专业评审及投后管理的要求。",
        },
        {
          title: "风险管控体系强化",
          content:
            "新增对股权投资集中度风险的量化指标，要求建立动态调整机制，并明确风险处置预案。",
        },
        {
          title: "信息披露标准提升",
          content:
            "扩大了信息披露范围，要求披露资金来源、投资架构及潜在利益冲突，增强透明度。",
        },
        {
          title: "关联交易限制更严",
          content:
            "进一步明确禁止与主要股东及其关联方进行非公允条件的股权交易。",
        },
      ],
    },
    {
      id: "2",
      title: "偿付能力监管规则修订征求意见稿发布",
      description:
        "为完善偿付能力监管制度，提高监管有效性，金融监管总局发布偿付能力监管规则修订征求意见稿，主要修订内容包括：风险因子调整、资本要求优化、监管指标完善等...",
      date: "2024-01-12 10:15",
      source: "金融监管总局",
      category: "监管政策",
      type: "policy",
      tags: ["征求意见", "偿付能力"],
      aiSummary: [
        {
          title: "核心偿付能力充足率要求调整",
          content: "拟从50%提升至60%，强化资本质量要求。",
        },
        {
          title: "风险综合评级（IRR）引入新维度",
          content: "增加对操作风险、战略风险的评估权重。",
        },
        {
          title: "资产穿透要求细化",
          content: "对特定资管产品（如信托、ABS）的底层资产识别提出更严标准。",
        },
        {
          title: "压力测试场景更新",
          content: "引入更极端的市场波动和巨灾风险情景。",
        },
      ],
    },
    {
      id: "3",
      title: "关联交易管理制度修订及执行指引",
      description:
        "根据最新监管要求，公司修订关联交易管理制度，制定详细执行指引。修订要点：扩大关联方认定范围、完善审批流程、加强持续监管、明确责任追究机制...",
      date: "2024-01-10 16:45",
      source: "内部法务部",
      category: "内部规章",
      type: "internal",
      tags: ["制度修订", "关联交易"],
      aiSummary: [
        {
          title: "关联方识别范围扩大",
          content:
            "新增将持股5%以上自然人股东及其近亲属控制或重大影响的企业纳入关联方。",
        },
        {
          title: "审批权限调整",
          content:
            "对单笔超过净资产1%或年度累计超过5%的关联交易，审批权限上收至董事会关联交易控制委员会。",
        },
        {
          title: "定价公允性要求提升",
          content:
            "强调关联交易需有明确的定价依据，优先采用市场价格，无市场价格的需提供独立第三方评估报告。",
        },
        {
          title: "信息报送与披露强化",
          content:
            "要求在交易发生后5个工作日内向监管部门报备，并在公司官网专栏披露。",
        },
      ],
    },
    {
      id: "4",
      title: "保险公司信息披露管理办法实施细则",
      description:
        "为确保保险公司信息披露管理办法有效执行，制定本实施细则。细则明确了披露时限、披露内容、披露格式等具体要求，并对违规行为的处罚措施进行了细化...",
      date: "2024-01-08 09:30",
      source: "金融监管总局",
      category: "法律法规",
      type: "law",
      tags: ["实施细则", "信息披露"],
      aiSummary: [
        {
          title: "临时报告披露时限明确",
          content: "重大事件需在2个交易日内披露，较原先及时要求更具体。",
        },
        {
          title: "年度报告内容扩展",
          content:
            "新增ESG（环境、社会及治理）信息、消费者权益保护情况的专项披露章节。",
        },
        {
          title: "信息披露负责人制度",
          content:
            "首次要求保险公司设立首席信息披露官或指定高级管理人员全面负责信息披露事务。",
        },
        {
          title: "处罚力度加大",
          content:
            "对信息披露违规行为，罚款上限从50万元提升至100万元，并可对责任人处以市场禁入。",
        },
      ],
    },
    {
      id: "5",
      title: "法律合规智能系统版本更新通知 v2.1.0",
      description:
        "系统新增功能：AI风险预警模块、智能合规检查、批量文档处理等。优化功能：检索算法改进、界面响应速度提升、数据安全增强。请及时更新并查看新功能使用指南...",
      date: "2024-01-05 18:00",
      source: "系统管理员",
      category: "系统通知",
      type: "system",
      tags: ["系统更新", "功能优化"],
      aiSummary: [
        {
          title: "AI风险预警上线",
          content:
            "基于机器学习模型，对法规变更和公司业务数据进行分析，提前识别潜在合规风险点。",
        },
        {
          title: "智能合规检查工具",
          content:
            "支持上传业务合同、宣传材料等文档，系统自动比对相关法规，提示不合规条款。",
        },
        {
          title: "批量文档处理能力",
          content: "新增对法规库文档的批量导入、导出、分类和标签管理功能。",
        },
        {
          title: "检索算法升级",
          content:
            "优化语义理解能力，搜索结果更精准，并支持自然语言提问式搜索。",
        },
      ],
    },
    {
      id: "6",
      title: "风险管理制度年度修订计划",
      description:
        "根据监管最新要求和公司发展需要，制定2024年风险管理制度修订计划。计划修订内容：新兴风险识别、数字化风控工具应用、ESG风险管理等重点领域...",
      date: "2024-01-03 14:20",
      source: "风险管理部",
      category: "监管政策",
      type: "policy",
      tags: ["年度计划", "风险管理"],
      aiSummary: [
        {
          title: "新兴风险纳入",
          content:
            "重点关注数据安全、人工智能伦理、气候变化等新兴风险的识别与评估方法。",
        },
        {
          title: "数字化风控工具",
          content:
            "计划引入或升级至少两项数字化风控工具（如RPA、持续监控系统）。",
        },
        {
          title: "ESG风险管理整合",
          content:
            "将ESG（环境、社会、治理）风险全面纳入现有风险管理框架，明确管理流程与责任。",
        },
        {
          title: "三道防线协同强化",
          content:
            "优化业务部门、风险管理部门、内部审计部门在风险管理中的职责分工与协作机制。",
        },
      ],
    },
  ];

  // 获取过滤后的更新数据
  get filteredUpdates() {
    if (this.activeFilter === "all") {
      return this.updates;
    } else {
      return this.updates.filter((item) => item.type === this.activeFilter);
    }
  }

  // 设置活动筛选器
  setActiveFilter(filter: string): void {
    this.activeFilter = filter;
    this.currentPage = 1;
  }

  // 查看更新详情
  viewUpdate(id: string): void {
    const update = this.updates.find((u) => u.id === id);
    if (update) {
      this.$router.push(`/document/${update.id}`);
    }
  }

  // 下载更新文件
  downloadUpdate(id: string): void {
    const update = this.updates.find((u) => u.id === id);
    if (update) {
      this.$message.info(`正在准备下载: ${update.title}`);
    }
  }

  // 分页变化
  onPageChange(page: number): void {
    this.currentPage = page;
    // 在实际项目中，这里应该进行数据请求
  }

  // 更新操作按钮数据
  get updateActions() {
    return [
      {
        icon: "eye",
        text: "查看详情",
        handler: (id: string) => this.viewUpdate(id),
      },
      {
        icon: "download",
        text: "下载文件",
        handler: (id: string) => this.downloadUpdate(id),
      },
    ];
  }
}
</script>

<style lang="less" scoped>
// 公共卡片样式
.lawyer-card {
  background: var(--lawyer-surface);
  padding: 24px;
  border-radius: 8px;
  border: 1px solid var(--lawyer-border);
}

// 页面容器和头部
.lawyer-updates {
  &-container {
    margin-bottom: 32px;
  }

  &-header {
    &:extend(.lawyer-card);
    padding: 24px 32px;
    margin-bottom: 24px;

    h1 {
      font-size: 24px;
      font-weight: 600;
      color: var(--lawyer-text);
      margin-bottom: 8px;
    }

    p {
      color: var(--lawyer-text-light);
      margin-bottom: 1.5rem;
      font-size: 14px;
      line-height: 1.5;
    }
  }

  // 更新列表
  &-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 32px;
  }
}

// 头部操作区
.lawyer-header-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

// 筛选标签
.lawyer-filter {
  &-tabs {
    display: flex;
    gap: 8px;
    border-radius: 6px;
    overflow: hidden;
  }

  &-tab {
    padding: 8px 16px;
    background: transparent;
    border: none;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    color: var(--lawyer-text-light);
    transition: all 0.2s ease;
    border-radius: 4px;
    border: 1px solid var(--lawyer-border);
    background: var(--lawyer-surface);
    font-family: inherit;

    &:hover {
      color: var(--lawyer-primary);
      border-color: var(--lawyer-primary);
    }

    &.active {
      background: var(--lawyer-primary);
      color: white;
      border-color: var(--lawyer-primary);
      font-weight: 600;
      box-shadow: none;
    }
  }
}

// 更新项
.lawyer-update {
  &-item {
    &:extend(.lawyer-card);
    padding: 20px 24px;
    transition: all 0.2s ease-in-out;
    display: flex;
    gap: 24px;
    box-shadow: none;

    &:hover {
      border-color: var(--lawyer-primary);
      background-color: rgba(var(--lawyer-primary-rgb), 0.05);
    }
  }

  // 图标容器
  &-icon-container {
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;

    &.law {
      background-color: rgba(var(--lawyer-danger-rgb), 0.1);
      color: var(--lawyer-danger);
    }

    &.policy {
      background-color: rgba(var(--lawyer-primary-rgb), 0.1);
      color: var(--lawyer-primary);
    }

    &.internal {
      background-color: rgba(16, 185, 129, 0.1);
      color: var(--lawyer-success);
    }

    &.system {
      background-color: rgba(52, 152, 219, 0.1);
      color: var(--lawyer-primary);
    }
  }

  // 内容区域
  &-content {
    flex-grow: 1;
  }

  // 标题与时间
  &-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 8px;
  }

  &-title {
    font-size: 18px;
    font-weight: 500;
    color: var(--lawyer-text);
    line-height: 1.45;

    a {
      text-decoration: none;
      color: inherit;

      &:hover {
        color: var(--lawyer-primary);
      }
    }
  }

  &-time {
    font-size: 13px;
    color: var(--lawyer-text-light);
    white-space: nowrap;
    margin-left: 16px;
  }

  &-summary {
    font-size: 14px;
    color: var(--lawyer-text-light);
    line-height: 1.5;
    margin-bottom: 12px;
  }

  // 标签
  &-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
  }

  // 操作按钮
  &-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }
}

// AI解读部分
.lawyer-ai-summary {
  &-section {
    margin-top: 20px;
    padding: 16px 20px;
    background-color: var(--lawyer-surface);
    border-radius: 4px;
    border: 1px solid var(--lawyer-border);
    margin-bottom: 16px;
  }

  &-title {
    font-size: 16px;
    font-weight: 500;
    color: var(--lawyer-text);
    margin-bottom: 12px;
  }

  &-list {
    list-style-type: none;
    padding-left: 22px;
    margin-bottom: 10px;

    li {
      font-size: 14px;
      color: var(--lawyer-text-light);
      margin-bottom: 10px;
      line-height: 1.6;
      position: relative;
      padding-left: 22px;

      &:last-child {
        margin-bottom: 0;
      }

      &::before {
        content: "▹";
        position: absolute;
        left: 0;
        top: 2px;
        color: var(--lawyer-primary);
        font-weight: 600;
        font-size: 14px;
      }

      strong {
        font-weight: 500;
        color: var(--lawyer-text);
      }
    }
  }
}

// 标签样式
.lawyer-tag {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid transparent;

  &-law {
    background-color: rgba(var(--lawyer-danger-rgb), 0.1);
    color: var(--lawyer-danger);
    border-color: rgba(var(--lawyer-danger-rgb), 0.3);
  }

  &-policy {
    background-color: rgba(var(--lawyer-primary-rgb), 0.1);
    color: var(--lawyer-primary);
    border-color: rgba(var(--lawyer-primary-rgb), 0.3);
  }

  &-internal {
    background-color: rgba(16, 185, 129, 0.1);
    color: var(--lawyer-success);
    border-color: rgba(16, 185, 129, 0.3);
  }

  &-system {
    background-color: rgba(52, 152, 219, 0.1);
    color: var(--lawyer-primary);
    border-color: rgba(52, 152, 219, 0.3);
  }
}

// 无内容和分页
.lawyer-no-updates {
  padding: 32px;
  text-align: center;
}

.lawyer-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px 0;
}
</style>
