<template>
  <div>
    <div>
      <div class="weCom-search-form">
        <a-row :gutter="16">
          <a-col :span="7">
            <div class="weCom-filter-item">
              <span class="weCom-filter-label">群聊名称:</span>
              <a-select
                v-model="searchParams.groupChatId"
                show-search
                allow-clear
                option-filter-prop="children"
                placeholder="请选择群聊"
              >
                <a-select-option
                  v-for="group in groupChatOptions"
                  :key="group.id"
                  :value="group.id"
                >
                  {{ group.groupChatName }}
                </a-select-option>
              </a-select>
            </div>
          </a-col>
          <a-col :span="8">
            <div class="weCom-filter-item">
              <span class="weCom-filter-label">选择时间:</span>
              <a-range-picker
                v-model="dateRange"
                value-format="YYYY-MM-DD"
                format="YYYY-MM-DD"
                style="width: 100%"
                @change="onDateRangeChange"
              />
            </div>
          </a-col>
          <a-col :span="9" class="weCom-search-buttons">
            <div class="weCom-button-group">
              <a-button type="primary" :loading="tableLoading" @click="onSearch">查询</a-button>
              <a-button @click="onReset">重置</a-button>
            </div>
          </a-col>
        </a-row>
      </div>

      <a-table
        class="weCom-table"
        :columns="columns"
        :data-source="chatLogList"
        :pagination="pagination"
        :loading="tableLoading"
        table-layout="fixed"
        :scroll="tableScroll"
        :body-style="tableBodyStyle"
        :row-key="record => record.id"
        :expanded-row-keys="expandedRowKeys"
        :expand-icon="renderExpandIcon"
        @expand="onExpand"
        @change="handleTableChange"
      >
        <template slot="expandedRowRender" slot-scope="record">
          <a-list class="weCom-result-list" size="small" :data-source="record.wecomBotTaskResults">
            <a-list-item slot="renderItem" slot-scope="item">
              <div class="weCom-result-item">
                <div class="weCom-result-meta">
                  <a-tag color="blue">{{ item.resultType }}</a-tag>
                  <span class="weCom-result-time">{{ formatTime(item.createdAt) }}</span>
                </div>
                <div class="weCom-result-content">{{ item.resultContent }}</div>
                <div v-if="item.errorMessage" class="weCom-result-error">
                  {{ item.errorMessage }}
                </div>
              </div>
            </a-list-item>
          </a-list>
        </template>
        <template slot="content" slot-scope="text, record">
          <a-tooltip :title="getContentTitle(record)">
            <span class="weCom-content-text">
              <span>{{ record.content }}</span>
              <span v-if="record.wecomBotTaskAttachment" class="weCom-file-name">
                {{ record.wecomBotTaskAttachment.fileName }}
              </span>
            </span>
          </a-tooltip>
        </template>
        <template slot="msgType" slot-scope="text">
          {{ formatMsgType(text) }}
        </template>
        <template slot="createdAt" slot-scope="text">
          {{ formatTime(text) }}
        </template>
        <template slot="action" slot-scope="text, record">
          <a-button
            v-if="record.wecomBotTaskAttachment"
            type="link"
            @click="
              downloadAttachment(
                record.wecomBotTaskAttachment.localPath,
                record.wecomBotTaskAttachment.fileName
              )
            "
          >
            下载
          </a-button>
        </template>
      </a-table>
    </div>
  </div>
</template>

