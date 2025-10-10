<template>
  <a-card
    class="lawyer-chart-card"
    :bordered="false"
    style="margin-bottom: 24px"
    title="Top 5 需要人工审核"
  >
    <template slot="extra">
      <a-button type="primary" @click="viewAll()"> 查看全部 </a-button>
    </template>

    <a-spin :spinning="loading">
      <!-- 暂无数据状态 -->
      <div v-if="!loading && reviews.length === 0" class="lawyer-empty-state">
        <a-empty description="暂无待审核数据" />
      </div>

      <a-table
        v-else
        :columns="reviewColumns"
        :data-source="reviews"
        :pagination="false"
        size="middle"
        class="lawyer-review-table"
        row-key="id"
      >
        <template slot="titleColumn" slot-scope="text, record">
          <div class="lawyer-table-title">
            {{ record.ruleName }}
          </div>
          <div class="lawyer-table-subtitle">文号：{{ record.documentNo || '无' }}</div>
        </template>

        <template slot="status" slot-scope="text">
          <span :class="getToDoReviewStatusClass(text)">
            {{ text }}
          </span>
        </template>

        <template slot="createdTime" slot-scope="text">
          {{ formatTime(text) }}
        </template>

        <!-- 操作列表头插槽 -->
        <template slot="actionTitle">
          <div class="lawyer-action-header">
            <span>操作</span>
          </div>
        </template>

        <!-- 操作列插槽 -->
        <template slot="action" slot-scope="text, record">
          <div class="lawyer-action-links">
            <a class="lawyer-link-view" @click="viewDetail(record)"> 查看 </a>
            <template
              v-if="
                (record.checkStatus === '待审核' || record.checkStatus === null) &&
                canReviewItem(record)
              "
            >
              <a class="lawyer-link-approve" @click="approveItem(record)"> 通过 </a>
              <a class="lawyer-link-reject" @click="rejectItem(record)"> 驳回 </a>
            </template>
          </div>
        </template>
      </a-table>
    </a-spin>
  </a-card>
</template>

<script lang="ts">
  import { Component, Vue, Prop, Emit } from 'nuxt-property-decorator';
  import moment from 'moment';
  import { ToDoRuleItem, ReviewStatusClassMap } from '~/model/LawyerModel';
  import { CustomColumn } from '~/model/CommonModel';

  @Component
  export default class ReviewTable extends Vue {
    @Prop({ type: Array, default: () => [] }) reviews!: ToDoRuleItem[];
    @Prop({ type: Boolean, default: false }) loading!: boolean;

    // 表格列定义（优先使用 CommonModel 的 CustomColumn 类型）
    reviewColumns: CustomColumn[] = [
      {
        title: '标题/文号',
        dataIndex: 'ruleName',
        key: 'ruleName',
        scopedSlots: { customRender: 'titleColumn' },
        width: '30%'
      },
      {
        title: '分类',
        dataIndex: 'categoryMain',
        key: 'categoryMain',
        width: '15%'
      },
      {
        title: '来源',
        dataIndex: 'legalSource',
        key: 'legalSource',
        width: '15%'
      },
      {
        title: '提交时间',
        dataIndex: 'createdTime',
        key: 'createdTime',
        width: '15%',
        scopedSlots: { customRender: 'createdTime' }
      },
      {
        title: '状态',
        dataIndex: 'checkStatus',
        key: 'checkStatus',
        scopedSlots: { customRender: 'status' },
        width: '10%'
      },
      {
        key: 'action',
        scopedSlots: {
          customRender: 'action',
          title: 'actionTitle'
        },
        width: '15%',
        align: 'center'
      }
    ];

    // 获取待办审核状态样式类
    getToDoReviewStatusClass(status: string | null): string {
      const classMap: ReviewStatusClassMap = {
        已通过: 'lawyer-status-approved',
        已驳回: 'lawyer-status-rejected',
        待审核: 'lawyer-status-pending',
        已过期: 'lawyer-status-rejected'
      };
      return classMap[status || ''] || 'lawyer-status-pending';
    }

    // 检查是否可以审核（版本检查和分类ID检查）
    canReviewItem(record: ToDoRuleItem): boolean {
      if (record.fileVersion === undefined || record.currentMaxFileVersion === undefined) {
        return true;
      }
      const newVersion: number = Number(record.fileVersion || record.fileVersion || 0);
      const maxVersion: number = Number(record.currentMaxFileVersion || 0);
      return newVersion >= maxVersion;
    }

    // 格式化时间显示
    formatTime(timeStr: string): string {
      if (!timeStr) {
        return '-';
      }
      return moment(timeStr).format('YYYY-MM-DD HH:mm:ss');
    }

    // 组件事件定义
    @Emit('view-all')
    viewAll() {}

    @Emit('view-detail')
    viewDetail(record: ToDoRuleItem) {}

    // 审核通过操作 - 只负责emit事件
    approveItem(record: ToDoRuleItem) {
      this.$emit('approve', record);
    }

    // 审核驳回操作 - 只负责emit事件
    rejectItem(record: ToDoRuleItem) {
      this.$emit('reject', record);
    }
  }
</script>

<style lang="less">
  @import '~/assets/styles/lawyer.less';

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
