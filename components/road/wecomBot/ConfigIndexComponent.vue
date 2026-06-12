<template>
  <div>
    <div>
      <div class="weCom-search-form">
        <a-row :gutter="16">
          <a-col :span="5">
            <a-input
              v-model="searchParams.robotName"
              placeholder="机器人名称"
              allow-clear
              @keyup.enter="onSearch"
            />
          </a-col>
          <a-col :span="5">
            <a-input
              v-model="searchParams.groupChatName"
              placeholder="群聊名称"
              allow-clear
              @keyup.enter="onSearch"
            />
          </a-col>
          <a-col :span="4">
            <a-select v-model="searchParams.enable" placeholder="配置状态" allow-clear>
              <a-select-option :value="true">启用</a-select-option>
              <a-select-option :value="false">关闭</a-select-option>
            </a-select>
          </a-col>
          <a-col :span="10" class="weCom-search-buttons">
            <div class="weCom-button-group">
              <a-button type="primary" :loading="tableLoading" @click="onSearch">查询</a-button>
              <a-button @click="onReset">重置</a-button>
              <a-button type="primary" @click="showAddModal">新增配置</a-button>
              <a-button @click="goRobot">机器人管理</a-button>
              <a-button @click="goGroupChat">群聊管理</a-button>
            </div>
          </a-col>
        </a-row>
      </div>

      <a-table
        :columns="columns"
        :data-source="configList"
        :pagination="pagination"
        :loading="tableLoading"
        :scroll="tableScroll"
        :body-style="tableBodyStyle"
        :row-key="record => record.id || `${record.robotId}-${record.groupChatId}`"
        @change="handleTableChange"
      >
        <template slot="enable" slot-scope="text, record">
          <a-switch
            :checked="record.enable === true"
            :loading="record.switchLoading"
            checked-children="启用"
            un-checked-children="关闭"
            @change="checked => toggleEnable(record, checked)"
          />
        </template>
        <template slot="createTime" slot-scope="text">
          {{ formatTime(text) }}
        </template>
        <template slot="action" slot-scope="text, record">
          <div class="weCom-action-buttons">
            <a-button type="link" @click="editConfig(record)">修改</a-button>
            <a-button type="link" danger @click="deleteConfig(record)">删除</a-button>
          </div>
        </template>
      </a-table>
    </div>

    <a-modal
      :title="modalTitle"
      :visible="modalVisible"
      width="760px"
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
        <a-form-model-item label="机器人名称" prop="robotId">
          <a-select
            v-model="formData.robotId"
            show-search
            allow-clear
            option-filter-prop="children"
            placeholder="请选择或搜索机器人名称（单选）"
            @change="onRobotChange"
          >
            <a-select-option v-for="robot in robotOptions" :key="robot.id" :value="robot.id">
              {{ formatRobotNameOption(robot) }}
            </a-select-option>
          </a-select>
        </a-form-model-item>
        <a-form-model-item label="机器人ID">
          <a-input v-model="formData.robotId" disabled placeholder="选择机器人后自动显示" />
        </a-form-model-item>
        <a-form-model-item label="接收消息的群聊" prop="groupChatId">
          <a-select
            v-model="formData.groupChatId"
            show-search
            allow-clear
            option-filter-prop="children"
            placeholder="请选择或搜索群聊（单选）"
            @change="onGroupChatChange"
          >
            <a-select-option v-for="group in groupChatOptions" :key="group.id" :value="group.id">
              {{ group.groupChatName }}
            </a-select-option>
          </a-select>
        </a-form-model-item>
        <a-form-model-item label="群聊ID">
          <a-input v-model="formData.groupChatId" disabled placeholder="选择群聊后自动显示" />
        </a-form-model-item>
        <a-form-model-item label="配置状态" prop="enable">
          <a-switch v-model="formData.enable" checked-children="启用" un-checked-children="关闭" />
        </a-form-model-item>
      </a-form-model>
    </a-modal>
  </div>
</template>

