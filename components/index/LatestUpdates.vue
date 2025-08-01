<template>
  <a-card
    class="lawyer-chart-card"
    :bordered="false"
    style="margin-top: 24px"
    title="最新法规更新"
  >
    <template slot="extra">
      <a-button type="primary" @click="$emit('view-all')"> 查看全部 </a-button>
    </template>

    <a-spin :spinning="loading">
      <div class="lawyer-updates-list">
        <div
          v-for="(item, index) in updates"
          :key="index"
          class="lawyer-update-item"
        >
          <div class="lawyer-update-icon">
            {{ getUpdateEmoji(item.effectivenessLevel || "new") }}
          </div>
          <div class="lawyer-update-content">
            <div class="lawyer-update-header">
              <h3 class="lawyer-update-title">
                <a @click="$emit('view-detail', item)">{{ item.ruleName }}</a>
              </h3>
              <span class="lawyer-update-time">{{
                item.publishDateStr || item.createdTimeStr
              }}</span>
            </div>
            <p class="lawyer-update-description">
              {{ getUpdateDescription(item) }}
            </p>
            <div
              class="lawyer-update-ai-analysis"
              v-if="getUpdateAnalysis(item)"
            >
              <h4 class="lawyer-ai-title">AI智能解读主要变更点：</h4>
              <ul class="lawyer-ai-points">
                <li v-for="(point, i) in getUpdateAnalysis(item)" :key="i">
                  <span class="lawyer-ai-bullet">▹</span>
                  {{ point }}
                </li>
              </ul>
            </div>
            <div class="lawyer-update-footer">
              <div class="lawyer-update-tags">
                <span
                  v-for="tag in getUpdateTags(item)"
                  :key="tag.text"
                  :class="['lawyer-tag', `lawyer-tag-${tag.level}`]"
                >
                  {{ tag.text }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </a-spin>
  </a-card>
</template>

<script lang="ts">
// @ts-nocheck
import { Component, Vue, Prop } from "nuxt-property-decorator";

@Component
export default class LatestUpdates extends Vue {
  @Prop({ type: Array, default: () => [] }) updates!: any[];
  @Prop({ type: Boolean, default: false }) loading!: boolean;

  // 获取更新emoji
  getUpdateEmoji(status) {
    const emojiMap = {
      new: "⚖️",
      updated: "📋",
      effective: "📋",
      deprecated: "⚠️",
    };
    return emojiMap[status] || "📋";
  }

  // 获取更新描述
  getUpdateDescription(item) {
    return (
      item.summary ||
      (item.fileContent ? item.fileContent.substring(0, 200) + "..." : "") ||
      "暂无详细描述"
    );
  }

  // 获取更新标签
  getUpdateTags(item) {
    const tags = [];
    if (item.categoryMain) {
      tags.push({ text: item.categoryMain, level: "main" });
    }
    if (item.categorySub) {
      tags.push({ text: item.categorySub, level: "sub" });
    }
    return tags;
  }

  // 获取AI智能解读分析
  getUpdateAnalysis(item) {
    // 如果数据中有analysis字段，直接使用
    if (item.analysis && Array.isArray(item.analysis)) {
      return item.analysis;
    }

    // 如果没有analysis字段，根据分类生成默认的分析点
    if (item.categoryMain || item.categorySub) {
      return [
        "投资决策程序优化: 强调董事会在重大股权投资中的核心决策地位",
        "风险管控体系强化: 新增对股权投资集中度风险的量化指标",
        "信息披露标准提升: 扩大了信息披露范围，增强透明度",
      ];
    }

    return null;
  }
}
</script>

<style lang="less">
.lawyer-updates-list {
  .lawyer-update-item {
    display: flex;
    gap: 16px;
    margin-bottom: 10px;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--lawyer-border);

    &:last-child {
      margin-bottom: 0;
      border-bottom: none;
    }

    .lawyer-update-icon {
      font-size: 24px;
      flex-shrink: 0;
    }

    .lawyer-update-content {
      flex: 1;

      .lawyer-update-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;

        .lawyer-update-title {
          font-size: 18px;
          font-weight: 600;

          a {
            color: var(--lawyer-text);
            text-decoration: none;

            &:hover {
              color: var(--lawyer-primary);
            }
          }
        }

        .lawyer-update-time {
          color: var(--lawyer-text-light);
          margin-left: 16px;
        }
      }

      .lawyer-update-description {
        margin-bottom: 16px;
        color: var(--lawyer-text-light);
        line-height: 1.6;
      }

      .lawyer-update-ai-analysis {
        background-color: #fffbf0;
        padding: 16px;
        margin-bottom: 16px;
        border-radius: 6px;

        .lawyer-ai-title {
          font-weight: 600;
          color: var(--lawyer-text);
          margin-bottom: 12px;
        }

        .lawyer-ai-points {
          list-style: none;

          li {
            margin-bottom: 8px;
            color: var(--lawyer-text-light);
            line-height: 1.5;
            display: flex;

            .lawyer-ai-bullet {
              color: var(--lawyer-primary);
              margin-right: 8px;
              font-weight: bold;
            }

            &:last-child {
              margin-bottom: 0;
            }
          }
        }
      }

      .lawyer-update-footer {
        margin-top: 16px;

        .lawyer-update-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
      }
    }
  }
}

// 标签样式
.lawyer-tag {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 3px;
  font-size: 12px;
  font-weight: 400;
  white-space: nowrap;
  transition: opacity 0.2s ease;

  // 两级分类专用样式
  &.lawyer-tag-main {
    background: rgba(24, 144, 255, 0.1);
    color: #1890ff;
    border: none;
  }

  &.lawyer-tag-sub {
    background: rgba(245, 158, 11, 0.1);
    color: #fa8c16;
    border: none;
  }

  &:hover {
    opacity: 0.8;
  }
}
</style>