<script lang="ts">
  import { Component, Vue } from 'nuxt-property-decorator';
  import { formatDate } from '~/utils/date';
  import { downloadFileWithMessage } from '~/utils/personal';
  import type { WeComBotChatLog, WeComBotGroupChat } from '~/model/RoadWeComBot';
  import type { CustomColumn, CustomPagination } from '~/model/CommonModel';

  @Component({ name: 'road-wecom-bot-history-index-component' })
  class WeComBotHistoryIndexComponent extends Vue {
    groupChatOptions: WeComBotGroupChat[] = [];
    chatLogList: WeComBotChatLog[] = [];
    tableLoading = false;
    dateRange: string[] = [];
    expandedRowKeys: Array<string | number> = [];
    tableScroll = { y: 315 };
    tableBodyStyle = { overflowX: 'hidden' };

    searchParams = {
      groupChatId: '',
      startTime: '',
      endTime: ''
    };

    pagination: CustomPagination = {
      current: 1,
      pageSize: 10,
      total: 0,
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: (total: number) => `共 ${total} 条记录`
    };

    columns: CustomColumn[] = [
      {
        title: '群聊名称',
        dataIndex: 'groupChatName',
        key: 'groupChatName',
        width: 180
      },
      {
        title: '内容/文件名',
        dataIndex: 'content',
        key: 'content',
        width: 620,
        scopedSlots: { customRender: 'content' }
      },
      {
        title: '类型',
        dataIndex: 'msgType',
        key: 'msgType',
        width: 100,
        scopedSlots: { customRender: 'msgType' }
      },
      {
        title: '消息发送人',
        dataIndex: 'fromUserName',
        key: 'fromUserName',
        width: 160
      },
      {
        title: '消息时间',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 180,
        scopedSlots: { customRender: 'createdAt' }
      },
      {
        title: '操作',
        key: 'action',
        align: 'center',
        width: 100,
        scopedSlots: { customRender: 'action' }
      }
    ];

    async mounted(): Promise<void> {
      await this.loadGroupChatOptions();
      await this.loadChatLog();
    }

    async loadGroupChatOptions(): Promise<void> {
      const response = await this.$weComBotService.getGroupChatOptions();
      this.groupChatOptions = response.success ? response.data.records : [];
    }

    async loadChatLog(): Promise<void> {
      this.tableLoading = true;
      try {
        const response = await this.$weComBotService.getChatLog({
          pageNum: this.pagination.current || 1,
          pageSize: this.pagination.pageSize,
          groupChatId: this.searchParams.groupChatId || undefined,
          startTime: this.searchParams.startTime || undefined,
          endTime: this.searchParams.endTime || undefined
        });
        if (!response.success) {
          this.$message.error(response.message || '加载历史数据失败');
        }
        this.chatLogList = response.data.records;
        this.pagination.total = response.data.total;
        this.pagination.current = response.data.current;
        this.pagination.pageSize = response.data.size;
      } finally {
        this.tableLoading = false;
      }
    }

    async onSearch(): Promise<void> {
      this.pagination.current = 1;
      await this.loadChatLog();
    }

    async onReset(): Promise<void> {
      this.searchParams = {
        groupChatId: '',
        startTime: '',
        endTime: ''
      };
      this.dateRange = [];
      this.pagination.current = 1;
      await this.loadChatLog();
    }

    async handleTableChange(pagination: CustomPagination): Promise<void> {
      this.pagination.current = pagination.current || 1;
      this.pagination.pageSize = pagination.pageSize;
      await this.loadChatLog();
    }

    onDateRangeChange(value: string[]): void {
      this.searchParams.startTime = value?.[0] || '';
      this.searchParams.endTime = value?.[1] || '';
    }

    hasTaskResults(record: WeComBotChatLog): boolean {
      return !!record.wecomBotTaskResults?.length;
    }

    onExpand(expanded: boolean, record: WeComBotChatLog): void {
      this.expandedRowKeys = expanded
        ? [...this.expandedRowKeys, record.id]
        : this.expandedRowKeys.filter(key => key !== record.id);
    }

    renderExpandIcon(props: {
      expanded: boolean;
      record: WeComBotChatLog;
      onExpand: (record: WeComBotChatLog, event: MouseEvent) => void;
    }): any {
      if (!this.hasTaskResults(props.record)) {
        return this.$createElement('span', {
          class: 'ant-table-row-expand-icon ant-table-row-spaced'
        });
      }

      return this.$createElement('button', {
        class: [
          'ant-table-row-expand-icon',
          props.expanded ? 'ant-table-row-expanded' : 'ant-table-row-collapsed'
        ],
        attrs: {
          type: 'button'
        },
        on: {
          click: (event: MouseEvent) => props.onExpand(props.record, event)
        }
      });
    }

    formatMsgType(msgType: string): string {
      const typeMap: Record<string, string> = {
        TEXT: '文本',
        FILE: '文件',
        IMAGE: '文件'
      };
      return typeMap[msgType] || msgType;
    }

    getContentTitle(record: WeComBotChatLog): string {
      return record.wecomBotTaskAttachment
        ? `${record.content}\n${record.wecomBotTaskAttachment.fileName}`
        : record.content;
    }

    async downloadAttachment(localPath: string, fileName: string): Promise<void> {
      const result = await this.$weComBotService.downloadAttachment(localPath);
      const ok = downloadFileWithMessage(result, {
        fileName,
        showMessage: true,
        messageService: this.$message
      });
      if (!ok) {
        this.$message.error('下载失败');
      }
    }

    formatTime(timeStr: string): string {
      if (!timeStr) return '';
      try {
        return formatDate(timeStr, 'yyyy-MM-dd hh:mm:ss');
      } catch {
        return timeStr;
      }
    }
  }

  export default WeComBotHistoryIndexComponent;
</script>

<style lang="less" scoped>
  .weCom-search-form {
    margin-bottom: 16px;
  }

  .weCom-filter-item {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .weCom-filter-label {
    flex: 0 0 auto;
    color: #1f2933;
    white-space: nowrap;
  }

  .weCom-filter-item .ant-select,
  .weCom-filter-item .ant-calendar-picker {
    flex: 1;
  }

  .weCom-search-buttons {
    display: flex;
    justify-content: flex-end;
    align-items: center;
  }

  .weCom-button-group {
    display: flex;
    gap: 8px;
  }

  .weCom-table /deep/ .ant-table-body,
  .weCom-table /deep/ .ant-table-header {
    overflow-x: hidden !important;
  }

  .weCom-content-text {
    display: -webkit-box;
    max-width: 100%;
    max-height: 88px;
    line-height: 22px;
    overflow: hidden;
    overflow-wrap: anywhere;
    word-break: break-all;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 4;
  }

  .weCom-file-name {
    display: block;
    color: #d48806;
  }

  .weCom-result-list {
    margin: 0 16px;
  }

  .weCom-result-item {
    width: 100%;
  }

  .weCom-result-meta {
    display: flex;
    align-items: center;
    margin-bottom: 6px;
  }

  .weCom-result-time {
    color: #6b7280;
  }

  .weCom-result-content {
    line-height: 22px;
    white-space: pre-wrap;
    word-break: break-all;
  }

  .weCom-result-error {
    margin-top: 6px;
    color: #f5222d;
  }
</style>
