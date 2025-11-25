<template>
  <a-card class="lawyer-chart-card" :bordered="false" style="margin-top: 24px" title="最新法规更新">
    <template slot="extra">
      <a-button type="primary" @click="$emit('view-all')"> 查看全部 </a-button>
    </template>

    <a-spin :spinning="loading">
      <!-- 暂无数据状态 -->
      <div v-if="!loading && updates.length === 0" class="lawyer-empty-state">
        <a-empty description="暂无最新更新" />
      </div>

      <div v-else class="lawyer-updates-list">
        <div v-for="item in processedUpdates" :key="item.id" class="lawyer-update-item">
          <div :class="['lawyer-update-icon', getUpdateType(item)]">
            <template v-if="getUpdateType(item) === 'law'"> ⚖️ </template>
            <template v-else-if="getUpdateType(item) === 'policy'"> 📋 </template>
            <template v-else-if="getUpdateType(item) === 'internal'"> 🏢 </template>
            <template v-else> 🔧 </template>
          </div>
          <div class="lawyer-update-content">
            <div class="lawyer-flex lawyer-justify-between">
              <h3 class="lawyer-update-title">
                <a @click="$emit('view-detail', item)">{{ item.ruleName }}</a>
              </h3>
              <span class="lawyer-text-light">{{
                item.publishDateStr || item.createdTimeStr
              }}</span>
            </div>
            <p class="lawyer-update-summary">
              {{ getUpdateDescription(item) }}
            </p>

            <!-- AI智能解读 -->
            <div
              v-if="item.summary && (isQuarterlyJournal(item) || item.parsedSummary.length)"
              class="lawyer-ai-summary"
            >
              <h4>AI智能解读主要变更点：</h4>
              <!-- 季刊类：直接展示原始摘要文本（去掉首尾方括号），保留换行 -->
              <pre v-if="isQuarterlyJournal(item)" class="lawyer-ai-summary__rich"
                >{{ getQuarterlySummaryContent(item.summary) }}
              </pre>
              <!-- 其他类型：保持原有列表展示逻辑 -->
              <ul v-else>
                <li v-for="(point, index) in item.parsedSummary" :key="index">
                  <span>
                    <strong v-if="point.title">{{ point.title }}：</strong>{{ point.content }}
                  </span>
                </li>
              </ul>
            </div>

            <div class="lawyer-flex lawyer-gap-sm">
              <span
                v-for="(tag, index) in getUpdateTags(item)"
                :key="tag"
                :class="['lawyer-tag', getTagClass(index)]"
              >
                {{ tag }}
              </span>
              <span class="lawyer-tag lawyer-tag-source">
                {{ item.legalSource || '未知来源' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </a-spin>
  </a-card>
</template>

<script lang="ts">
  import { Component, Vue, Prop, Emit } from 'nuxt-property-decorator';
  import type { BaseRuleItem, SummaryPoint } from '~/model/LawyerModel';

  @Component({ name: 'latest-updates' })
  class LatestUpdates extends Vue {
    @Prop({ type: Array, default: () => [] }) updates!: BaseRuleItem[];
    @Prop({ type: Boolean, default: false }) loading!: boolean;

    // 预处理updates数据，避免在模板中重复解析
    get processedUpdates() {
      return this.updates.map(item => ({
        ...item,
        parsedSummary: this.parseSummaryArray(item.summary)
      }));
    }

    // 获取更新类型
    getUpdateType(item: BaseRuleItem): string {
      const categoryMain: string = item.categoryMain || '';
      let type: string = 'law';
      if (categoryMain.includes('政策') || categoryMain.includes('监管')) {
        type = 'policy';
      } else if (categoryMain.includes('内部') || categoryMain.includes('机构')) {
        type = 'internal';
      }
      return type;
    }

    // 获取更新描述
    getUpdateDescription(item: BaseRuleItem): string {
      if (!item.fileContent) {
        return '暂无详细描述';
      }

      // 移除Markdown格式的图片链接
      const processed = item.fileContent.replace(/!\[.*?\]\(.*?\)/g, '');

      return processed.length > 200 ? processed.substring(0, 200) + '...' : processed;
    }

    // 获取更新标签
    getUpdateTags(item: BaseRuleItem): string[] {
      const mainCategory = item.assemblyCategoryMain || item.categoryMain || '';
      const subCategory = item.categorySub || '';
      return [mainCategory, subCategory].filter(Boolean);
    }

    // 是否为法律合规季刊类数据（按组装分类主字段模糊判断，兼容后续子类，如“法律合规观察季刊/XXX”）
    isQuarterlyJournal(item: BaseRuleItem): boolean {
      const category = (item.assemblyCategoryMain || '').trim();
      if (!category) {
        return false;
      }

      const keywords = ['法律合规观察季刊', '法律合规季刊'];
      return keywords.some(keyword => category.includes(keyword));
    }

    // 季刊类摘要文本展示：仅去掉首尾方括号，保留原始换行和内容
    getQuarterlySummaryContent(summary?: string): string {
      if (!summary) {
        return '';
      }
      let content = summary.trim();
      if (content.startsWith('[')) {
        content = content.slice(1);
      }
      if (content.endsWith(']')) {
        content = content.slice(0, -1);
      }
      return content.trim();
    }

    getTagClass(index: number): string {
      // 第0个标签是主分类，使用橙色
      if (index === 0) {
        return 'lawyer-tag-main';
      }
      // 其他都是子分类，使用蓝色
      return 'lawyer-tag-sub';
    }

    // 解析summary数组字符串，一次性提取标题和内容
    parseSummaryArray(summaryStr: string): SummaryPoint[] {
      if (!summaryStr) {
        return [];
      }

      // 解析字符串数组
      let items: string[] = [];

      // 首先尝试使用 JSON.parse 安全解析数组字符串
      try {
        const parsed = JSON.parse(summaryStr);
        if (Array.isArray(parsed)) {
          items = parsed.filter(Boolean);
        } else {
          throw new Error('Parsed result is not an array');
        }
      } catch {
        // JSON.parse 失败或结果不是数组，使用手动解析逻辑作为回退方案
        try {
          // 去掉首尾的方括号
          let cleanStr = summaryStr.trim();
          if (cleanStr.startsWith('[') && cleanStr.endsWith(']')) {
            cleanStr = cleanStr.slice(1, -1);
          }

          // 按逗号分割，但要考虑引号内的逗号
          let currentItem = '';
          let inQuotes = false;

          for (let i = 0; i < cleanStr.length; i++) {
            const char = cleanStr[i];

            if (char === '"' || char === "'") {
              inQuotes = !inQuotes;
              continue;
            }

            if (char === ',' && !inQuotes) {
              if (currentItem.trim()) {
                items.push(currentItem.trim());
              }
              currentItem = '';
            } else {
              currentItem += char;
            }
          }

          // 添加最后一个项目
          if (currentItem.trim()) {
            items.push(currentItem.trim());
          }

          items = items.filter(Boolean);
        } catch (error) {
          console.warn('解析summary失败，使用最简单的分割方式:', error);
          // 最后的回退：简单按逗号分割
          items = summaryStr
            .replace(/^\[|\]$/g, '')
            .split(',')
            .map(item => item.trim())
            .filter(Boolean);
        }
      }

      // 一次性提取每个条目的标题和内容
      return items.map(point => {
        const colonIndex = point.indexOf(':');
        return {
          title: colonIndex === -1 ? '' : point.substring(0, colonIndex).trim(),
          content: colonIndex === -1 ? point : point.substring(colonIndex + 1).trim()
        };
      });
    }

    // 组件事件定义
    @Emit('view-all')
    viewAll() {}

    @Emit('view-detail')
    viewDetail(item: BaseRuleItem) {}
  }
  export default LatestUpdates;
</script>

<style lang="less">
  @import '~/assets/styles/lawyer.less';

  .lawyer-updates-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 24px;

    .lawyer-update-item {
      display: flex;
      gap: 16px;
      padding: 20px;
      background: var(--lawyer-surface);
      border: 1px solid var(--lawyer-border);
      border-radius: 8px;
      transition: all 0.2s ease;

      &:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .lawyer-update-icon {
        font-size: 24px;
        flex-shrink: 0;
      }

      .lawyer-update-content {
        flex: 1;

        .lawyer-update-title {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 8px 0;

          a {
            color: var(--lawyer-text);
            text-decoration: none;
            cursor: pointer;

            &:hover {
              color: var(--lawyer-primary);
            }
          }
        }

        .lawyer-update-summary {
          margin-bottom: 16px;
          color: var(--lawyer-text-light);
          line-height: 1.6;
        }
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
    .lawyer-ai-summary__rich {
      white-space: pre-wrap;
    }
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
  }

  .lawyer-tag-source {
    border-color: #52c41a;
    color: #52c41a;
    background-color: rgba(82, 196, 26, 0.1);
  }

  /* 空状态样式 */
  .lawyer-empty-state {
    padding: 40px 20px;
    text-align: center;
  }
</style>
