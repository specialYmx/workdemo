<template>
  <div class="updates-page-wrapper">
    <div class="lawyer-page-container">
      <!-- 主卡片容器 -->
      <div class="lawyer-card">
        <!-- 页面头部 -->
        <div class="lawyer-updates-header">
          <h2 class="lawyer-title">智库更新与通知</h2>
          <div class="lawyer-filter-tabs">
            <button
              v-for="filter in filterOptions"
              :key="filter.value"
              :class="[
                'lawyer-filter-btn',
                { 'lawyer-filter-btn-active': activeFilter === filter.value },
              ]"
              @click="setActiveFilter(filter.value)"
            >
              {{ filter.label }}
            </button>
          </div>
        </div>

        <!-- 加载中状态 -->
        <div v-if="loading" class="lawyer-loading-container">
          <a-spin size="large" tip="正在加载数据..." />
        </div>

        <!-- 法规更新列表 -->
        <div v-else class="lawyer-updates-list">
          <div
            v-for="item in paginatedUpdates"
            :key="item.id"
            class="lawyer-update-item"
          >
            <div :class="['lawyer-update-icon', item.type]">
              <template v-if="item.type === 'law'">⚖️</template>
              <template v-else-if="item.type === 'policy'">📋</template>
              <template v-else-if="item.type === 'internal'">🏢</template>
              <template v-else>🔧</template>
            </div>
            <div class="lawyer-update-content">
              <div class="lawyer-flex lawyer-justify-between">
                <h3 class="lawyer-update-title">
                  <nuxt-link :to="`/document/${item.id}`">{{
                    item.title
                  }}</nuxt-link>
                </h3>
                <span class="lawyer-text-light">{{ item.date }}</span>
              </div>
              <p class="lawyer-update-summary">{{ item.description }}</p>

              <!-- AI智能解读 -->
              <div v-if="item.aiSummary?.length" class="lawyer-ai-summary">
                <h4>AI智能解读主要变更点：</h4>
                <ul>
                  <li v-for="point in item.aiSummary" :key="point.title">
                    <strong>{{ point.title }}：</strong>{{ point.content }}
                  </li>
                </ul>
              </div>

              <div
                class="lawyer-flex lawyer-justify-between lawyer-items-center"
              >
                <div class="lawyer-flex lawyer-gap-sm">
                  <span
                    v-for="tag in item.tags"
                    :key="tag"
                    :class="['lawyer-tag', getTagClass(tag)]"
                  >
                    {{ tag }}
                  </span>
                </div>
                <div class="lawyer-flex lawyer-gap-sm">
                  <a @click="viewUpdate(item.id)" class="lawyer-action-btn"
                    >查看详情</a
                  >
                  <a
                    @click="downloadUpdate(item.id)"
                    class="lawyer-action-btn lawyer-btn-primary"
                    >下载文件</a
                  >
                </div>
              </div>
            </div>
          </div>

          <!-- 无内容展示 -->
          <div v-if="filteredUpdates.length === 0" class="lawyer-no-updates">
            <a-empty description="没有匹配的法规更新" />
          </div>
        </div>

        <!-- 分页器 -->
        <div class="lawyer-pagination">
          <a-pagination
            v-model="currentPage"
            :total="filteredUpdates.length"
            :page-size="pageSize"
            show-size-changer
            show-quick-jumper
            @change="onPageChange"
            @showSizeChange="onPageSizeChange"
          />
        </div>
      </div>
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
  head: () => ({ title: "法规更新与通知 - 法律合规智能系统" }),
})
export default class UpdatesPage extends Vue {
  activeFilter = "all";
  currentPage = 1;
  pageSize = 10;
  loading = false;
  updates: UpdateItem[] = [];

  filterOptions = [
    { label: "全部更新", value: "all" },
    { label: "法律汇编", value: "law" },
    { label: "新规解读", value: "interpretation" },
    { label: "处罚汇编", value: "penalty" },
    { label: "研究集锦", value: "research" },
    { label: "法律合规季刊", value: "quarterly" },
  ];

  async mounted() {
    await this.loadUpdates();
  }

  async loadUpdates() {
    this.loading = true;
    try {
      const mockData = [
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
              content: "对非标资产底层资产穿透计量风险加权资产。",
            },
          ],
        },
        {
          id: "3",
          title: "关于加强保险资金另类投资风险管理的通知",
          description:
            "近期发现部分保险机构在另类投资领域存在风险隐患，为规范保险资金另类投资行为，防范风险扩散，保护消费者权益...",
          date: "2024-01-08 16:45",
          source: "金融监管总局",
          category: "监管政策",
          type: "policy",
          tags: ["风险提示", "另类投资"],
          aiSummary: [
            {
              title: "投后管理机制完善",
              content: "新增季度定期检视制度，要求设立风险预警体系。",
            },
            {
              title: "专业能力建设强化",
              content: "明确投资团队资质要求，引入独立第三方评估。",
            },
          ],
        },
      ];

      await new Promise((r) => setTimeout(r, 1000));
      this.updates = mockData;
    } catch (error) {
      console.error("加载更新数据失败", error);
      this.$message.error("加载数据失败，请刷新页面重试");
    } finally {
      this.loading = false;
    }
  }

  get filteredUpdates() {
    return this.activeFilter === "all"
      ? this.updates
      : this.updates.filter((item) => item.type === this.activeFilter);
  }

  get paginatedUpdates() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredUpdates.slice(start, start + this.pageSize);
  }

  setActiveFilter(filter: string): void {
    this.activeFilter = filter;
    this.currentPage = 1;
  }

  viewUpdate(id: string): void {
    this.$router.push(`/document/${id}`);
  }

  downloadUpdate(id: string): void {
    const update = this.updates.find((u) => u.id === id);
    if (update) {
      this.$message.info(`正在准备下载: ${update.title}`);
    }
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
  }

  getTagClass(tag: string): string {
    const tagMap: Record<string, string> = {
      重要法规: "lawyer-tag-important",
      资金运用: "lawyer-tag-fund",
      征求意见: "lawyer-tag-opinion",
      偿付能力: "lawyer-tag-solvency",
      风险提示: "lawyer-tag-risk",
      另类投资: "lawyer-tag-alternative",
      机构监管: "lawyer-tag-supervision",
      公司治理: "lawyer-tag-governance",
      行业协会: "lawyer-tag-association",
      风控合规: "lawyer-tag-compliance",
      关联交易: "lawyer-tag-related",
      其他机构: "lawyer-tag-other",
    };
    return tagMap[tag] || "lawyer-tag-default";
  }
}
</script>

