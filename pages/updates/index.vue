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
              @click="() => setActiveFilter(filter.value)"
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
                  {{ item.title }}
                </h3>
                <span class="lawyer-text-light">{{ item.date }}</span>
              </div>
              <p class="lawyer-update-summary">{{ item.description }}</p>

              <!-- AI智能解读 -->
              <div
                v-if="item.summary && parseSummaryArray(item.summary).length"
                class="lawyer-ai-summary"
              >
                <h4>AI智能解读主要变更点：</h4>
                <ul>
                  <li
                    v-for="(point, index) in parseSummaryArray(item.summary)"
                    :key="index"
                  >
                    <span v-html="formatSummaryPoint(point)"></span>
                  </li>
                </ul>
              </div>

              <div
                class="lawyer-flex lawyer-justify-between lawyer-items-center"
              >
                <div class="lawyer-flex lawyer-gap-sm">
                  <span
                    v-for="(tag, index) in item.tags"
                    :key="tag"
                    :class="['lawyer-tag', getTagClass(index)]"
                  >
                    {{ tag }}
                  </span>
                </div>
                <div class="lawyer-flex lawyer-gap-sm">
                  <a
                    @click="viewUpdate(item.id)"
                    class="lawyer-action-btn lawyer-btn-primary"
                    >查看详情</a
                  >
                  <a
                    @click="downloadUpdate(item.id, item.title)"
                    class="lawyer-action-btn"
                    >下载文件</a
                  >
                </div>
              </div>
            </div>
          </div>

          <!-- 无内容展示 -->
          <div v-if="!filteredUpdates.length" class="lawyer-no-updates">
            <a-empty description="没有匹配的数据" />
          </div>
        </div>

        <!-- 分页器 -->
        <div class="lawyer-pagination" v-if="filteredUpdates.length">
          <a-pagination
            v-model="currentPage"
            :total="totalCount"
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
import { Component, Vue } from "nuxt-property-decorator";
import {
  RuleUpdateItem,
  UpdateItem,
  FilterOption,
  RuleUpdateQueryParams,
  RouteQuery,
} from "~/model/LawyerModel";
import { downloadFileWithMessage } from "~/utils/personal";

@Component({
  head(): { title: string } {
    return { title: "法规更新与通知 - 法律合规智能系统" };
  },
})
export default class UpdatesPage extends Vue {
  activeFilter: string = ""; // 默认为空，表示全部更新
  currentPage: number = 1;
  pageSize: number = 10;
  loading: boolean = false;
  updates: UpdateItem[] = [];
  rawUpdates: RuleUpdateItem[] = [];
  allUpdates: UpdateItem[] = []; // 存储所有数据用于前端分页

  filterOptions: FilterOption[] = [
    { label: "法规更新", value: "" }, // 只保留一个tab，改名为"法规更新"
  ];

  async mounted(): Promise<void> {
    await this.loadUpdates();
  }

  async loadUpdates(): Promise<void> {
    this.loading = true;
    try {
      // 构建查询参数，使用filed参数进行筛选
      const params: RuleUpdateQueryParams = {};

      // 如果有选择筛选条件，添加filed参数
      if (this.activeFilter) {
        params.filed = this.activeFilter;
      }

      console.log("查询参数:", params);

      // 调用真实API获取数据
      const result = await this.$roadLawyerService.getRuleUpdateList(params);
      console.log("获取到的数据:", result);

      if (result && Array.isArray(result)) {
        this.rawUpdates = result;

        // 将真实数据转换为页面显示格式
        this.allUpdates = this.transformRawDataToDisplayFormat(result);

        // 重置到第一页
        this.currentPage = 1;
      } else {
        this.rawUpdates = [];
        this.allUpdates = [];
      }
    } catch (error) {
      console.error("加载更新数据失败", error);
      this.$message.error("加载数据失败，请刷新页面重试");
      this.rawUpdates = [];
      this.allUpdates = [];
    } finally {
      this.loading = false;
    }
  }

  // 将真实API数据转换为页面显示格式
  transformRawDataToDisplayFormat(rawData: RuleUpdateItem[]): UpdateItem[] {
    return rawData.map((item: RuleUpdateItem): UpdateItem => {
      // 根据分类确定类型
      const categoryMain: string = item.categoryMain || "";
      let type: string = "law";
      if (categoryMain.includes("政策") || categoryMain.includes("监管")) {
        type = "policy";
      } else if (
        categoryMain.includes("内部") ||
        categoryMain.includes("机构")
      ) {
        type = "internal";
      }

      // 生成标签 - 只使用分类标签，过滤空值
      const tags: string[] = [item.categoryMain, item.categorySub].filter(
        Boolean
      );

      // 生成描述 - 优先使用fileContent并进行字数省略
      const description: string =
        (item.fileContent ? item.fileContent.substring(0, 200) + "..." : "") ||
        "暂无详细描述";

      return {
        id: item.id,
        title: item.ruleName || "未知标题",
        description,
        fileContent: item.fileContent || "",
        summary: item.summary || "",
        date: item.createdTimeStr || item.publishDateStr || "未知时间",
        source: item.legalSource || "未知来源",
        category: item.categoryMain || "其他",
        type,
        tags,
      };
    });
  }

  get filteredUpdates(): UpdateItem[] {
    // API已经根据filed参数进行了筛选，直接返回所有数据
    return this.allUpdates;
  }

