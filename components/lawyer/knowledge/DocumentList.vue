<template>
  <div>
    <!-- 加载中 -->
    <div v-if="loading" class="lawyer-loading-overlay">
      <a-spin size="large" />
      <h3>正在努力加载中...</h3>
      <p>请稍候，我们正在为您检索信息。</p>
    </div>

    <!-- 无结果提示 -->
    <div v-if="!loading && !documents.length" class="lawyer-no-results">
      <h3>未能找到相关结果</h3>
      <p>请尝试调整您的搜索关键词或筛选条件。</p>
    </div>

    <!-- 文档列表 -->
    <div v-if="!loading && documents.length" class="lawyer-document-list">
      <div
        v-for="doc in documents"
        :key="doc.id"
        :class="['lawyer-document-item', { 'lawyer-document-item-appendix': doc.appendix }]"
      >
        <div class="lawyer-document-item-content">
          <div class="lawyer-document-icon">📄</div>
          <div class="lawyer-document-main-content">
            <div class="lawyer-document-header">
              <h3
                class="lawyer-document-title"
                v-html="highlightKeyword(doc.ruleName, searchKeyword)"
              ></h3>
              <div class="lawyer-document-meta">
                <span><a-icon type="calendar" /> {{ doc.publishDateStr }}</span>
                <span><a-icon type="bank" /> {{ doc.legalSource }}</span>
                <span><a-icon type="eye" /> {{ doc.readCount }} 阅读</span>
                <span class="lawyer-timeliness-tag">
                  <a-icon type="clock-circle" /> {{ doc.timeLiness }}
                </span>
                <span> <a-icon type="schedule" /> {{ doc.effectivenessLevel }} </span>
                <span v-if="doc.documentNo">
                  <a-icon type="file-text" /> {{ doc.documentNo }}
                </span>
                <span v-if="doc.department"> <a-icon type="team" /> {{ doc.department }} </span>
              </div>
            </div>
            <p
              class="lawyer-document-summary"
              v-html="highlightKeyword(doc.fileContent, searchKeyword) || '暂无摘要'"
            ></p>
            <div class="lawyer-document-footer">
              <div class="lawyer-document-tags">
                <a-tag color="blue">
                  {{ doc.assemblyCategoryMain }}
                </a-tag>
                <a-tag v-if="doc.categorySub" color="geekblue">
                  {{ doc.categorySub }}
                </a-tag>
                <a-tag v-if="doc.effectivenessLevel" color="purple">
                  {{ doc.effectivenessLevel }}
                </a-tag>
                <a-tag v-if="doc.appendix" color="cyan"> 附录 </a-tag>
              </div>
              <div class="lawyer-document-actions">
                <a-button
                  v-for="(action, index) in docActions[doc.id] || []"
                  :key="index"
                  :type="action.type || 'default'"
                  :class="action.class"
                  @click="action.handler"
                >
                  {{ action.text }}
                </a-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="documents.length" class="lawyer-pagination">
        <a-pagination
          v-bind="paginationConfig"
          @change="onPageChange"
          @showSizeChange="onShowSizeChange"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  import { Component, Vue, Prop, Emit } from 'nuxt-property-decorator';
  import type { KnowledgeDataItem, DocumentAction } from '~/model/LawyerModel';

  @Component({ name: 'lawyer-knowledge-document-list' })
  class LawyerKnowledgeDocumentList extends Vue {
    @Prop({ required: true }) loading!: boolean;
    @Prop({ required: true }) documents!: KnowledgeDataItem[];
    @Prop({ required: true }) currentPage!: number;
    @Prop({ required: true }) totalDocuments!: number;
    @Prop({ required: true }) pageSize!: number;
    @Prop({ required: true }) docActions!: Record<string, DocumentAction[]>;
    @Prop({ default: '' }) searchKeyword!: string;
    highlightKeyword(text: string, keyword: string): string {
      if (!text) return text;

      // 移除Markdown格式的图片链接
      let processedText = text.replace(/!\[.*?\]\(.*?\)/g, '');

      if (!keyword) return processedText;

      // 转义特殊字符
      const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escapedKeyword})`, 'gi');
      return processedText.replace(regex, '<span class="lawyer-keyword-highlight">$1</span>');
    }
    get paginationConfig() {
      return {
        current: this.currentPage,
        total: this.totalDocuments,
        pageSize: this.pageSize,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total: number, range: number[]) =>
          `共 ${total} 条记录，显示第 ${range[0]}-${range[1]} 条`
      };
    }

    @Emit('page-change')
    onPageChange(page: number): number {
      return page;
    }

    @Emit('show-size-change')
    onShowSizeChange(current: number, size: number): { current: number; size: number } {
      return { current, size };
    }

    @Emit('document-action')
    onDocumentAction(
      action: string,
      doc: KnowledgeDataItem
    ): { action: string; doc: KnowledgeDataItem } {
      return { action, doc };
    }
  }
  export default LawyerKnowledgeDocumentList;
</script>

<style lang="less">
  @import '~/assets/styles/lawyer.less';

  .lawyer-keyword-highlight {
    background-color: #ffefb8;
    color: #d26b00;
    font-weight: bold;
    padding: 0 2px;
    border-radius: 2px;
  }

  .lawyer-loading-overlay {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 20px;
    text-align: center;
    color: var(--lawyer-text-secondary);

    h3 {
      margin: 16px 0 8px;
      color: var(--lawyer-text);
    }

    p {
      margin: 0;
      font-size: 14px;
    }
  }

  .lawyer-no-results {
    text-align: center;
    padding: 80px 20px;
    color: var(--lawyer-text-secondary);

    h3 {
      margin: 0 0 8px;
      color: var(--lawyer-text);
    }

    p {
      margin: 0;
      font-size: 14px;
    }
  }

  .lawyer-document-list {
    .lawyer-document-item {
      background: var(--lawyer-card-bg);
      border: 1px solid var(--lawyer-border);
      border-radius: 8px;
      margin-bottom: 16px;
      transition: all 0.3s ease;

      &:hover {
        border-color: var(--lawyer-primary);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      &.lawyer-document-item-appendix {
        border-left: 4px solid #ff7a00;
      }
    }

    .lawyer-document-item-content {
      display: flex;
      padding: 20px;
      gap: 16px;
    }

    .lawyer-document-icon {
      width: 40px;
      height: 40px;
      background: rgba(var(--lawyer-primary-rgb), 0.1);
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      color: var(--lawyer-primary);
      flex-shrink: 0;
    }

    .lawyer-document-main-content {
      flex: 1;
      min-width: 0;
    }

    .lawyer-document-header {
      margin-bottom: 12px;
    }

    .lawyer-document-title {
      margin: 0 0 8px;
      font-size: 16px;
      font-weight: 600;
      color: var(--lawyer-text);
      line-height: 1.4;
    }

    .lawyer-document-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 16px;
      margin-bottom: 12px;

      span {
        font-size: 13px;
        color: var(--lawyer-text-secondary);
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .lawyer-timeliness-tag {
        color: var(--lawyer-primary);
        font-weight: 500;
      }

      .anticon {
        margin-right: 6px;
      }
    }

    .lawyer-document-summary {
      margin: 0 0 16px;
      font-size: 14px;
      color: var(--lawyer-text-secondary);
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .lawyer-document-footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 16px;
    }

    .lawyer-document-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      flex: 1;
    }

    .lawyer-document-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;

      .ant-btn .anticon {
        font-size: 12px;
      }
    }
  }

  .lawyer-pagination {
    margin-top: 32px;
    text-align: center;
  }
</style>
