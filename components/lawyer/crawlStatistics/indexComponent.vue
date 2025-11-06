<template>
  <div class="lawyer-page-container">
    <div class="lawyer-content-wrapper">
      <!-- 数据表格 -->
      <a-card class="lawyer-table-card" :bordered="false">
        <!-- 搜索和筛选区域 -->
        <div class="lawyer-search-form">
          <a-row :gutter="16">
            <a-col :span="4">
              <a-input
                v-model="searchParams.websiteName"
                placeholder="网站名称"
                allow-clear
                @keyup.enter="onSearch"
              />
            </a-col>
            <a-col :span="4">
              <a-input
                v-model="searchParams.articleTitle"
                placeholder="文章标题"
                allow-clear
                @keyup.enter="onSearch"
              />
            </a-col>
            <a-col :span="4">
              <div class="lawyer-width-100">
                <a-select v-model="searchParams.processStatus" placeholder="处理状态" allow-clear>
                  <a-select-option value="未爬取"> 未爬取 </a-select-option>
                  <a-select-option value="爬取成功"> 爬取成功 </a-select-option>
                  <a-select-option value="爬取失败"> 爬取失败 </a-select-option>
                  <a-select-option value="爬取中"> 爬取中 </a-select-option>
                </a-select>
              </div>
            </a-col>
            <a-col :span="4">
              <div>
                <a-date-picker
                  v-model="searchParams.publishDate"
                  placeholder="发布日期"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  style="width: 100%"
                />
              </div>
            </a-col>
            <a-col :span="8" class="lawyer-search-buttons">
              <div class="lawyer-button-group">
                <a-button type="primary" :loading="tableLoading" @click="onSearch"> 搜索 </a-button>
                <a-button @click="onReset"> 重置 </a-button>
              </div>
            </a-col>
          </a-row>
        </div>

        <a-table
          :columns="columns"
          :data-source="dataList"
          :pagination="pagination"
          :loading="tableLoading"
          :row-key="record => record.id"
          :scroll="{ x: 1500 }"
          @change="handleTableChange"
        >
          <!-- 处理状态列 -->
          <template slot="processStatus" slot-scope="text">
            <a-tag :color="getStatusColor(text)" class="lawyer-status-tag">
              {{ text || '未知' }}
            </a-tag>
          </template>

          <template slot="detailUrl" slot-scope="text">
            <a :href="text" target="_blank">{{ text }}</a>
          </template>

          <template slot="extractStatus" slot-scope="text">
            <span :class="getCheckStatusClass(text)">
              {{ text || '未知状态' }}
            </span>
          </template>

          <!-- 发布日期列 -->
          <template slot="publishDate" slot-scope="text">
            {{ formatTime(text, 'yyyy-MM-dd') }}
          </template>

          <!-- 创建时间列 -->
          <template slot="createdTime" slot-scope="text">
            {{ formatTime(text) }}
          </template>

          <!-- 操作列 -->
          <template slot="action" slot-scope="text, record">
            <div class="lawyer-action-buttons">
              <a-button
                type="link"
                :disabled="isProcessing(record)"
                :icon="isProcessing(record) ? 'loading' : 'play-circle'"
                @click="executeTask(record)"
              >
                {{ isProcessing(record) ? '正在处理' : '执行' }}
              </a-button>
              <a-button type="link" @click="viewCrawlHistory(record)"> 查看 </a-button>
              <a-button type="link" @click="viewWebsiteDetails(record)"> 网站详情 </a-button>
              <a-button type="link" @click="editRecord(record)"> 修改 </a-button>
            </div>
          </template>
        </a-table>
      </a-card>
    </div>

    <!-- 执行历史记录弹窗 -->
    <a-modal v-model="crawlHistoryModalVisible" title="执行历史记录" width="90%" :footer="null">
      <a-tabs v-model="activeLogType" @change="onLogTypeChange">
        <a-tab-pane v-for="logType in logTypes" :key="logType" :tab="logType"> </a-tab-pane>
      </a-tabs>

      <!-- 统一的表格，放在 tabs 外面 -->
      <a-table
        :columns="dynamicCrawlHistoryColumns"
        :data-source="crawlHistoryList"
        :pagination="historyPagination"
        :loading="crawlHistoryLoading"
        :row-key="record => record.id"
      >
        <!-- 处理状态列 -->
        <template slot="processStatus" slot-scope="text">
          <a-tag :color="getProcessStatusColor(text)" class="lawyer-status-tag">
            {{ text }}
          </a-tag>
        </template>
        <!-- AI提取状态列 -->
        <template slot="aiExtractStatus" slot-scope="text">
          <a-tag :color="getAiExtractStatusColor(text)" class="lawyer-status-tag">
            {{ formatAiExtractStatus(text) }}
          </a-tag>
        </template>
        <template slot="detailUrl" slot-scope="text">
          <a :href="text" target="_blank">{{ text }}</a>
        </template>

        <!-- 创建时间列 -->
        <template slot="createdTime" slot-scope="text">
          {{ formatTime(text) }}
        </template>
      </a-table>
    </a-modal>

    <!-- 网站详情弹窗 -->
    <a-modal v-model="checkRuleModalVisible" title="网站详情" width="90%" :footer="null">
      <a-table
        :columns="checkRuleColumns"
        :data-source="checkRuleList"
        :pagination="false"
        :loading="checkRuleLoading"
        :row-key="record => record.id"
      >
        <!-- 审核状态列 -->
        <template slot="checkStatus" slot-scope="text">
          <a-tag :color="getCheckStatusColor(text)" class="lawyer-status-tag">
            {{ text }}
          </a-tag>
        </template>
        <!-- 创建时间列 -->
        <template slot="createdTime" slot-scope="text">
          {{ formatTime(text) }}
        </template>
      </a-table>
    </a-modal>

    <!-- 修改状态弹窗 -->
    <a-modal
      v-model="editModalVisible"
      title="修改状态"
      width="500px"
      :confirm-loading="editLoading"
      @ok="handleEditSubmit"
      @cancel="handleEditCancel"
    >
      <a-form-model
        ref="editFormModel"
        :model="editFormData"
        :rules="editFormRules"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
      >
        <a-form-model-item label="处理状态" prop="processStatus">
          <a-select v-model="editFormData.processStatus" placeholder="请选择处理状态">
            <a-select-option value="未爬取">未爬取</a-select-option>
            <a-select-option value="爬取成功">爬取成功</a-select-option>
            <a-select-option value="爬取失败">爬取失败</a-select-option>
            <a-select-option value="爬取中">爬取中</a-select-option>
          </a-select>
        </a-form-model-item>
        <a-form-model-item label="对比状态" prop="extractStatus">
          <a-select v-model="editFormData.extractStatus" placeholder="请选择对比状态" allow-clear>
            <a-select-option value="核对成功">核对成功</a-select-option>
            <a-select-option value="核对失败">核对失败</a-select-option>
            <a-select-option value="未核对">未核对</a-select-option>
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
  import {
    CrawlDataItem,
    CrawlStatisticsQueryParams,
    CheckRuleItem,
    CrawlCheckRuleListParams,
    CrawlHistoryItem,
    CrawlHistoryQueryParams,
    ProcessStatus,
    UpdateCrawlStatusSimpleParams
  } from '~/model/LawyerConfigModel';

  @Component({ name: 'lawyer-crawl-statistics-index-component' })
  class CrawlStatisticsComponent extends Vue {
    // 搜索参数
    searchParams: CrawlStatisticsQueryParams = {
      websiteCode: '',
      websiteName: '',
      articleTitle: '',
      detailUrl: '',
      publishDate: '',
      processStatus: undefined,
      current: 1,
      size: 10,
      orderBy: 'createdTime',
      sortRules: 'desc'
    };

    // 表格数据
    dataList: CrawlDataItem[] = [];
    tableLoading: boolean = false;
    // 定时器
    refreshTimer: NodeJS.Timeout | null = null;
    // 执行历史记录相关数据
    crawlHistoryModalVisible: boolean = false;
    crawlHistoryList: CrawlHistoryItem[] = [];
    crawlHistoryLoading: boolean = false;
    activeLogType: string = '爬取日志'; // 当前激活的日志类型
    currentDetailId: string = ''; // 当前查看的详情ID
    // 日志类型常量
    logTypes = ['爬取日志', '核对日志'];
    // 审核记录相关数据
    checkRuleModalVisible: boolean = false;
    checkRuleList: CheckRuleItem[] = [];
    checkRuleLoading: boolean = false;
    // 修改状态相关数据
    editModalVisible: boolean = false;
    editLoading: boolean = false;
    currentEditRecord: CrawlDataItem | null = null;
    // 表单数据
    editFormData = {
      processStatus: '',
      extractStatus: ''
    };

    // 表单验证规则
    editFormRules = {
      processStatus: [{ required: true, message: '请选择处理状态', trigger: 'change' }]
    };

    // 分页配置
    pagination = {
      current: 1,
      pageSize: 10,
      total: 0,
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: (total: number) => `共 ${total} 条记录`
    };

    historyPagination = {
      pageSize: 10,
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: (total: number) => `共 ${total} 条记录`
    };

    // 表格列配置
    columns = [
      {
        title: '网站编码',
        dataIndex: 'websiteCode',
        key: 'websiteCode',
        width: 100
      },
      {
        title: '网站名称',
        dataIndex: 'websiteName',
        key: 'websiteName',
        width: 150
      },
      {
        title: '文章标题',
        dataIndex: 'articleTitle',
        key: 'articleTitle',
        width: 150,
        ellipsis: true
      },
      {
        title: '文章详情地址',
        dataIndex: 'detailUrl',
        key: 'detailUrl',
        scopedSlots: { customRender: 'detailUrl' },
        width: 100,
        ellipsis: true
      },
      {
        title: '处理状态',
        dataIndex: 'processStatus',
        key: 'processStatus',
        scopedSlots: { customRender: 'processStatus' },
        width: 100
      },
      {
        title: '对比状态',
        dataIndex: 'extractStatus',
        key: 'extractStatus',
        scopedSlots: { customRender: 'extractStatus' },
        width: 100
      },
      {
        title: '文章发布日期',
        dataIndex: 'publishDate',
        key: 'publishDate',
        scopedSlots: { customRender: 'publishDate' },
        width: 140
      },
      {
        title: '创建时间',
        dataIndex: 'createdTime',
        key: 'createdTime',
        scopedSlots: { customRender: 'createdTime' },
        width: 160,
        sorter: true
      },
      {
        title: '更新时间',
        dataIndex: 'updateTime',
        key: 'updateTime',
        scopedSlots: { customRender: 'createdTime' },

        sorter: true
      },
      {
        title: '操作',
        key: 'action',
        scopedSlots: { customRender: 'action' },
        width: 235,
        fixed: 'right'
      }
    ];

    // 执行历史记录表格列配置
    crawlHistoryColumns = [
      {
        title: '文章标题',
        dataIndex: 'articleTitle',
        key: 'articleTitle',
        ellipsis: true,
        width: 200
      },
      {
        title: '详情链接',
        dataIndex: 'detailUrl',
        key: 'detailUrl',
        scopedSlots: { customRender: 'detailUrl' },
        ellipsis: true,
        width: 200
      },
      {
        title: '处理状态',
        dataIndex: 'processStatus',
        key: 'processStatus',
        scopedSlots: { customRender: 'processStatus' },
        width: 120
      },
      {
        title: '异常信息',
        dataIndex: 'exceptionMsg',
        key: 'exceptionMsg',
        ellipsis: true,
        width: 200
      },
      {
        title: '创建时间',
        dataIndex: 'createdTime',
        key: 'createdTime',
        scopedSlots: { customRender: 'createdTime' },
        width: 160
      }
    ];

    // 动态表格列配置（根据日志类型）
    get dynamicCrawlHistoryColumns() {
      // 根据日志类型确定状态列配置
      const statusColumn =
        this.activeLogType === '核对日志'
          ? {
              title: '状态',
              dataIndex: 'aiExtractStatus',
              key: 'aiExtractStatus',
              scopedSlots: { customRender: 'aiExtractStatus' },
              width: 120
            }
          : {
              title: '处理状态',
              dataIndex: 'processStatus',
              key: 'processStatus',
              scopedSlots: { customRender: 'processStatus' },
              width: 120
            };

      return [
        {
          title: '文章标题',
          dataIndex: 'articleTitle',
          key: 'articleTitle',
          ellipsis: true,
          width: 200
        },
        {
          title: '详情链接',
          dataIndex: 'detailUrl',
          key: 'detailUrl',
          scopedSlots: { customRender: 'detailUrl' },
          ellipsis: true,
          width: 200
        },
        statusColumn,
        {
          title: '异常信息',
          dataIndex: 'exceptionMsg',
          key: 'exceptionMsg',
          ellipsis: true,
          width: 200
        },
        {
          title: '创建时间',
          dataIndex: 'createdTime',
          key: 'createdTime',
          scopedSlots: { customRender: 'createdTime' },
          width: 160
        }
      ];
    }

    // 审核记录表格列配置
    checkRuleColumns = [
      {
        title: '标题',
        dataIndex: 'ruleName',
        key: 'ruleName',
        ellipsis: true
      },
      {
        title: '网站名称',
        dataIndex: 'websiteName',
        key: 'websiteName',
        width: 150
      },
      {
        title: '分类',
        dataIndex: 'categoryMain',
        key: 'categoryMain',
        width: 150,
        customRender: (_text: string, record: CheckRuleItem) => {
          const main = record.categoryMain || '';
          const sub = record.categorySub || '';
          return sub ? `${main} / ${sub}` : main;
        }
      },
      {
        title: '审核状态',
        dataIndex: 'checkStatus',
        key: 'checkStatus',
        scopedSlots: { customRender: 'checkStatus' },
        width: 100
      },
      {
        title: '施行日期',
        dataIndex: 'effectDate',
        key: 'effectDate',
        width: 120
      },
      {
        title: '创建时间',
        dataIndex: 'createdTime',
        key: 'createdTime',
        scopedSlots: { customRender: 'createdTime' },
        width: 160
      }
    ];

    // 生命周期
    async mounted(): Promise<void> {
      await this.loadData();
      this.startAutoRefresh();
    }

    // 组件销毁时清理定时器
    beforeDestroy(): void {
      this.stopAutoRefresh();
    }

    // 加载数据
    async loadData(): Promise<void> {
      this.tableLoading = true;
      try {
        // 构建查询参数
        const apiParams: CrawlStatisticsQueryParams = {
          ...this.searchParams,
          publishDate: this.searchParams.publishDate || undefined,
          processStatus: this.searchParams.processStatus || undefined
        };
        const response = await this.$roadLawyerService.getCrawlHtmlList(apiParams);

        if (response.success && response.data) {
          this.dataList = response.data.records;
          this.pagination.total = response.data.total;
          this.pagination.current = response.data.current;
          this.pagination.pageSize = this.searchParams.size;
        } else {
          this.dataList = [];
          this.pagination.total = 0;
          this.$message.error(response.message || '加载数据失败');
        }
      } catch (error) {
        console.error('加载数据失败:', error);
        this.dataList = [];
        this.pagination.total = 0;
        this.$message.error('加载数据失败');
      } finally {
        this.tableLoading = false;
      }
    }

    // 搜索
    async onSearch(): Promise<void> {
      this.searchParams.current = 1;
      this.pagination.current = 1;
      await this.loadData();
    }

    // 重置搜索参数
    private resetSearchParams(): void {
      this.searchParams = {
        websiteCode: '',
        websiteName: '',
        articleTitle: '',
        detailUrl: '',
        publishDate: '',
        processStatus: undefined,
        current: 1,
        size: 10,
        orderBy: 'createdTime',
        sortRules: 'desc'
      };
    }

    // 重置搜索
    async onReset(): Promise<void> {
      this.resetSearchParams();
      this.pagination.current = 1;
      this.pagination.pageSize = 10;
      await this.loadData();
    }

    // 表格变化处理
    async handleTableChange(
      pagination: { current: number; pageSize: number },
      _filters: unknown,
      sorter: { field?: string; order?: string }
    ): Promise<void> {
      // 同步更新搜索参数和分页配置
      this.searchParams.current = pagination.current;
      this.searchParams.size = pagination.pageSize;
      this.pagination.current = pagination.current;
      this.pagination.pageSize = pagination.pageSize;

      // 处理排序参数
      if (sorter.field) {
        this.searchParams.orderBy = sorter.field;
        this.searchParams.sortRules = sorter.order === 'ascend' ? 'asc' : 'desc';
      } else {
        // 如果没有排序，使用默认排序
        this.searchParams.orderBy = 'createdTime';
        this.searchParams.sortRules = 'desc';
      }

      await this.loadData();
    }

    // 获取状态颜色
    getStatusColor(status: string): string {
      const colorMap: { [key: string]: string } = {
        未爬取: '#d9d9d9',
        爬取成功: '#52c41a',
        爬取失败: '#ff4d4f',
        爬取中: '#1890ff',
        待处理: '#fa8c16'
      };
      return colorMap[status] || '#d9d9d9';
    }

    // 获取审核状态样式类（使用全局样式）
    getCheckStatusClass(status: string | null): string {
      const classMap = {
        未核对: 'lawyer-status-pending',
        核对成功: 'lawyer-status-approved',
        核对失败: 'lawyer-status-rejected'
      };
      return classMap[status || ''] || 'lawyer-status-pending';
    }

    // 获取审核状态颜色
    getCheckStatusColor(status: string): string {
      const colorMap: { [key: string]: string } = {
        待审核: '#fa8c16',
        已通过: '#52c41a',
        已驳回: '#ff4d4f',
        审核中: '#1890ff'
      };
      return colorMap[status] || '#d9d9d9';
    }

    // 获取处理状态颜色
    getProcessStatusColor(status: ProcessStatus): string {
      const colorMap: { [key: string]: string } = {
        未爬取: '#d9d9d9',
        爬取中: '#1890ff',
        爬取成功: '#52c41a',
        爬取失败: '#ff4d4f'
      };
      return colorMap[status] || '#d9d9d9';
    }

    // 格式化AI提取状态显示
    formatAiExtractStatus(status: number | null | undefined): string {
      if (status === 1) {
        return '核对成功';
      }
      return '核对失败';
    }

    // 获取AI提取状态颜色
    getAiExtractStatusColor(status: number | null | undefined): string {
      if (status === 1) {
        return '#52c41a'; // 绿色表示成功
      }
      return '#ff4d4f'; // 红色表示失败
    }

    // 格式化时间显示
    formatTime(timeStr: string, format?: string): string {
      if (!timeStr) return '-';
      return formatDate(timeStr, format || 'yyyy-MM-dd hh:mm:ss');
    }

    // 判断任务是否正在爬取中
    isProcessing(record: CrawlDataItem): boolean {
      return record.processStatus === '爬取中';
    }

    // 开始自动刷新
    startAutoRefresh(): void {
      // 每10分钟刷新一次
      this.refreshTimer = setInterval(() => {
        // 只有当存在爬取中的任务时才自动刷新
        const hasProcessingTasks = this.dataList.some(item => this.isProcessing(item));
        if (hasProcessingTasks) {
          this.loadData();
        }
      }, 600000);
    }

    // 停止自动刷新
    stopAutoRefresh(): void {
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer);
        this.refreshTimer = null;
      }
    }

    // 执行任务
    executeTask(record: CrawlDataItem) {
      this.$confirm({
        title: '确认执行任务',
        content: `确定要执行网站"${record.websiteName}"的爬取任务吗？`,
        okText: '确认',
        cancelText: '取消',
        onOk: async () => {
          try {
            // 调用真实API
            const response = await this.$roadLawyerService.executeCrawlTask({
              id: record.id
            });

            // 显示结果消息
            if (response.success) {
              this.$message.success('任务执行成功');
            } else {
              this.$message.error(response.message || '任务执行失败，请重试');
            }

            // 刷新数据（获取最新状态）
            await this.loadData();
          } catch (error) {
            console.error('执行任务失败:', error);
            this.$message.error('执行任务失败，请重试');
          }
        }
      });
    }

    // 查看执行历史记录
    async viewCrawlHistory(record: CrawlDataItem): Promise<void> {
      this.currentDetailId = record.id;
      this.activeLogType = '爬取日志'; // 默认显示爬取日志
      this.crawlHistoryModalVisible = true;
      await this.loadCrawlHistoryData(record.id, this.activeLogType);
    }

    // 查看网站详情
    async viewWebsiteDetails(record: CrawlDataItem): Promise<void> {
      this.checkRuleModalVisible = true;
      await this.loadCheckRuleData(record.id);
    }

    // 加载审核记录数据
    async loadCheckRuleData(id: string): Promise<void> {
      this.checkRuleLoading = true;
      try {
        const params: CrawlCheckRuleListParams = {
          id
        };

        const response = await this.$roadLawyerService.getCrawlCheckRuleList(params);

        if (response.success && response.data) {
          this.checkRuleList = response.data;
        } else {
          this.checkRuleList = [];
          this.$message.error(response.message || '加载审核记录失败');
        }
      } catch (error) {
        console.error('加载审核记录失败:', error);
        this.checkRuleList = [];
        this.$message.error('加载审核记录失败');
      } finally {
        this.checkRuleLoading = false;
      }
    }

    // 加载执行历史记录数据
    async loadCrawlHistoryData(detailId: string, logType: string): Promise<void> {
      this.crawlHistoryLoading = true;
      try {
        const params: CrawlHistoryQueryParams = {
          detailId,
          logType,
          current: 1,
          size: 10 // 显示更多历史记录
        };

        const response = await this.$roadLawyerService.getCrawlHistory(params);

        if (response.success && response.data && response.data.records) {
          this.crawlHistoryList = response.data.records;
        } else {
          this.crawlHistoryList = [];
          this.$message.error(response.message || '加载执行历史记录失败');
        }
      } catch (error) {
        console.error('加载执行历史记录失败:', error);
        this.crawlHistoryList = [];
        this.$message.error('加载执行历史记录失败');
      } finally {
        this.crawlHistoryLoading = false;
      }
    }

    // 打开修改弹窗
    editRecord(record: CrawlDataItem): void {
      this.currentEditRecord = record;
      this.editModalVisible = true;

      // 设置表单数据
      this.editFormData = {
        processStatus: record.processStatus,
        extractStatus: record.extractStatus || ''
      };

      // 清除表单验证
      this.$nextTick(() => {
        const formRef = this.$refs.editFormModel as FormModel;
        if (formRef && formRef.clearValidate) {
          formRef.clearValidate([]);
        }
      });
    }

    // 处理修改提交
    async handleEditSubmit(): Promise<void> {
      if (!this.currentEditRecord) return;

      try {
        // 验证表单
        const formRef = this.$refs.editFormModel as FormModel;
        if (!formRef) {
          throw new Error('表单引用无效');
        }
        await formRef.validate();
        this.editLoading = true;

        const params: UpdateCrawlStatusSimpleParams = {
          id: this.currentEditRecord.id,
          processStatus: this.editFormData.processStatus as ProcessStatus,
          extractStatus: this.editFormData.extractStatus || ''
        };

        const response = await this.$roadLawyerService.updateCrawlStatusSimple(params);

        if (response.success) {
          this.$message.success('修改成功');
          this.editModalVisible = false;
          await this.loadData(); // 刷新数据
        } else {
          this.$message.error(response.message || '修改失败');
        }
      } catch (error) {
        console.error('修改失败:', error);

        this.$message.error('修改失败，请重试');
      } finally {
        this.editLoading = false;
      }
    }

    // 取消修改
    handleEditCancel(): void {
      this.editModalVisible = false;
      this.currentEditRecord = null;

      // 重置表单数据
      this.editFormData = {
        processStatus: '',
        extractStatus: ''
      };

      // 清除表单验证
      this.$nextTick(() => {
        const formRef = this.$refs.editFormModel as FormModel;
        if (formRef && formRef.clearValidate) {
          formRef.clearValidate([]);
        }
      });
    }

    // 处理日志类型切换
    async onLogTypeChange(logType: string): Promise<void> {
      this.activeLogType = logType;
      if (this.currentDetailId) {
        await this.loadCrawlHistoryData(this.currentDetailId, logType);
      }
    }
  }
  export default CrawlStatisticsComponent;
</script>

<style lang="less" scoped>
  .lawyer-search-form {
    margin-bottom: 16px;
  }

  .lawyer-width-100 {
    width: 100%;
  }

  .lawyer-search-buttons {
    display: flex;
    justify-content: flex-end;
    align-items: center;
  }

  .lawyer-button-group,
  .lawyer-action-buttons {
    display: flex;
    gap: 8px;
  }

  .lawyer-action-buttons {
    justify-content: center;

    .ant-btn-link {
      padding: 0;
      height: auto;
      line-height: 1.5;
    }
  }

  .lawyer-status-tag {
    width: 60px;
    text-align: center;
    display: inline-block;
  }

  .lawyer-table-card {
    .ant-table-wrapper {
      .ant-table-tbody > tr > td {
        padding: 12px 16px;
      }
    }
  }

  .lawyer-exception-text {
    color: #ff4d4f;
    cursor: help;
  }
</style>
