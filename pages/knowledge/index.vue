<template>
  <div class="knowledge-page-wrapper">
    <div>
      <!-- 整体内容容器 -->
      <div class="lawyer-content-wrapper">
        <!-- 搜索区域 -->
        <section>
          <h1>法规与文件大家智库</h1>
          <p>
            搜索和浏览法律法规、政策文件、典型案例和解读材料，获取最新的合规信息和专业指导。
          </p>

          <div class="lawyer-search-form">
            <a-input
              placeholder="输入关键词搜索法规、案例、解读..."
              size="large"
              v-model="searchText"
              class="lawyer-search-input"
              @keyup.enter="onSearch"
            />
            <a-button
              v-for="(btn, index) in searchButtons"
              :key="index"
              :type="btn.isActive ? 'primary' : btn.type || 'default'"
              :icon="btn.icon"
              size="large"
              :loading="btn.loading"
              @click="btn.handler"
              :class="{ 'lawyer-btn-active': btn.isActive }"
            >
              {{ btn.text }}{{ btn.count ? ` (${btn.count})` : "" }}
            </a-button>
          </div>

          <!-- 高级筛选选项 -->
          <div class="lawyer-filter-options" v-show="isAdvancedSearchVisible">
            <!-- 时效性选择器 -->
            <div class="lawyer-filter-group">
              <a-select
                v-model="effectivenessFilter"
                style="width: 100%"
                placeholder="时效性"
                @change="onSearch"
              >
                <a-select-option
                  v-for="option in effectivenessOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </a-select-option>
              </a-select>
            </div>
            <!-- 专题分类级联选择器 -->
            <div class="lawyer-filter-group">
              <a-cascader
                v-model="topicCategory"
                :options="topicCategoryOptions"
                placeholder="专题分类"
                style="width: 100%"
                @change="onSearch"
                :show-search="true"
              />
            </div>
            <div
              class="lawyer-filter-group"
              v-for="(filter, index) in filterOptions"
              :key="index"
            >
              <a-select
                v-model="filter.value"
                style="width: 100%"
                :placeholder="filter.placeholder"
                @change="onSearch"
              >
                <a-select-option
                  v-for="option in filter.options"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </a-select-option>
              </a-select>
            </div>
          </div>
        </section>

        <!-- 加载中 -->
        <div class="lawyer-loading-overlay" v-if="listLoading">
          <a-spin size="large" />
          <h3>正在努力加载中...</h3>
          <p>请稍候，我们正在为您检索信息。</p>
        </div>

        <!-- 无结果提示 -->
        <div class="lawyer-no-results" v-if="!listLoading && !documents.length">
          <h3>未能找到相关结果</h3>
          <p>请尝试调整您的搜索关键词或筛选条件。</p>
        </div>

        <!-- 文档列表 -->
        <div
          class="lawyer-document-list"
          v-if="!listLoading && documents.length"
        >
          <div
            class="lawyer-document-item"
            v-for="doc in documents"
            :key="doc.id"
          >
            <div class="lawyer-document-item-content">
              <div class="lawyer-document-icon">📄</div>
              <div class="lawyer-document-main-content">
                <div class="lawyer-document-header">
                  <h3 class="lawyer-document-title">
                    <nuxt-link :to="`/document/${doc.id}`">{{
                      doc.ruleName
                    }}</nuxt-link>
                  </h3>
                  <div class="lawyer-document-meta">
                    <span
                      ><a-icon type="calendar" /> {{ doc.publishDateStr }}</span
                    >
                    <span><a-icon type="bank" /> {{ doc.websiteName }}</span>
                    <span><a-icon type="eye" /> {{ doc.readCount }} 阅读</span>
                    <span class="lawyer-timeliness-tag">
                      <a-icon type="clock-circle" /> {{ doc.timeLiness }}
                    </span>
                  </div>
                </div>
                <p class="lawyer-document-summary">
                  {{ doc.fileContent || doc.summary || "暂无摘要" }}
                </p>
                <div class="lawyer-document-footer">
                  <div class="lawyer-document-tags">
                    <a-tag :color="getTagColor(doc.categoryMain, 'main')">{{
                      doc.categoryMain
                    }}</a-tag>
                    <a-tag
                      v-if="doc.categorySub"
                      :color="getTagColor(doc.categorySub, 'sub')"
                      >{{ doc.categorySub }}</a-tag
                    >
                    <a-tag v-if="doc.effectivenessLevel" color="green">{{
                      doc.effectivenessLevel
                    }}</a-tag>
                  </div>
                  <div class="lawyer-document-actions">
                    <a-button
                      v-for="(action, index) in getDocActions(doc)"
                      :key="index"
                      :type="action.type || 'default'"
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
          <div class="lawyer-pagination" v-if="documents.length">
            <a-pagination
              :current="currentPage"
              :total="totalDocuments"
              :pageSize="pageSize"
              show-size-changer
              show-quick-jumper
              @change="onPageChange"
              @showSizeChange="onShowSizeChange"
            />
          </div>
        </div>
      </div>

      <!-- 文件上传组件 -->
      <FileUploadModal
        :visible="uploadModalVisible"
        :title="`更新文档: ${currentUploadDocTitle}`"
        :document-id="currentUploadDocId"
        :document-title="currentUploadDocTitle"
        :config="uploadConfig"
        @cancel="handleUploadCancel"
        @complete="handleUploadComplete"
        @upload-success="handleUploadSuccess"
      />
    </div>
  </div>
