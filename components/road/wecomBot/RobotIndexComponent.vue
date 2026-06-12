<template>
  <div>
    <div>
      <div class="weCom-search-form">
        <a-row :gutter="16">
          <a-col :span="6">
            <a-input
              v-model="searchParams.robotName"
              placeholder="机器人名称"
              allow-clear
              @keyup.enter="onSearch"
            />
          </a-col>
          <a-col :span="6">
            <a-select
              v-model="searchParams.robotType"
              placeholder="机器人类型"
              allow-clear
              @change="onSearch"
            >
              <a-select-option v-for="type in robotTypeOptions" :key="type" :value="type">
                {{ type }}
              </a-select-option>
            </a-select>
          </a-col>
          <a-col :span="12" class="weCom-search-buttons">
            <div class="weCom-button-group">
              <a-button type="primary" :loading="tableLoading" @click="onSearch">查询</a-button>
              <a-button @click="onReset">重置</a-button>
              <a-button type="primary" @click="showAddModal">新增机器人</a-button>
            </div>
          </a-col>
        </a-row>
      </div>

      <a-table
        :columns="columns"
        :data-source="robotList"
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
            <a-button type="link" @click="editRobot(record)">编辑</a-button>
            <a-button type="link" danger @click="deleteRobot(record)">删除</a-button>
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
        <a-form-model-item label="机器人ID" prop="id">
          <a-input v-model="formData.id" placeholder="请输入机器人ID" />
        </a-form-model-item>
        <a-form-model-item label="机器人名称" prop="robotName">
          <a-input v-model="formData.robotName" placeholder="请输入机器人名称" />
        </a-form-model-item>
        <a-form-model-item label="机器人类型" prop="robotType">
          <a-select v-model="formData.robotType" placeholder="请选择机器人类型" allow-clear>
            <a-select-option v-for="type in robotTypeOptions" :key="type" :value="type">
              {{ type }}
            </a-select-option>
          </a-select>
        </a-form-model-item>
      </a-form-model>
    </a-modal>
  </div>
</template>

<script lang="ts">
  import { Component, Vue } from 'nuxt-property-decorator';
  import { FormModel } from 'ant-design-vue';
  import { formatDate } from '~/utils/date';
  import type { WeComBotRobot } from '~/model/RoadWeComBot';
  import type { CustomColumn, CustomPagination } from '~/model/CommonModel';

  @Component({ name: 'road-wecom-bot-robot-index-component' })
  class WeComBotRobotIndexComponent extends Vue {
    searchParams = {
      robotName: '',
      robotType: ''
    };

    robotList: WeComBotRobot[] = [];
    robotTypeOptions = ['应用机器人', '长连接机器人'];
    tableLoading = false;
    tableScroll = { x: 'max-content', y: 315 };
    // tableBodyStyle = { overflowX: 'hidden' };
    modalVisible = false;
    modalLoading = false;
    editingRecord: WeComBotRobot | null = null;

    formData = {
      id: '',
      robotName: '',
      robotType: '',
      oldId: ''
    };

    formRules = {
      id: [{ required: true, message: '请输入机器人ID', trigger: 'blur' }],
      robotName: [{ required: true, message: '请输入机器人名称', trigger: 'blur' }],
      robotType: [{ required: true, message: '请选择机器人类型', trigger: 'change' }]
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
      { title: '机器人ID', dataIndex: 'id', key: 'id', width: 220, ellipsis: true },
      { title: '机器人名称', dataIndex: 'robotName', key: 'robotName', width: 180, ellipsis: true },
      { title: '机器人类型', dataIndex: 'robotType', key: 'robotType', width: 160, ellipsis: true },
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
      return this.editingRecord ? '编辑机器人' : '新增机器人';
    }

    async mounted(): Promise<void> {
      await this.loadRobotList();
    }

    async loadRobotList(): Promise<void> {
      this.tableLoading = true;
      try {
        const response = await this.$weComBotService.getRobot({
          robotName: this.searchParams.robotName || undefined,
          robotType: this.searchParams.robotType || '',
          pageNum: this.pagination.current,
          pageSize: this.pagination.pageSize
        });
        if (!response.success) {
          this.$message.error(response.message || '加载机器人列表失败');
        }
        this.robotList = response.data.records;
        this.pagination.total = response.data.total;
        this.pagination.current = response.data.current;
        this.pagination.pageSize = response.data.size;
      } finally {
        this.tableLoading = false;
      }
    }

    async onSearch(): Promise<void> {
      this.pagination.current = 1;
      await this.loadRobotList();
    }

    async onReset(): Promise<void> {
      this.searchParams = { robotName: '', robotType: '' };
      this.pagination.current = 1;
      await this.loadRobotList();
    }

    async handleTableChange(pagination: CustomPagination): Promise<void> {
      this.pagination.current = pagination.current || 1;
      this.pagination.pageSize = pagination.pageSize;
      await this.loadRobotList();
    }

    showAddModal(): void {
      this.editingRecord = null;
      this.formData = { id: '', robotName: '', robotType: '', oldId: '' };
      this.modalVisible = true;
      this.clearFormValidate();
    }

    editRobot(record: WeComBotRobot): void {
      this.editingRecord = record;
      this.formData = {
        id: record.id,
        robotName: record.robotName,
        robotType: record.robotType,
        oldId: record.id
      };
      this.modalVisible = true;
      this.clearFormValidate();
    }

    deleteRobot(record: WeComBotRobot): void {
      this.$confirm({
        title: '确认删除',
        content: `确定删除机器人“${record.robotName}”吗？`,
        okText: '确认删除',
        okType: 'danger',
        cancelText: '取消',
        onOk: async () => {
          const response = await this.$weComBotService.deleteRobot(record.id);
          if (response.success) {
            this.$message.success('删除成功');
            await this.loadRobotList();
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
        const response = await this.$weComBotService.saveRobot({
          id: this.formData.id,
          robotName: this.formData.robotName,
          robotType: this.formData.robotType,
          oldId: this.editingRecord ? this.formData.oldId : ''
        });
        if (response.success) {
          this.$message.success(this.editingRecord ? '编辑成功' : '新增成功');
          this.modalVisible = false;
          await this.loadRobotList();
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

  export default WeComBotRobotIndexComponent;
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
