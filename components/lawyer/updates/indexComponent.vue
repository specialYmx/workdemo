<template>
  <div class="updates-page-wrapper">
    <div class="lawyer-page-container">
      <!-- 主卡片容器 -->
      <div class="lawyer-card">
        <!-- 页面头部 -->
        <div class="lawyer-updates-header">
          <h2 class="lawyer-title">智库更新与通知</h2>
          <div class="lawyer-filter-tabs">
            <button
              v-for="category in categoryList"
              :key="category.id"
              class="lawyer-filter-btn"
              :class="{
                'lawyer-filter-btn-active': currentCategoryId === category.id
              }"
              @click="changeCategory(category.id)"
            >
              {{ category.name }}
            </button>
          </div>
        </div>

        <!-- 加载中状态 -->
        <div v-if="loading" class="lawyer-loading-container">
          <a-spin size="large" tip="正在加载数据..." />
        </div>

        <!-- 法规更新列表 -->
        <div v-else class="lawyer-updates-list">
          <div v-for="item in allUpdates" :key="item.id" class="lawyer-update-item">
            <div :class="['lawyer-update-icon', item.type]">
              <template v-if="item.type === 'law'"> ⚖️ </template>
              <template v-else-if="item.type === 'policy'"> 📋 </template>
              <template v-else-if="item.type === 'internal'"> 🏢 </template>
              <template v-else> 🔧 </template>
            </div>
            <div class="lawyer-update-content">
              <div class="lawyer-flex lawyer-justify-between">
                <h3 class="lawyer-update-title">
                  {{ item.title }}
                </h3>
                <span class="lawyer-text-light">{{ item.date }}</span>
              </div>
              <p class="lawyer-update-summary">
                {{ item.description }}
              </p>

              <!-- AI智能解读 -->
              <div
                v-if="item.summary && (isQuarterlyJournal(item) || item.summaryArray.length)"
                class="lawyer-ai-summary"
              >
                <h4>AI智能解读主要变更点：</h4>
                <!-- 季刊类：直接展示原始摘要文本（去掉首尾方括号），保留换行 -->
                <pre v-if="isQuarterlyJournal(item)" class="lawyer-ai-summary__rich"
                  >{{ getQuarterlySummaryContent(item.summary) }}
                </pre>
                <!-- 其他类型：保持原有列表展示逻辑 -->
                <ul v-else>
                  <li v-for="(point, index) in item.summaryArray" :key="index">
                    <span>
                      <strong v-if="point.title">{{ point.title }}：</strong>{{ point.content }}
                    </span>
                  </li>
                </ul>
              </div>

              <div class="lawyer-flex lawyer-justify-between lawyer-items-center">
                <div class="lawyer-flex lawyer-gap-sm">
                  <span
                    v-for="(tag, index) in item.tags"
                    :key="tag"
                    :class="['lawyer-tag', getTagClass(index)]"
                  >
                    {{ tag }}
                  </span>
                  <span class="lawyer-tag lawyer-tag-source">
                    {{ item.source }}
                  </span>
                </div>
                <div class="lawyer-flex lawyer-gap-sm">
                  <a class="lawyer-action-btn lawyer-btn-primary" @click.prevent="viewUpdate(item)"
                    >查看详情</a
                  >
                  <a class="lawyer-action-btn" @click.prevent="downloadUpdate(item.id, item.title)"
                    >下载文件</a
                  >
                </div>
              </div>
            </div>
          </div>

          <!-- 无内容展示 -->
          <div v-if="!allUpdates.length" class="lawyer-no-updates">
            <a-empty description="没有匹配的数据" />
          </div>
        </div>

        <!-- 分页器 -->
        <div v-if="allUpdates.length" class="lawyer-pagination">
          <a-pagination
            v-model="currentPage"
            :total="totalDocuments"
            :page-size="pageSize"
            show-size-changer
            show-quick-jumper
            :show-total="(total, range) => `共 ${total} 条记录，显示第 ${range[0]}-${range[1]} 条`"
            @change="onPageChange"
            @showSizeChange="onPageSizeChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  import { Component, Vue } from 'nuxt-property-decorator';
  import type {
    RuleUpdateItem,
    UpdateItem,
    RuleUpdateQueryParams,
    RouteQuery,
    SummaryPoint
  } from '~/model/LawyerModel';
  import { downloadFileWithMessage } from '~/utils/personal';

  @Component({ name: 'lawyer-updates-index-component' })
  class LawyerUpdatesIndexComponent extends Vue {
    currentPage: number = 1;
    pageSize: number = 10;
    loading: boolean = false;
    rawUpdates: RuleUpdateItem[] = [];
    allUpdates: UpdateItem[] = []; // 存储当前页数据
    totalDocuments: number = 0; // 总数据量
    currentCategoryId: string | null = null; // 当前选中的分类ID

    // 分类数据
    categoryList: { id: string | null; name: string }[] = [
      { id: null, name: '全部更新' },
      { id: '2', name: '法律汇编' },
      { id: '310', name: '新规解读' },
      { id: '1', name: '处罚汇编' },
      { id: '311', name: '研究集锦' },
      { id: '312', name: '法律合规季刊' },
      { id: '3', name: '制度库' }
    ];

    async mounted(): Promise<void> {
      await this.loadUpdates();
    }

    async loadUpdates(): Promise<void> {
      this.loading = true;
      try {
        // 构建查询参数，添加分页参数
        const params: RuleUpdateQueryParams = {
          page: this.currentPage,
          pageSize: this.pageSize
        };

        // 添加分类ID参数，如果有选择分类
        if (this.currentCategoryId) {
          params.categoryId = this.currentCategoryId;
        }

        console.log('查询参数:', params);

        // 调用真实API获取数据
        const response = await this.$roadLawyerService.getRuleUpdateList(params);
        console.log('获取到的数据:', response);

        // 根据新的数据结构处理响应
        if (response && response.success && response.data) {
          this.rawUpdates = response.data.data || [];

          // 将真实数据转换为页面显示格式
          this.allUpdates = this.transformRawDataToDisplayFormat(response.data.data || []);

          // 更新总数和当前页码
          this.totalDocuments = response.data.totalSize || 0;
          if (response.data.pageNum) {
            this.currentPage = response.data.pageNum;
          }
        } else {
          this.rawUpdates = [];
          this.allUpdates = [];
          this.totalDocuments = 0;
        }
      } catch (error) {
        console.error('加载更新数据失败', error);
        this.$message.error('加载数据失败，请刷新页面重试');
        this.rawUpdates = [];
        this.allUpdates = [];
        this.totalDocuments = 0;
      } finally {
        this.loading = false;
      }
    }

    // 获取更新描述
    getUpdateDescription(fileContent: string): string {
      if (!fileContent) {
        return '暂无详细描述';
      }

      // 移除Markdown格式的图片链接
      const processed = fileContent.replace(/!\[.*?\]\(.*?\)/g, '');

      return processed.length > 200 ? processed.substring(0, 200) + '...' : processed;
    }

    // 将真实API数据转换为页面显示格式
    transformRawDataToDisplayFormat(rawData: RuleUpdateItem[]): UpdateItem[] {
      return rawData.map((item: RuleUpdateItem): UpdateItem => {
        // 根据分类确定类型
        const categoryMain: string = item.categoryMain || '';
        let type: string = 'law';
        if (categoryMain.includes('政策') || categoryMain.includes('监管')) {
          type = 'policy';
        } else if (categoryMain.includes('内部') || categoryMain.includes('机构')) {
          type = 'internal';
        }

        // 生成标签 - 优先使用assemblyCategoryMain，其次使用categoryMain
        const mainCategory = item.assemblyCategoryMain || item.categoryMain || '';
        const subCategory = item.categorySub || '';

        const tags: string[] = [mainCategory, subCategory].filter(Boolean);

        // 生成描述 - 优先使用fileContent并进行字数省略
        const description: string = this.getUpdateDescription(item.fileContent);

        // 预处理摘要数组，一次性提取标题和内容，避免模板中重复计算
        const summaryArray: SummaryPoint[] = this.parseSummaryArray(item.summary || '');

        return {
          id: item.id,
          title: item.ruleName || '未知标题',
          description,
          fileContent: item.fileContent || '',
          summary: item.summary || '',
          summaryArray,
          date: item.createdTimeStr || item.publishDateStr || '未知时间',
          source: item.legalSource || '未知来源',
          category: item.categoryMain || '其他',
          type,
          tags,
          assemblyCategoryMain: item.assemblyCategoryMain,
          dataSource: item.dataSource, // 数据来源
          updateStatus: item.updateStatus, // 更新状态
          ruleName: item.ruleName, // 法规名称
          // 旧版本文档ID（若后端提供则透传，用于 iframe 对比）
          oldId: item.oldId
        };
      });
    }

    async viewUpdate(item: UpdateItem): Promise<void> {
      const dataSource: string = item.dataSource || '';
      const updateStatus: string = item.updateStatus || '';

      // 统一的跳转逻辑
      const navigateToDetail = (): void => {
        const query: RouteQuery = {
          id: item.id,
          pageTitle: item.ruleName || item.title || '法规更新详情',
          source: this.$route.path,
          dataSource,
          // 若列表项包含旧版本ID，则一并传递，便于详情页直接获取 iframe
          ...(item.oldId ? { oldId: item.oldId } : {})
        };

        this.$router.push({
          path: '/lawyerUpdate/detail',
          query
        });
      };

      // 判断是否可以跳转
      if (dataSource === '1') {
        // 爬取数据，需要判断 updateStatus
        if (updateStatus === '1') {
          // 列表中已经是 "1"，直接跳转
          navigateToDetail();
        } else {
          // 列表中不是 "1"，调用接口获取最新的 updateStatus
          try {
            const result = await this.$roadLawyerService.getRuleSourceDetail({
              searchId: item.id
            });

            if (result && result.updateStatus === '1') {
              // 最新状态为 "1"，允许跳转
              navigateToDetail();
            } else {
              // 最新状态还不是 "1"，提示用户
              this.$message.warning('还未生成对比结果，请稍等');
            }
          } catch (error) {
            console.error('获取详情失败:', error);
            this.$message.error('获取详情失败，请重试');
          }
        }
      } else if (dataSource === '2') {
        // 人工审核数据，直接跳转
        navigateToDetail();
      }
    }

    async downloadUpdate(id: string, title: string): Promise<void> {
      let hideLoading = null;
      try {
        hideLoading = this.$message.loading(`正在准备下载: ${title}`, 0);

        const result = await this.$roadLawyerService.downloadRuleFile({
          searchId: id
        });

        hideLoading();

        downloadFileWithMessage(result, {
          fileName: `${title}.docx`,
          showMessage: true,
          messageService: this.$message
        });
      } catch (error) {
        if (hideLoading) {
          hideLoading();
        }
        console.error('下载失败:', error);
        this.$message.error('下载失败，请检查网络连接后重试');
      }
    }

    async onPageChange(page: number): Promise<void> {
      this.currentPage = page;
      // 后端分页，重新请求API
      await this.loadUpdates();
    }

    async onPageSizeChange(_current: number, size: number): Promise<void> {
      this.currentPage = 1;
      this.pageSize = size;
      // 后端分页，重新请求API
      await this.loadUpdates();
    }

    // 切换分类
    async changeCategory(categoryId: string | null): Promise<void> {
      if (this.currentCategoryId === categoryId) {
        return; // 如果点击当前已选中的分类，不做任何操作
      }

      this.currentCategoryId = categoryId;
      this.currentPage = 1; // 切换分类时重置为第一页
      await this.loadUpdates(); // 重新加载数据
    }

    // 是否为法律合规季刊类数据（按组装分类主字段模糊判断，兼容后续子类，如“法律合规观察季刊/XXX”）
    isQuarterlyJournal(item: UpdateItem): boolean {
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

    getTagClass(index: number = 0): string {
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
        // JSON.parse 失败，使用手动解析逻辑作为回退方案
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
  }
  export default LawyerUpdatesIndexComponent;
</script>

<style lang="less">
  @import '~/assets/styles/lawyer.less';

  .updates-page-wrapper {
    .lawyer-updates-header {
      margin-bottom: 24px;
    }

    .lawyer-updates-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 24px;
    }

    .lawyer-filter-tabs {
      display: flex;
      gap: 0;
      margin-top: 16px;
    }

    .lawyer-filter-btn {
      padding: 4px 20px;
      background: transparent;
      border: 1px solid var(--lawyer-border);
      cursor: pointer;
      transition: all 0.2s ease;
      min-width: 13%;

      &:first-child {
        border-radius: 4px 0 0 4px;
      }

      &:last-child {
        border-radius: 0 4px 4px 0;
      }

      &:not(:first-child) {
        margin-left: -1px;
      }

      &:hover {
        color: var(--lawyer-primary);
        border-color: var(--lawyer-primary);
      }

      &.lawyer-filter-btn-active {
        color: var(--lawyer-primary);
        border-color: var(--lawyer-primary);
        background: rgba(var(--lawyer-primary-rgb), 0.1);
        z-index: 1;
      }
    }

    .lawyer-update-item {
      border: 1px solid var(--lawyer-border);
      border-radius: 8px;
      padding: 20px;
      display: flex;
      gap: 16px;
      transition: all 0.2s ease;

      &:hover {
        border-color: var(--lawyer-primary);
        background: rgba(var(--lawyer-primary-rgb), 0.02);
      }
    }

    .lawyer-update-icon {
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;

      &.law {
        background: rgba(var(--lawyer-danger-rgb), 0.1);
        color: var(--lawyer-danger);
      }

      &.policy {
        background: rgba(var(--lawyer-primary-rgb), 0.1);
        color: var(--lawyer-primary);
      }

      &.internal {
        background: rgba(16, 185, 129, 0.1);
        color: var(--lawyer-success);
      }
    }

    .lawyer-update-content {
      flex: 1;
    }

    .lawyer-update-title {
      font-size: 18px;
      font-weight: 500;
      margin-bottom: 8px;
      line-height: 1.4;
      color: var(--lawyer-text);
    }

    .lawyer-update-summary {
      color: var(--lawyer-text-light);
      line-height: 1.5;
      margin-bottom: 12px;
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

      // 来源标签 - 绿色
      &.lawyer-tag-source {
        border-color: #52c41a;
        color: #52c41a;
        background-color: rgba(82, 196, 26, 0.1);
      }

      // 默认样式
      &.lawyer-tag-default {
        border-color: #d9d9d9;
        color: #595959;
        background-color: rgba(217, 217, 217, 0.1);
      }
    }

    .lawyer-action-btn {
      padding: 4px 12px;
      border: 1px solid var(--lawyer-border);
      border-radius: 3px;
      background: var(--lawyer-surface);
      color: var(--lawyer-text-light);
      font-size: 12px;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        border-color: var(--lawyer-primary);
        color: var(--lawyer-primary);
      }

      &.lawyer-btn-primary {
        background: var(--lawyer-primary);
        border-color: var(--lawyer-primary);
        color: white;

        &:hover {
          background: var(--lawyer-primary-dark);
          border-color: var(--lawyer-primary-dark);
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

    .lawyer-loading-container {
      text-align: center;
      padding: 40px;
    }

    .lawyer-no-updates {
      text-align: center;
      padding: 40px;
    }
  }
</style>