</template>

<script lang="ts">
// @ts-nocheck
import { Component, Vue } from "nuxt-property-decorator";
import { DocumentItem } from "@/model/base";
import { KnowledgeDataItem } from "@/model/LawyerModel";
import { cascaderOptions } from "@/enum/Category";
import FileUploadModal from "@/components/common/FileUploadModal.vue";
import { downloadFile } from "~/utils/downloadHelper";

@Component({
  components: {
    FileUploadModal,
  },
})
export default class KnowledgePage extends Vue {
  // 搜索相关
  searchText = "";
  searchLoading = false;

  // 筛选相关
  filterCategory = "all";
  filterDate = "all";
  filterSource = "all";
  sortOrder = "";

  // 新增的筛选项
  topicCategory = [];
  effectivenessFilter = "all";

  // 收藏相关
  isFavoritesMode = false;
  favoriteDocuments: string[] = [];

  // 高级筛选展示状态
  isAdvancedSearchVisible = false;

  // 列表相关
  listLoading = false;
  currentPage = 1;
  pageSize = 10;
  totalDocuments = 36;
  documents: KnowledgeDataItem[] = [];

  // 上传相关
  uploadModalVisible = false;
  currentUploadDocId = "";
  currentUploadDocTitle = "";

  // 上传配置
  get uploadConfig() {
    return {
      multiple: false,
      acceptTypes: ".doc,.docx",
      maxFileSize: 50 * 1024 * 1024, // 50MB
      maxFileCount: 1,
      uploadText: "点击或拖拽文件到此区域上传",
      hintText: "支持 DOC、DOCX 格式，文件大小不超过 50MB",
      autoUpload: false,
    };
  }

  // 搜索按钮数据
  get searchButtons() {
    return [
      {
        text: "搜索",
        icon: "search",
        type: "primary",
        loading: this.searchLoading,
        isActive: false,
        handler: this.onSearch,
      },
      {
        text: "我的收藏",
        icon: "star",
        isActive: this.isFavoritesMode,
        handler: this.toggleFavorites,
        count: this.favoriteCount,
      },
      {
        text: this.isAdvancedSearchVisible ? "收起筛选" : "高级筛选",
        icon: "filter",
        isActive: this.isAdvancedSearchVisible,
        handler: this.toggleAdvancedSearch,
      },
    ];
  }

  // 专题分类级联选项
  get topicCategoryOptions() {
    return cascaderOptions;
  }

  // 时效性选项
  get effectivenessOptions() {
    return [
      { value: "all", label: "全部" },
      { value: "effective", label: "现行有效" },
      { value: "abolished", label: "已废止" },
      { value: "pending", label: "尚未生效" },
      { value: "modified", label: "已修订" },
    ];
  }

