<template>
  <div class="lawyer-page-container">
    <!-- 页面头部 -->
    <section class="lawyer-updates-header">
      <h1 class="lawyer-page-title">智库更新与通知</h1>
      <div class="lawyer-filter-container">
        <div class="lawyer-filter-tabs">
          <button
            v-for="(filter, index) in filterOptions"
            :key="index"
            :class="[
              'lawyer-filter-btn',
              { 'lawyer-filter-btn-active': activeFilter === filter.value },
            ]"
            @click="() => setActiveFilter(filter.value)"
          >
            {{ filter.label }}
          </button>
        </div>
      </div>
    </section>

    <!-- 加载中状态 -->
    <div class="lawyer-loading-container" v-if="loading">
      <a-spin size="large" tip="正在加载法规更新数据..." />
    </div>

    <!-- 法规更新列表 -->
    <div class="lawyer-updates-list" v-else>
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

          <div class="lawyer-update-footer">
            <div class="lawyer-update-tags">
              <span
                :class="['lawyer-tag', getTagClass(tag)]"
                v-for="(tag, idx) in item.tags"
                :key="idx"
              >
                {{ tag }}
              </span>
            </div>
            <div class="lawyer-update-actions">
              <a
                v-for="(action, index) in updateActions"
                :key="index"
                @click="action.handler(item.id)"
                :class="['lawyer-action-btn', `lawyer-btn-${action.type}`]"
              >
                {{ action.text }}
              </a>
            </div>
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

  // 加载状态
  loading = false;

  // 筛选选项
  filterOptions = [
    { label: "全部更新", value: "all" },
    { label: "法律汇编", value: "law" },
    { label: "新规解读", value: "interpretation" },
    { label: "处罚汇编", value: "penalty" },
    { label: "研究集锦", value: "research" },
    { label: "法律合规季刊", value: "quarterly" },
  ];

  // 法规更新数据
  updates: UpdateItem[] = [];

  // 生命周期钩子
  async mounted() {
    // 加载更新数据
    await this.loadUpdates();
  }

  // 加载更新数据
  async loadUpdates() {
    this.loading = true;
    try {
      // 模拟网络请求和数据
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

  // 获取标签样式类
  getTagClass(tag: string): string {
    const tagColorMap: { [key: string]: string } = {
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
    return tagColorMap[tag] || "lawyer-tag-default";
  }

  // 更新操作按钮数据
  get updateActions() {
    return [
      {
        icon: "eye",
        text: "查看详情",
        type: "view",
        handler: (id: string) => this.viewUpdate(id),
      },
      {
        icon: "download",
        text: "下载文件",
        type: "download",
        handler: (id: string) => this.downloadUpdate(id),
      },
    ];
  }
}
</script>

<style lang="less" scoped>
// 页面特定的卡片样式覆盖
.lawyer-card {
  background: var(--lawyer-surface);
  padding: 24px;
  border-radius: 8px;
  border: 1px solid var(--lawyer-border);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

// 页面容器和头部
.lawyer-updates {
  &-header {
    background: var(--lawyer-surface);
    padding: 32px;
    margin-bottom: 24px;
    border-radius: 8px;
    border: 1px solid var(--lawyer-border);
  }

  // 更新列表
  &-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 32px;
  }
}

// 页面标题
.lawyer-page-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--lawyer-text);
  margin: 0 0 24px 0;
  line-height: 1.2;
}

// 筛选容器
.lawyer-filter-container {
  display: flex;
  justify-content: flex-start;
}

// 筛选按钮组
.lawyer-filter {
  &-tabs {
    display: flex;
    gap: 0;
    overflow: hidden;
    background: transparent;
  }

  &-btn {
    padding: 8px 20px;
    background: transparent;
    border: 1px solid #d9d9d9;
    cursor: pointer;
    transition: all 0.2s ease;
    min-width: 100px;
    text-align: center;
    &:first-child {
      margin-left: 0;
      border-top-left-radius: 3px;
      border-bottom-left-radius: 3px;
    }

    &:last-child {
      border-right: 1px solid #d9d9d9;
      border-top-right-radius: 3px;
      border-bottom-right-radius: 3px;
    }

    &:hover {
      color: #333;
    }

    &.lawyer-filter-btn-active {
      color: #cf9b39;
      font-weight: 500;
      border-color: #cf9b39;
      z-index: 2;
      margin-left: -1px;

      &:first-child {
        margin-left: 0;
      }

      &:not(:first-child) {
        border-left-color: #cf9b39;
      }
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
    color: var(--lawyer-text-light);
    line-height: 1.5;
    margin-bottom: 12px;
  }

  // 底部区域
  &-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 16px;
  }

  // 标签
  &-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  // 操作按钮
  &-actions {
    display: flex;
    gap: 12px;
  }
}