<script lang="ts">
  import { Component, Vue } from 'nuxt-property-decorator';
  import { FormModel } from 'ant-design-vue';
  import { formatDate } from '~/utils/date';
  import type {
    WeComBotGroupChat,
    WeComBotGroupChatRobot,
    WeComBotRobot,
    SaveWeComBotGroupChatRobotParams
  } from '~/model/RoadWeComBot';
  import type { CustomColumn, CustomPagination } from '~/model/CommonModel';

  interface ConfigFormData {
    id?: string;
    robotId: string;
    robotName: string;
    groupChatId: string;
    groupChatName: string;
    enable: boolean;
  }

  @Component({ name: 'road-wecom-bot-config-index-component' })
  class WeComBotConfigIndexComponent extends Vue {
    searchParams = {
      robotName: '',
      groupChatName: '',
      enable: undefined as boolean | undefined
    };

    configList: WeComBotGroupChatRobot[] = [];
    robotOptions: WeComBotRobot[] = [];
    groupChatOptions: WeComBotGroupChat[] = [];
    tableLoading = false;
    tableScroll = { y: 315 };
    tableBodyStyle = { overflowX: 'hidden' };
    modalVisible = false;
    modalLoading = false;
    editingRecord: WeComBotGroupChatRobot | null = null;

    pagination: CustomPagination = {
      current: 1,
      pageSize: 10,
      total: 0,
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: (total: number) => `共 ${total} 条记录`
    };

    formData: ConfigFormData = {
      robotId: '',
      robotName: '',
      groupChatId: '',
      groupChatName: '',
      enable: true
    };

    formRules = {
      robotId: [{ required: true, message: '请选择机器人名称', trigger: 'change' }],
      groupChatId: [{ required: true, message: '请选择群聊', trigger: 'change' }]
    };

    columns: CustomColumn[] = [
      { title: '机器人名称', dataIndex: 'robotName', key: 'robotName', width: 160, ellipsis: true },
      { title: '机器人ID', dataIndex: 'robotId', key: 'robotId', width: 180, ellipsis: true },
      {
        title: '群聊名称',
        dataIndex: 'groupChatName',
        key: 'groupChatName',
        width: 180,
        ellipsis: true
      },
      { title: '群聊ID', dataIndex: 'groupChatId', key: 'groupChatId', width: 180, ellipsis: true },
      {
        title: '配置状态',
        dataIndex: 'enable',
        key: 'enable',
        width: 120,
        align: 'center',
        scopedSlots: { customRender: 'enable' }
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
      return this.editingRecord ? '修改配置' : '新增配置';
    }

    async mounted(): Promise<void> {
      await Promise.all([this.loadRobotOptions(), this.loadGroupChatOptions()]);
      await this.loadConfigList();
    }

    async loadRobotOptions(): Promise<void> {
      const response = await this.$weComBotService.getRobotOptions();
      this.robotOptions = response.success ? response.data.records : [];
    }

    async loadGroupChatOptions(): Promise<void> {
      const response = await this.$weComBotService.getGroupChatOptions();
      this.groupChatOptions = response.success ? response.data.records : [];
    }

    async loadConfigList(): Promise<void> {
      this.tableLoading = true;
      try {
        const response = await this.$weComBotService.getGroupChatRobot({
          robotName: this.searchParams.robotName || undefined,
          groupChatName: this.searchParams.groupChatName || undefined,
          enable: this.searchParams.enable,
          pageNum: this.pagination.current,
          pageSize: this.pagination.pageSize
        });
        if (!response.success) {
          this.$message.error(response.message || '加载配置列表失败');
        }
        this.configList = response.data.records.map(item => ({ ...item, switchLoading: false }));
        this.pagination.total = response.data.total;
        this.pagination.current = response.data.current;
        this.pagination.pageSize = response.data.size;
      } finally {
        this.tableLoading = false;
      }
    }

    async onSearch(): Promise<void> {
      this.pagination.current = 1;
      await this.loadConfigList();
    }

    async onReset(): Promise<void> {
      this.searchParams = {
        robotName: '',
        groupChatName: '',
        enable: undefined
      };
      this.pagination.current = 1;
      await this.loadConfigList();
    }

    async handleTableChange(pagination: CustomPagination): Promise<void> {
      this.pagination.current = pagination.current || 1;
      this.pagination.pageSize = pagination.pageSize;
      await this.loadConfigList();
    }

    showAddModal(): void {
      this.editingRecord = null;
      this.formData = {
        robotId: '',
        robotName: '',
        groupChatId: '',
        groupChatName: '',
        enable: true
      };
      this.modalVisible = true;
      this.clearFormValidate();
    }

    editConfig(record: WeComBotGroupChatRobot): void {
      this.editingRecord = record;
      this.formData = {
        id: record.id,
        robotId: record.robotId,
        robotName: record.robotName,
        groupChatId: record.groupChatId,
        groupChatName: record.groupChatName,
        enable: record.enable === true
      };
      this.modalVisible = true;
      this.clearFormValidate();
    }

    onRobotChange(robotId?: string): void {
      const robot = this.robotOptions.find(item => item.id === robotId);
      this.formData.robotId = robot?.id || '';
      this.formData.robotName = robot?.robotName || '';
    }

    formatRobotNameOption(robot: WeComBotRobot): string {
      return robot.robotType ? `${robot.robotName}（${robot.robotType}）` : robot.robotName;
    }

    onGroupChatChange(id?: string): void {
      const group = this.groupChatOptions.find(item => item.id === id);
      this.formData.groupChatId = group?.id || '';
      this.formData.groupChatName = group?.groupChatName || '';
    }

    async toggleEnable(record: WeComBotGroupChatRobot, checked: boolean): Promise<void> {
      if (!record.id) {
        this.$message.warning('当前记录缺少配置ID，无法修改状态');
        return;
      }
      const oldValue = record.enable;
      this.$set(record, 'switchLoading', true);
      const response = await this.$weComBotService.saveGroupChatRobot({
        id: record.id,
        groupChatId: record.groupChatId,
        groupChatName: record.groupChatName,
        robotId: record.robotId,
        robotName: record.robotName,
        enable: checked
      });
      if (response.success) {
        record.enable = checked;
        this.$message.success(checked ? '已启用配置' : '已关闭配置');
      } else {
        record.enable = oldValue;
        this.$message.error(response.message || '状态修改失败');
      }
      this.$set(record, 'switchLoading', false);
    }

    deleteConfig(record: WeComBotGroupChatRobot): void {
      if (!record.id) {
        this.$message.warning('当前记录缺少配置ID，无法删除');
        return;
      }
      this.$confirm({
        title: '确认删除',
        content: `确定删除“${record.robotName} - ${record.groupChatName}”配置吗？`,
        okText: '确认删除',
        okType: 'danger',
        cancelText: '取消',
        onOk: async () => {
          const response = await this.$weComBotService.deleteGroupChatRobot(record.id as string);
          if (response.success) {
            this.$message.success('删除成功');
            await this.loadConfigList();
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
        const payloads = this.buildSavePayloads();
        for (const payload of payloads) {
          const response = await this.$weComBotService.saveGroupChatRobot(payload);
          if (!response.success) {
            this.$message.error(response.message || '保存配置失败');
            return;
          }
        }
        this.$message.success(this.editingRecord ? '修改成功' : '新增成功');
        this.modalVisible = false;
        await this.loadConfigList();
      } finally {
        this.modalLoading = false;
      }
    }

    buildSavePayloads(): SaveWeComBotGroupChatRobotParams[] {
      return [
        {
          id: this.editingRecord ? this.formData.id : undefined,
          groupChatId: this.formData.groupChatId,
          groupChatName: this.formData.groupChatName,
          robotId: this.formData.robotId,
          robotName: this.formData.robotName,
          enable: this.formData.enable
        }
      ];
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

    goRobot(): void {
      this.$router.push('/wecomBot/robot');
    }

    goGroupChat(): void {
      this.$router.push('/wecomBot/groupChat');
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

  export default WeComBotConfigIndexComponent;
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