  // 筛选选项数据
  get filterOptions() {
    return [
      {
        value: this.filterCategory,
        placeholder: "全部分类",
        options: [
          { value: "all", label: "全部分类" },
          { value: "law", label: "法律法规" },
          { value: "policy", label: "监管政策" },
          { value: "interpretation", label: "司法解读" },
          { value: "case", label: "典型案例" },
          { value: "internal", label: "内部规章" },
        ],
      },
      {
        value: this.filterDate,
        placeholder: "全部时间",
        options: [
          { value: "all", label: "全部时间" },
          { value: "last_month", label: "近一月" },
          { value: "last_quarter", label: "近一季度" },
          { value: "last_year", label: "近一年" },
        ],
      },
      {
        value: this.filterSource,
        placeholder: "全部来源",
        options: [
          { value: "all", label: "全部来源" },
          { value: "regulator", label: "监管机构" },
          { value: "court", label: "法院" },
          { value: "industry_assoc", label: "行业协会" },
          { value: "internal_legal", label: "内部法务" },
        ],
      },
      {
        value: this.sortOrder,
        placeholder: "排序方式",
        options: [
          { value: "date_desc", label: "按发布日期 (新→旧)" },
          { value: "date_asc", label: "按发布日期 (旧→新)" },
          { value: "title_asc", label: "按标题 (A→Z)" },
          { value: "title_desc", label: "按标题 (Z→A)" },
          { value: "importance", label: "按重要性" },
        ],
      },
    ];
  }

  // 生命周期钩子
  async mounted() {
    // 加载文档数据
    this.loadDocuments();
  }

  // 收藏夹文档数量
  get favoriteCount() {
    // 如果不在收藏模式下，返回已知的收藏数量
    // 如果在收藏模式下，返回当前文档列表的数量
    return this.isFavoritesMode
      ? this.documents.length
      : this.favoriteDocuments.length;
  }

  // 判断文档是否已被收藏
  isDocumentFavorite(docId: string): boolean {
    return this.favoriteDocuments.includes(docId);
  }

  // 搜索方法
  async onSearch() {
    this.searchLoading = true;

    try {
      // 调用loadDocuments来获取数据
      await this.loadDocuments();
    } catch (error) {
      console.error("搜索失败:", error);
    } finally {
      this.searchLoading = false;
    }
  }

  // 切换收藏夹模式
  async toggleFavorites() {
    this.isFavoritesMode = !this.isFavoritesMode;
    this.currentPage = 1; // 重置到第一页

    // 重新加载数据，loadDocuments方法会根据isFavoritesMode状态决定是否传empId参数
    await this.loadDocuments();

    this.$message.info(
      this.isFavoritesMode ? "已切换至收藏夹" : "已退出收藏夹模式"
    );
  }

  // 切换高级筛选
  toggleAdvancedSearch() {
    this.isAdvancedSearchVisible = !this.isAdvancedSearchVisible;
  }

  // 获取文档操作按钮
  getDocActions(doc: KnowledgeDataItem) {
    const isFavorite = this.isDocumentFavorite(doc.id);
    return [
      {
        text: "查看",
        type: "primary",
        handler: () => this.viewDocument(doc),
      },
      {
        text: "下载",
        handler: () => this.downloadDocument(doc),
      },
      {
        type: isFavorite ? "primary" : "default",
        text: isFavorite ? "已收藏" : "收藏",
        handler: () => this.collectDocument(doc),
      },
      {
        text: "上传更新",
        handler: () => this.uploadDocument(doc.id, doc.ruleName),
      },
      {
        text: "移除",
        type: "danger",
        handler: () => this.removeDocument(doc),
      },
    ];
  }

  // 查看文档
  viewDocument(doc: KnowledgeDataItem) {
    this.$message.info(`正在打开: ${doc.ruleName}`);
    setTimeout(() => {
      // 根据文档的废止状态传递isRevoke参数
      const isRevoke = !!(doc.revokeDateTimestamp || doc.revokeDateStr);
      const query = isRevoke ? { isRevoke: "true" } : {};

      this.$router.push({
        path: `/document/${doc.id}`,
        query,
      });
    }, 500);
  }

  // 下载文档
  async downloadDocument(doc: KnowledgeDataItem): Promise<void> {
    await downloadFile(
      (params) => this.$service.lawyer.downloadRuleFile(params),
      { searchId: doc.id },
      doc.ruleName,
      this.$message
    );
  }