<style lang="less">
.updates-page-wrapper {
  .lawyer-updates-header {
    margin-bottom: 24px;
  }

  .lawyer-updates-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 24px;
  }

  .lawyer-filter-tabs {
    display: flex;
    gap: 0;
    margin-top: 16px;
  }

  .lawyer-filter-btn {
    padding: 8px 20px;
    background: transparent;
    border: 1px solid var(--lawyer-border);
    cursor: pointer;
    transition: all 0.2s ease;
    min-width: 100px;
    text-align: center;

    &:first-child {
      border-top-left-radius: 4px;
      border-bottom-left-radius: 4px;
    }

    &:last-child {
      border-top-right-radius: 4px;
      border-bottom-right-radius: 4px;
    }

    &:not(:first-child) {
      margin-left: -1px;
    }

    &:hover {
      color: var(--lawyer-primary);
      border-color: var(--lawyer-primary);
    }

    &.lawyer-filter-btn-active {
      color: var(--lawyer-primary);
      border-color: var(--lawyer-primary);
      background: rgba(var(--lawyer-primary-rgb), 0.1);
      z-index: 1;
    }
  }

  .lawyer-update-item {
    background: var(--lawyer-surface);
    border: 1px solid var(--lawyer-border);
    border-radius: 8px;
    padding: 20px;
    display: flex;
    gap: 16px;
    transition: all 0.2s ease;

    &:hover {
      border-color: var(--lawyer-primary);
      background: rgba(var(--lawyer-primary-rgb), 0.02);
    }
  }

  .lawyer-update-icon {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;

    &.law {
      background: rgba(var(--lawyer-danger-rgb), 0.1);
      color: var(--lawyer-danger);
    }

    &.policy {
      background: rgba(var(--lawyer-primary-rgb), 0.1);
      color: var(--lawyer-primary);
    }

    &.internal {
      background: rgba(16, 185, 129, 0.1);
      color: var(--lawyer-success);
    }
  }

  .lawyer-update-content {
    flex: 1;
  }

  .lawyer-update-title {
    font-size: 16px;
    font-weight: 500;
    margin-bottom: 8px;
    line-height: 1.4;

    a {
      color: var(--lawyer-text);
      text-decoration: none;

      &:hover {
        color: var(--lawyer-primary);
      }
    }
  }

  .lawyer-update-summary {
    color: var(--lawyer-text-light);
    line-height: 1.5;
    margin-bottom: 12px;
  }

  .lawyer-tag {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 3px;
    font-size: 12px;
    line-height: 1.2;

    &.lawyer-tag-important,
    &.lawyer-tag-risk {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }

    &.lawyer-tag-fund,
    &.lawyer-tag-governance {
      background: rgba(245, 158, 11, 0.1);
      color: var(--lawyer-primary);
    }

    &.lawyer-tag-opinion,
    &.lawyer-tag-association {
      background: rgba(24, 144, 255, 0.1);
      color: #1890ff;
    }

    &.lawyer-tag-solvency,
    &.lawyer-tag-compliance {
      background: rgba(114, 46, 209, 0.1);
      color: #722ed1;
    }

    &.lawyer-tag-alternative,
    &.lawyer-tag-related {
      background: rgba(19, 194, 194, 0.1);
      color: #13c2c2;
    }

    &.lawyer-tag-supervision {
      background: rgba(82, 196, 26, 0.1);
      color: #52c41a;
    }

    &.lawyer-tag-other,
    &.lawyer-tag-default {
      background: rgba(140, 140, 140, 0.1);
      color: #8c8c8c;
    }
  }

  .lawyer-action-btn {
    padding: 4px 12px;
    border: 1px solid var(--lawyer-border);
    border-radius: 3px;
    background: var(--lawyer-surface);
    color: var(--lawyer-text-light);
    font-size: 12px;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      border-color: var(--lawyer-primary);
      color: var(--lawyer-primary);
    }

    &.lawyer-btn-primary {
      background: var(--lawyer-primary);
      border-color: var(--lawyer-primary);
      color: white;

      &:hover {
        background: var(--lawyer-primary-dark);
        border-color: var(--lawyer-primary-dark);
      }
    }
  }

  .lawyer-ai-summary {
    margin: 12px 0;
    padding: 12px;
    background: #fffbeb;
    border-radius: 4px;
    border: 1px solid #fef3c7;

    h4 {
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 8px;
      color: var(--lawyer-text);
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 0;

      li {
        color: var(--lawyer-text-light);
        margin-bottom: 6px;
        line-height: 1.5;
        font-size: 13px;

        &:last-child {
          margin-bottom: 0;
        }

        strong {
          color: var(--lawyer-text);
          font-weight: 500;
        }
      }
    }
  }

  .lawyer-loading-container {
    text-align: center;
    padding: 40px;
  }

  .lawyer-no-updates {
    text-align: center;
    padding: 40px;
  }
}
</style>