// 标签样式
.lawyer-tag {
  display: inline-block;
  padding: 4px 12px;
  border: 1px solid #ddd;
  border-radius: 3px;
  background-color: #fff;
  color: var(--lawyer-text-light);
  font-size: 12px;
  font-weight: 400;
  line-height: 1.2;
  white-space: nowrap;
  transition: all 0.2s ease;

  // 重要法规 - 红色
  &.lawyer-tag-important {
    border-color: #ff4d4f;
    color: #ff4d4f;
    background-color: rgba(255, 77, 79, 0.1);
  }

  // 资金运用 - 橙色
  &.lawyer-tag-fund {
    border-color: #fa8c16;
    color: #fa8c16;
    background-color: rgba(250, 140, 22, 0.1);
  }

  // 征求意见 - 蓝色
  &.lawyer-tag-opinion {
    border-color: #1890ff;
    color: #1890ff;
    background-color: rgba(24, 144, 255, 0.1);
  }

  // 偿付能力 - 紫色
  &.lawyer-tag-solvency {
    border-color: #722ed1;
    color: #722ed1;
    background-color: rgba(114, 46, 209, 0.1);
  }

  // 风险提示 - 红色
  &.lawyer-tag-risk {
    border-color: #ff4d4f;
    color: #ff4d4f;
    background-color: rgba(255, 77, 79, 0.1);
  }

  // 另类投资 - 青色
  &.lawyer-tag-alternative {
    border-color: #13c2c2;
    color: #13c2c2;
    background-color: rgba(19, 194, 194, 0.1);
  }

  // 机构监管 - 绿色
  &.lawyer-tag-supervision {
    border-color: #52c41a;
    color: #52c41a;
    background-color: rgba(82, 196, 26, 0.1);
  }

  // 公司治理 - 橙色
  &.lawyer-tag-governance {
    border-color: #fa8c16;
    color: #fa8c16;
    background-color: rgba(250, 140, 22, 0.1);
  }

  // 行业协会 - 蓝色
  &.lawyer-tag-association {
    border-color: #1890ff;
    color: #1890ff;
    background-color: rgba(24, 144, 255, 0.1);
  }

  // 风控合规 - 紫色
  &.lawyer-tag-compliance {
    border-color: #722ed1;
    color: #722ed1;
    background-color: rgba(114, 46, 209, 0.1);
  }

  // 关联交易 - 青色
  &.lawyer-tag-related {
    border-color: #13c2c2;
    color: #13c2c2;
    background-color: rgba(19, 194, 194, 0.1);
  }

  // 其他机构 - 灰色
  &.lawyer-tag-other {
    border-color: #8c8c8c;
    color: #8c8c8c;
    background-color: rgba(140, 140, 140, 0.1);
  }

  // 默认样式
  &.lawyer-tag-default {
    border-color: #d9d9d9;
    color: #595959;
    background-color: rgba(217, 217, 217, 0.1);
  }

  &:hover {
    opacity: 0.8;
  }
}

// 操作按钮样式
.lawyer-action-btn {
  display: inline-block;
  padding: 6px 16px;
  border: 1px solid #ddd;
  border-radius: 3px;
  background-color: #fff;
  color: var(--lawyer-text-light);
  font-size: 14px;
  font-weight: 400;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    text-decoration: none;
    border-color: var(--lawyer-primary);
    color: var(--lawyer-primary);
  }

  &.lawyer-btn-view {
    color: var(--lawyer-text-light);

    &:hover {
      color: var(--lawyer-text);
      border-color: var(--lawyer-text);
    }
  }

  &.lawyer-btn-download {
    color: var(--lawyer-primary);
    border-color: var(--lawyer-primary);

    &:hover {
      background-color: var(--lawyer-primary);
      color: white;
    }
  }
}

// AI解读部分
.lawyer-ai-summary {
  &-section {
    margin-top: 20px;
    padding: 16px 20px;
    background-color: #fffbeb;
    border-radius: 4px;
    border: 1px solid #fef3c7;
    margin-bottom: 16px;
  }

  &-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--lawyer-text);
    margin-bottom: 12px;
  }

  &-list {
    list-style-type: none;
    padding-left: 22px;
    margin-bottom: 10px;

    li {
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
      }

      strong {
        font-weight: 500;
        color: var(--lawyer-text);
      }
    }
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