  // 收藏/取消收藏文档
  async collectDocument(doc: KnowledgeDataItem) {
    const isCurrentlyFavorite = this.isDocumentFavorite(doc.id);
    const newCollectStatus = !isCurrentlyFavorite;

    try {
      // 调用后端接口
      const params = {
        searchId: doc.id,
        empId: "DJ101015", // 使用硬编码ID
        id: doc.id,
        isCollect: newCollectStatus,
      };

      console.log("收藏参数:", params);

      const success = await this.$service.lawyer.saveOrCancelCollect(params);

      if (success) {
        if (newCollectStatus) {
          // 添加到收藏
          this.favoriteDocuments.push(doc.id);
          this.$message.success(`已收藏: ${doc.ruleName}`);
        } else {
          // 从收藏中移除
          const index = this.favoriteDocuments.indexOf(doc.id);
          if (index !== -1) {
            this.favoriteDocuments.splice(index, 1);
          }
          this.$message.info(`已取消收藏: ${doc.ruleName}`);

          // 如果在收藏模式下移除了文档，需要刷新列表
          if (this.isFavoritesMode) {
            // 重新加载收藏列表
            this.loadDocuments();
          }
        }
      } else {
        this.$message.error("操作失败，请重试");
      }
    } catch (error) {
      console.error("收藏操作失败:", error);
      this.$message.error("操作失败，请重试");
    }
  }

  // 上传更新文档
  uploadDocument(docId: string, docTitle: string) {
    this.uploadModalVisible = true;
    this.currentUploadDocId = docId;
    this.currentUploadDocTitle = docTitle;
  }

  // 处理上传取消
  handleUploadCancel() {
    this.uploadModalVisible = false;
    this.currentUploadDocId = "";
    this.currentUploadDocTitle = "";
  }

  // 处理上传完成
  handleUploadComplete() {
    this.uploadModalVisible = false;
    this.currentUploadDocId = "";
    this.currentUploadDocTitle = "";
  }

  // 处理上传成功
  handleUploadSuccess(data: any) {
    // 不在这里显示消息，因为组件内部已经处理了
    // 这里可以刷新文档列表或更新特定文档的信息
    this.loadDocuments();
  }

  // 移除文档
  removeDocument(doc: KnowledgeDataItem) {
    this.$confirm({
      title: "确定要移除文档吗？",
      content: `文档"${doc.ruleName}"将被移除，此操作不可撤销。`,
      okText: "确认",
      cancelText: "取消",
      onOk: async () => {
        try {
          // 调用后端删除接口
          const success = await this.$service.lawyer.deleteRuleSource({
            id: doc.id,
          });

          if (success) {
            this.$message.success(`文档"${doc.ruleName}"已移除`);
            // 添加延迟确保后端数据已更新，然后重新获取数据
            setTimeout(async () => {
              await this.loadDocuments();
            }, 500);
          } else {
            this.$message.error("删除失败，请重试");
          }
        } catch (error) {
          console.error("删除文档失败:", error);
          this.$message.error("删除失败，请重试");
        }
      },
    });
  }

  // 分页变化
  onPageChange(page: number) {
    this.currentPage = page;
    this.onSearch();
  }

  // 每页条数变化
  onShowSizeChange(current, pageSize) {
    this.pageSize = pageSize;
    this.currentPage = 1;
    this.onSearch();
  }

  // 获取标签颜色
  getTagColor(category: string, type: string = "main"): string {
    if (!category) return "blue";

    // 简化颜色逻辑，只使用两种颜色
    // 一级分类使用金黄色，二级分类使用蓝色
    return type === "main" ? "gold" : "blue";
  }

  // 获取类型文本
  getTypeText(category: string): string {
    if (!category) return "其他";
    return category || "其他";
  }

  // 加载文档数据
  async loadDocuments() {
    this.listLoading = true;

    try {
      // 构建查询参数
      const params = {
        condition: this.searchText || "",
        category: this.filterCategory !== "all" ? this.filterCategory : "",
        source: this.filterSource !== "all" ? this.filterSource : "",
        sortOrder: this.sortOrder,
      };

      // 如果是收藏模式，添加empId参数
      if (this.isFavoritesMode) {
        // 直接使用硬编码的ID，避免依赖store
        params.empId = "DJ101015";
      }

      console.log("查询参数:", params);

      // 调用真实API获取数据
      const result = await this.$service.lawyer.getRuleSourceList(params);
      console.log("获取到的数据:", result);

      if (result && Array.isArray(result)) {
        this.documents = result;
        this.totalDocuments = result.length;
      } else {
        this.documents = [];
        this.totalDocuments = 0;
      }
    } catch (error) {
      console.error("加载文档数据失败", error);
      this.$message.error("加载数据失败，请刷新页面重试");
      this.documents = [];
      this.totalDocuments = 0;
    } finally {
      this.listLoading = false;
    }
  }

