<template>
  <a-card
    class="lawyer-chart-card"
    :bordered="false"
    style="margin-bottom: 24px"
    title="Top 5 需要人工审核"
  >
    <template slot="extra">
      <a-button type="primary" @click="$emit('view-all')"> 查看全部 </a-button>
    </template>

    <a-spin :spinning="loading">
      <!-- 暂无数据状态 -->
      <div v-if="!loading && reviews.length === 0" class="lawyer-empty-state">
        <a-empty description="暂无待审核数据" />
      </div>

      <a-table
        v-else
        :columns="reviewColumns"
        :dataSource="reviews"
        :pagination="false"
        size="middle"
        class="lawyer-review-table"
        rowKey="id"
      >
        <template slot="titleColumn" slot-scope="text, record">
          <div class="lawyer-table-title">{{ record.ruleName }}</div>
          <div class="lawyer-table-subtitle">
            文号：{{ record.documentNo || "无" }}
          </div>
        </template>

        <template slot="category" slot-scope="text">
          {{ text }}
        </template>

        <template slot="status" slot-scope="text">
          <span :class="getToDoReviewStatusClass(text)">
            {{ getToDoReviewStatusText(text) }}
          </span>
        </template>

        <template slot="createdTime" slot-scope="text">
          {{ formatTime(text) }}
        </template>

        <!-- 操作列表头插槽 -->
        <template slot="actionTitle">
          <div class="lawyer-action-header">
            <span>操作</span>
            <a-tooltip placement="left">
              <template slot="title">
                <span
                  >版本规则：文件版本高于系统最高版本时，不允许审核操作</span
                >
              </template>
              <a-icon type="info-circle" class="ml-8" />
            </a-tooltip>
          </div>
        </template>

        <!-- 操作列插槽 -->
        <template slot="action" slot-scope="text, record">
          <div class="lawyer-action-links">
            <a @click="$emit('view-detail', record)" class="lawyer-link-view">
              查看
            </a>
            <template
              v-if="
                (record.checkStatus === '待审核' ||
                  record.checkStatus === null) &&
                canReviewItem(record)
              "
            >
              <a @click="$emit('approve', record)" class="lawyer-link-approve">
                通过
              </a>
              <a @click="$emit('reject', record)" class="lawyer-link-reject">
                驳回
              </a>
            </template>
          </div>
        </template>
      </a-table>
    </a-spin>
  </a-card>
</template>

<script lang="ts">
import { Component, Vue, Prop } from "nuxt-property-decorator";
import moment from "moment";
import { ToDoRuleItem, ReviewStatusClassMap } from "~/model/LawyerModel";
import { CustomColumn } from "~/model/CommonModel";

@Component
export default class ReviewTable extends Vue {
  @Prop({ type: Array, default: () => [] }) reviews!: ToDoRuleItem[];
  @Prop({ type: Boolean, default: false }) loading!: boolean;

  // 表格列定义（优先使用 CommonModel 的 CustomColumn 类型）
  reviewColumns: CustomColumn[] = [
    {
      title: "标题/文号",
      dataIndex: "ruleName",
      key: "ruleName",
      scopedSlots: { customRender: "titleColumn" },
      width: "30%",
    },
    {
      title: "分类",
      dataIndex: "categoryMain",
      key: "categoryMain",
      scopedSlots: { customRender: "category" },
      width: "15%",
    },
    {
      title: "来源",
      dataIndex: "legalSource",
      key: "legalSource",
      width: "15%",
    },
    {
      title: "提交时间",
      dataIndex: "createdTime",
      key: "createdTime",
      width: "15%",
      scopedSlots: { customRender: "createdTime" },
    },
    {
      title: "状态",
      dataIndex: "checkStatus",
      key: "checkStatus",
      scopedSlots: { customRender: "status" },
      width: "10%",
    },
    {
      key: "action",
      scopedSlots: {
        customRender: "action",
        title: "actionTitle",
      },
      width: "15%",
      align: "center",
    },
  ];

  // 获取待办审核状态样式类
  getToDoReviewStatusClass(status: string | null): string {
    const classMap: ReviewStatusClassMap = {
      已通过: "lawyer-status-approved",
      已驳回: "lawyer-status-rejected",
      pending: "lawyer-status-pending",
    };
    return classMap[status || ""] || "lawyer-status-pending";
  }

  // 获取待办审核状态文本
  getToDoReviewStatusText(status: string | null): string {
    return status || "待审核";
  }

  // 检查是否可以审核（版本检查）
  canReviewItem(record: ToDoRuleItem): boolean {
    if (
      record.newFileVersion === undefined ||
      record.currentMaxFileVersion === undefined
    ) {
      return true;
    }
    const newVersion: number = Number(
      record.newFileVersion || record.fileVersion || 0
    );
    const maxVersion: number = Number(record.currentMaxFileVersion || 0);
    return newVersion <= maxVersion;
  }

  // 格式化时间显示
  formatTime(timeStr: string): string {
    if (!timeStr) return "-";
    return moment(timeStr).format("YYYY-MM-DD HH:mm:ss");
  }
}
</script>

<style lang="less">
@import "~/assets/styles/lawyer.less";

.lawyer-review-table {
  .lawyer-table-title {
    font-weight: 500;
    font-size: 14px;
    margin-bottom: 4px;
  }

  .lawyer-table-subtitle {
    font-size: 12px;
    color: var(--lawyer-text-light);
  }
}

.lawyer-action-links {
  display: flex;
  gap: 8px;
  align-items: center;
  cursor: pointer;
  transition: color 0.2s ease;
  padding: 2px 6px;
  border-radius: 3px;
}

.lawyer-link-view {
  color: #666;

  &:hover {
    color: #333;
    background-color: #f5f5f5;
  }
}

.lawyer-link-approve {
  color: #52c41a;

  &:hover {
    color: #389e0d;
    background-color: #f6ffed;
  }
}

.lawyer-link-reject {
  color: #ff4d4f;

  &:hover {
    color: #cf1322;
    background-color: #fff2f0;
  }
}

// 操作列表头样式
.lawyer-action-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

/* 空状态样式 */
.lawyer-empty-state {
  padding: 40px 20px;
  text-align: center;
}
</style>