  get paginatedUpdates(): UpdateItem[] {
    // 前端分页：计算当前页应该显示的数据
    const start: number = (this.currentPage - 1) * this.pageSize;
    const end: number = start + this.pageSize;
    return this.filteredUpdates.slice(start, end);
  }

  get totalCount(): number {
    // 返回筛选后的总数
    return this.filteredUpdates.length;
  }

  async setActiveFilter(filter: string): Promise<void> {
    this.activeFilter = filter;
    // 重新加载数据（API会根据filed参数筛选）
    await this.loadUpdates();
  }

  viewUpdate(id: string): void {
    // 查找对应的更新项以获取废止状态
    const updateItem: RuleUpdateItem | undefined = this.rawUpdates.find(
      (item: RuleUpdateItem) => item.id === id
    );
    const isRevoke: boolean = !!(
      updateItem?.revokeDateTimestamp || updateItem?.revokeDateStr
    );
    const query: RouteQuery = {
      id: id,
      ...(isRevoke ? { isRevoke: "true" } : {}),
    };

    this.$router.push({
      path: "/document",
      query,
    });
  }

  async downloadUpdate(id: string, title: string): Promise<void> {
    try {
      this.$message.loading(`正在准备下载: ${title}`, 0);

      const result = await this.$roadLawyerService.downloadRuleFile({
        id: id,
      });

      this.$message.destroy();

      downloadFileWithMessage(result, {
        fileName: `${title}.pdf`,
        showMessage: true,
        messageService: this.$message,
      });
    } catch (error) {
      this.$message.destroy();
      console.error("下载失败:", error);
      this.$message.error("下载失败，请检查网络连接后重试");
    }
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    // 前端分页，不需要重新请求API
  }

  onPageSizeChange(_current: number, size: number): void {
    this.currentPage = 1;
    this.pageSize = size;
    // 前端分页，不需要重新请求API
  }

  getTagClass(index: number = 0): string {
    // 第0个标签是主分类，使用橙色
    if (index === 0) {
      return "lawyer-tag-main";
    }

    // 其他都是子分类，使用蓝色
    return "lawyer-tag-sub";
  }

  // 解析summary数组字符串
  parseSummaryArray(summaryStr: string): string[] {
    if (!summaryStr) return [];

    try {
      // 去掉首尾的方括号
      let cleanStr = summaryStr.trim();
      if (cleanStr.startsWith("[") && cleanStr.endsWith("]")) {
        cleanStr = cleanStr.slice(1, -1);
      }

      // 按逗号分割，但要考虑冒号后可能有逗号的情况
      const items: string[] = [];
      let currentItem = "";
      let inQuotes = false;

      for (let i = 0; i < cleanStr.length; i++) {
        const char = cleanStr[i];

        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
          continue;
        }

        if (char === "," && !inQuotes) {
          if (currentItem.trim()) {
            items.push(currentItem.trim());
          }
          currentItem = "";
        } else {
          currentItem += char;
        }
      }

      // 添加最后一个项目
      if (currentItem.trim()) {
        items.push(currentItem.trim());
      }

      return items.filter(Boolean);
    } catch (error) {
      console.warn("解析summary失败:", error);
      // 如果解析失败，尝试简单按逗号分割
      return summaryStr
        .replace(/^\[|\]$/g, "") // 去掉首尾方括号
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  // 格式化summary条目，将冒号前的内容加粗
  formatSummaryPoint(point: string): string {
    if (!point) return "";

    // 查找第一个冒号的位置
    const colonIndex = point.indexOf(":");
    if (colonIndex === -1) {
      return point;
    }

    const title = point.substring(0, colonIndex).trim();
    const content = point.substring(colonIndex + 1).trim();

    return `<strong>${title}：</strong>${content}`;
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
    padding: 4px 20px;
    background: transparent;
    border: 1px solid var(--lawyer-border);
    cursor: pointer;
    transition: all 0.2s ease;
    min-width: 13%;

    &:first-child {
      border-radius: 4px 0 0 4px;
    }

    &:last-child {
      border-radius: 0 4px 4px 0;
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
    font-size: 18px;
    font-weight: 500;
    margin-bottom: 8px;
    line-height: 1.4;
    color: var(--lawyer-text);
  }

  .lawyer-update-summary {
    color: var(--lawyer-text-light);
    line-height: 1.5;
    margin-bottom: 12px;
  }

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

    // 主要分类 - 橙色
    &.lawyer-tag-main {
      border-color: #fa8c16;
      color: #fa8c16;
      background-color: rgba(250, 140, 22, 0.1);
    }

    // 子分类 - 蓝色
    &.lawyer-tag-sub {
      border-color: #1890ff;
      color: #1890ff;
      background-color: rgba(24, 144, 255, 0.1);
    }

    // 默认样式
    &.lawyer-tag-default {
      border-color: #d9d9d9;
      color: #595959;
      background-color: rgba(217, 217, 217, 0.1);
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
    margin: 16px 0;
    padding: 16px;
    background: #fdf6e9;
    border-radius: 6px;
    h4 {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 12px;
      color: var(--lawyer-primary);
      display: flex;
      align-items: center;
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 0;

      li {
        color: var(--lawyer-text-light);
        margin-bottom: 8px;
        line-height: 1.6;
        font-size: 13px;
        padding-left: 0;
        position: relative;

        &:last-child {
          margin-bottom: 0;
        }

        strong {
          color: var(--lawyer-text);
          font-weight: 600;
        }

        span {
          display: block;
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