  head() {
    return {
      title: "法规与文件大家智库 - 法律合规智能系统",
    };
  }
}
</script>

<style lang="less">
.knowledge-page-wrapper {
  // 整个页面的灰色背景

  background-color: var(--lawyer-background);
  padding: 20px;
  // 整体内容容器 - 主要的白色卡片背景
  .lawyer-content-wrapper {
    padding: 20px;
    border-radius: 8px;
    border: 1px solid var(--lawyer-border);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    margin-bottom: 24px;
    background-color: var(--lawyer-surface);
  }

  // 搜索表单
  .lawyer-search-form {
    display: flex;
    gap: 12px;
    align-items: center;
    margin-bottom: 24px;

    // 搜索输入框
    .lawyer-search-input {
      flex: 1;
      min-width: 300px;
    }

    // 按钮样式
    .lawyer-search-form .ant-btn {
      flex-shrink: 0;

      &.lawyer-btn-active {
        background-color: var(--lawyer-primary);
        color: white;
        border-color: var(--lawyer-primary);
      }
    }
  }

  // 筛选选项
  .lawyer-filter-options {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    margin-bottom: 24px;

    .lawyer-filter-group {
      flex: 1;
      flex-basis: 200px;
    }
  }

  // 结果信息
  .lawyer-results-info {
    color: var(--lawyer-text-light);
    margin-bottom: 24px;
    padding: 12px 16px;
    background: var(--lawyer-surface);
    border-radius: 4px;
    border: 1px solid var(--lawyer-border-light);
    font-weight: 500;
  }

  // 加载中和无结果状态
  .lawyer-loading-overlay,
  .lawyer-no-results {
    text-align: center;
    padding: 32px;
    color: var(--lawyer-text-light);
    background: var(--lawyer-surface);
    border-radius: 8px;
    border: 1px solid var(--lawyer-border);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    margin-top: 32px;

    h3 {
      font-size: 20px;
      color: var(--lawyer-text);
      margin-bottom: 12px;
      font-weight: 500;
    }
  }

  // 文档列表
  .lawyer-document-list {
    display: flex;
    flex-direction: column;
    gap: 24px;
    margin-bottom: 32px;
  }

  // 文档项 - 每个文档的独立卡片样式
  .lawyer-document-item {
    background: var(--lawyer-surface);
    padding: 24px;
    border-radius: 8px;
    border: 1px solid var(--lawyer-border);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    transition: background-color 0.2s ease, box-shadow 0.2s ease;

    &:hover {
      background-color: rgba(var(--lawyer-primary-rgb), 0.03);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    &-content {
      display: flex;
      gap: 20px;
      align-items: flex-start;
    }
  }

  // 文档图标
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

  // 文档主内容
  .lawyer-document-main-content {
    flex: 1;
    min-width: 0;
  }

  // 文档标题和元数据
  .lawyer-document {
    &-header {
      margin-bottom: 12px;
    }

    &-title {
      font-size: 18px;
      font-weight: 500;
      color: var(--lawyer-text);
      margin-bottom: 8px;
      line-height: 1.4;

      a {
        text-decoration: none;
        color: inherit;
        transition: color 0.2s ease;

        &:hover {
          color: var(--lawyer-primary-dark);
        }
      }
    }

    &-meta {
      font-size: 13px;
      color: var(--lawyer-text-light);
      display: flex;
      flex-wrap: wrap;
      gap: 8px 16px;
      margin-bottom: 12px;

      .lawyer-document-meta .anticon {
        margin-right: 6px;
      }
    }

    &-summary {
      color: var(--lawyer-text-light);
      line-height: 1.6;
      margin-bottom: 16px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    &-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 8px;
    }

    &-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      flex: 1;
    }

    &-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;

      .lawyer-document-actions .ant-btn .anticon {
        font-size: 12px;
      }
    }
  }

  // 分页
  .lawyer-pagination {
    display: flex;
    justify-content: center;
    padding: 32px 0;
  }
}
</style>
