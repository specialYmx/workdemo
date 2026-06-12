<template>
  <div>
    <div>
      <div class="weCom-search-form">
        <a-row :gutter="16">
          <a-col :span="6">
            <a-input
              v-model="searchParams.groupChatName"
              placeholder="群聊名称"
              allow-clear
              @keyup.enter="onSearch"
            />
          </a-col>
          <a-col :span="18" class="weCom-search-buttons">
            <div class="weCom-button-group">
              <a-button type="primary" :loading="tableLoading" @click="onSearch">查询</a-button>
              <a-button @click="onReset">重置</a-button>
              <a-button type="primary" @click="showAddModal">新增群聊</a-button>
            </div>
          </a-col>
        </a-row>
      </div>

      <a-table
        :columns="columns"
        :data-source="groupChatList"
        :pagination="pagination"
        :loading="tableLoading"
        :scroll="tableScroll"
        :body-style="tableBodyStyle"
        :row-key="record => record.id"
        @change="handleTableChange"
      >
        <template slot="createTime" slot-scope="text">
          {{ formatTime(text) }}
        </template>
        <template slot="action" slot-scope="text, record">
          <div class="weCom-action-buttons">
            <a-button type="link" @click="editGroupChat(record)">编辑</a-button>
            <a-button type="link" danger @click="deleteGroupChat(record)">删除</a-button>
          </div>
        </template>
      </a-table>
    </div>

    <a-modal
      :title="modalTitle"
      :visible="modalVisible"
      :confirm-loading="modalLoading"
      ok-text="确认"
      cancel-text="取消"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
    >
      <a-form-model
        ref="formModel"
        :model="formData"
        :rules="formRules"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 18 }"
      >
        <a-form-model-item label="群聊ID" prop="id">
          <a-input v-model="formData.id" placeholder="请输入群聊ID" />
        </a-form-model-item>
        <a-form-model-item label="群聊名称" prop="groupChatName">
          <a-input v-model="formData.groupChatName" placeholder="请输入群聊名称" />
        </a-form-model-item>
      </a-form-model>
    </a-modal>
  </div>
</template>

<script lang="ts">
  import { Component, Vue } from 'nuxt-property-decorator';
  import { FormModel } from 'ant-design-vue';
  import { formatDate } from '~/utils/date';
  import type { WeComBotGroupChat } from '~/model/RoadWeComBot';
  import type { CustomColumn, CustomPagination } from '~/model/CommonModel';

  @Component({ name: 'road-wecom-bot-group-chat-index-component' })
  class WeComBotGroupChatIndexComponent extends Vue {
    searchParams = {
      groupChatName: ''
    };

    groupChatList: WeComBotGroupChat[] = [];
    tableLoading = false;
    tableScroll = { y: 315 };
    tableBodyStyle = { overflowX: 'hidden' };
    modalVisible = false;
    modalLoading = false;
    editingRecord: WeComBotGroupChat | null = null;

    formData = {
      id: '',
      groupChatName: '',
      oldId: ''
    };

    formRules = {
      id: [{ required: true, message: '请输入群聊ID', trigger: 'blur' }],
      groupChatName: [{ required: true, message: '请输入群聊名称', trigger: 'blur' }]
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
      { title: '群聊ID', dataIndex: 'id', key: 'id', width: 240, ellipsis: true },
      {
        title: '群聊名称',
        dataIndex: 'groupChatName',
        key: 'groupChatName',
        width: 220,
        ellipsis: true
      },
      {
        title: '创建时间',
        dataIndex: 'createTime',
        key: 'createTime',
        width: 170,
        scopedSlots: { customRender: 'createTime' }
      },
      {
        title: '操作',
        key: 'action',
        width: 140,
        align: 'center',
        scopedSlots: { customRender: 'action' }
      }
    ];

    get modalTitle(): string {
      return this.editingRecord ? '编辑群聊' : '新增群聊';
    }

    async mounted(): Promise<void> {
      await this.loadGroupChatList();
    }

    async loadGroupChatList(): Promise<void> {
      this.tableLoading = true;
      try {
        const response = await this.$weComBotService.getGroupChat({
          groupChatName: this.searchParams.groupChatName || undefined,
          pageNum: this.pagination.current,
          pageSize: this.pagination.pageSize
        });
        if (!response.success) {
          this.$message.error(response.message || '加载群聊列表失败');
        }
        this.groupChatList = response.data.records;
        this.pagination.total = response.data.total;
        this.pagination.current = response.data.current;
        this.pagination.pageSize = response.data.size;
      } finally {
        this.tableLoading = false;
      }
    }

    async onSearch(): Promise<void> {
      this.pagination.current = 1;
      await this.loadGroupChatList();
    }

    async onReset(): Promise<void> {
      this.searchParams = { groupChatName: '' };
      this.pagination.current = 1;
      await this.loadGroupChatList();
    }

    async handleTableChange(pagination: CustomPagination): Promise<void> {
      this.pagination.current = pagination.current || 1;
      this.pagination.pageSize = pagination.pageSize;
      await this.loadGroupChatList();
    }

    showAddModal(): void {
      this.editingRecord = null;
      this.formData = { id: '', groupChatName: '', oldId: '' };
      this.modalVisible = true;
      this.clearFormValidate();
    }

    editGroupChat(record: WeComBotGroupChat): void {
      this.editingRecord = record;
      this.formData = {
        id: record.id,
        groupChatName: record.groupChatName,
        oldId: record.id
      };
      this.modalVisible = true;
      this.clearFormValidate();
    }

    deleteGroupChat(record: WeComBotGroupChat): void {
      this.$confirm({
        title: '确认删除',
        content: `确定删除群聊“${record.groupChatName}”吗？`,
        okText: '确认删除',
        okType: 'danger',
        cancelText: '取消',
        onOk: async () => {
          const response = await this.$weComBotService.deleteGroupChat(record.id);
          if (response.success) {
            this.$message.success('删除成功');
            await this.loadGroupChatList();
          } else {
            this.$message.error(response.message || '删除失败');
          }
        }
      });
    }

    async handleModalOk(): Promise<void> {
      const formRef = this.$refs.formModel as FormModel;
      await formRef.validate();
      this.modalLoading = true;
      try {
        const response = await this.$weComBotService.saveGroupChat({
          id: this.formData.id,
          groupChatName: this.formData.groupChatName,
          oldId: this.editingRecord ? this.formData.oldId : ''
        });
        if (response.success) {
          this.$message.success(this.editingRecord ? '编辑成功' : '新增成功');
          this.modalVisible = false;
          await this.loadGroupChatList();
        } else {
          this.$message.error(response.message || '保存失败');
        }
      } finally {
        this.modalLoading = false;
      }
    }

    handleModalCancel(): void {
      this.modalVisible = false;
      this.editingRecord = null;
    }

    clearFormValidate(): void {
      this.$nextTick(() => {
        const formRef = this.$refs.formModel as FormModel;
        if (formRef?.clearValidate) {
          formRef.clearValidate([]);
        }
      });
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

  export default WeComBotGroupChatIndexComponent;
</script>

<style lang="less" scoped>
  .weCom-search-form {
    margin-bottom: 16px;
  }

  .weCom-search-buttons {
    display: flex;
    justify-content: flex-end;
    align-items: center;
  }

  .weCom-button-group,
  .weCom-action-buttons {
    display: flex;
    gap: 8px;
    justify-content: center;
  }
</style>
