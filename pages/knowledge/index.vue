<template>
  <div class="lawyer-page-container">
    <!-- 搜索区域 -->
    <section class="lawyer-search-section">
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

      <!-- 智能搜索提示 -->
      <div class="lawyer-search-mode-info" v-if="isSemanticSearchEnabled">
        <a-icon type="bulb" /> 智能搜索模式已启用 -
        系统将理解您的搜索意图，匹配相关概念和同义词
      </div>

      <!-- 高级筛选选项 -->
      <div class="lawyer-filter-options" v-show="isAdvancedSearchVisible">
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

    <!-- 结果信息 -->
    <div class="lawyer-results-info">
      <template v-if="searchText">
        搜索"<strong>{{ searchText }}</strong
        >"找到 <strong>{{ totalDocuments }}</strong> 条相关信息
      </template>
      <template v-else>
        共找到 <strong>{{ totalDocuments }}</strong> 条相关信息
      </template>
    </div>

    <!-- 加载中 -->
    <div class="lawyer-loading-overlay" v-if="listLoading">
      <a-spin size="large" />
      <h3>正在努力加载中...</h3>
      <p>请稍候，我们正在为您检索信息。</p>
    </div>

    <!-- 无结果提示 -->
    <div
      class="lawyer-no-results"
      v-if="!listLoading && documents.length === 0"
    >
      <h3>未能找到相关结果</h3>
      <p>请尝试调整您的搜索关键词或筛选条件。</p>
    </div>

    <!-- 文档列表 -->
    <div
      class="lawyer-document-list"
      v-if="!listLoading && documents.length > 0"
    >
      <div class="lawyer-document-item" v-for="doc in documents" :key="doc.id">
        <div class="lawyer-document-item-content">
          <div class="lawyer-document-icon">📄</div>
          <div class="lawyer-document-main-content">
            <div class="lawyer-document-header">
              <h3 class="lawyer-document-title">
                <nuxt-link :to="`/document/${doc.id}`">{{
                  doc.title
                }}</nuxt-link>
              </h3>
              <div class="lawyer-document-meta">
                <span><a-icon type="calendar" /> {{ doc.date }}</span>
                <span
                  ><a-icon type="bank" /> {{ doc.source || doc.category }}</span
                >
                <span><a-icon type="eye" /> {{ doc.views }} 阅读</span>
                <span
                  v-if="isSemanticSearchEnabled && doc.semanticScore"
                  class="lawyer-semantic-score"
                >
                  <a-icon type="bulb" /> 相关度:
                  {{ Math.round(doc.semanticScore) }}%
                </span>
              </div>
            </div>
            <p class="lawyer-document-summary">
              {{ doc.description || doc.summary }}
            </p>
            <div class="lawyer-document-footer">
              <div class="lawyer-document-tags">
                <a-tag :color="getTagColor(doc.type || doc.category)">{{
                  getTypeText(doc.type || doc.category)
                }}</a-tag>
                <a-tag
                  v-for="(tag, index) in doc.tags || []"
                  :key="index"
                  color="blue"
                  >{{ tag }}</a-tag
                >
              </div>
              <div class="lawyer-document-actions">
                <a-button
                  v-for="(action, index) in getDocActions(doc)"
                  :key="index"
                  :type="action.type || 'default'"
                  size="small"
                  @click="action.handler"
                >
                  <a-icon :type="action.icon" /> {{ action.text }}
                </a-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div class="lawyer-pagination">
        <a-pagination
          :current="currentPage"
          :total="totalDocuments"
          :pageSize="pageSize"
          @change="onPageChange"
          showQuickJumper
          showSizeChanger
          :pageSizeOptions="['10', '20', '50', '100']"
          @showSizeChange="onShowSizeChange"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
// @ts-nocheck
import { Component, Vue } from "nuxt-property-decorator";
import { DocumentItem } from "@/model/base";

@Component({
  head() {
    return {
      title: "法规与文件大家智库 - 法律合规智能系统",
    };
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
  sortOrder = "date_desc";

  // 智能搜索和收藏相关
  isSemanticSearchEnabled = false;
  isFavoritesMode = false;
  favoriteDocuments: string[] = [];

  // 高级筛选展示状态
  isAdvancedSearchVisible = true;

  // 列表相关
  listLoading = false;
  currentPage = 1;
  pageSize = 10;
  totalDocuments = 36;
  documents: DocumentItem[] = [];

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
        text: "智能搜索",
        icon: "bulb",
        isActive: this.isSemanticSearchEnabled,
        handler: this.toggleSemanticSearch,
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

  // 模拟的语义映射数据（真实项目中可能需要从后端获取）
  semanticMappings = {
    资金: ["资产", "资本", "资金运用", "投资"],
    合规: ["监管", "法规", "规范", "合规管理"],
  };

  // 生命周期钩子
  async mounted() {
    // 从本地存储加载收藏夹文档
    this.loadFavorites();

    // 加载文档数据
    this.loadDocuments();
  }

  // 加载用户收藏的文档
  loadFavorites() {
    try {
      const savedFavorites = localStorage.getItem("favoriteDocuments");
      if (savedFavorites) {
        this.favoriteDocuments = JSON.parse(savedFavorites);
      }
    } catch (error) {
      console.error("加载收藏夹失败", error);
      this.favoriteDocuments = [];
    }
  }

  // 收藏夹文档数量
  get favoriteCount() {
    return this.favoriteDocuments.length;
  }

  // 判断文档是否已被收藏
  isDocumentFavorite(docId: string): boolean {
    return this.favoriteDocuments.includes(docId);
  }

  // 搜索方法
  onSearch() {
    this.searchLoading = true;
    this.listLoading = true;

    // 模拟API请求延迟
    setTimeout(() => {
      // 实际应用需要调用后端API
      this.performSearch();
      this.searchLoading = false;
      this.listLoading = false;
    }, 800);
  }

  // 执行搜索
  performSearch() {
    // 模拟后端搜索和筛选逻辑
    let results = [...this.documents];

    // 筛选收藏文档
    if (this.isFavoritesMode) {
      results = results.filter((doc) =>
        this.favoriteDocuments.includes(doc.id)
      );
    }

    // 关键词搜索
    if (this.searchText) {
      const query = this.searchText.toLowerCase();

      // 根据是否启用智能搜索，使用不同的搜索逻辑
      if (this.isSemanticSearchEnabled) {
        // 语义搜索
        results = results
          .map((doc) => {
            // 计算语义相关度分数
            const semanticScore = this.calculateSemanticScore(doc, query);
            return { ...doc, semanticScore };
          })
          .filter((doc) => doc.semanticScore > 0);

        // 按语义相关度排序
        results.sort((a, b) => b.semanticScore - a.semanticScore);
      } else {
        // 普通搜索
        results = results.filter(
          (doc) =>
            doc.title.toLowerCase().includes(query) ||
            doc.summary.toLowerCase().includes(query) ||
            (doc.tags || []).some((tag) => tag.toLowerCase().includes(query)) ||
            (doc.source || "").toLowerCase().includes(query)
        );
      }
    }

    // 分类筛选
    if (this.filterCategory !== "all") {
      results = results.filter(
        (doc) =>
          doc.category === this.filterCategory ||
          doc.type === this.filterCategory
      );
    }

    // 时间筛选
    if (this.filterDate !== "all") {
      results = this.filterByDate(results, this.filterDate);
    }

    // 来源筛选
    if (this.filterSource !== "all") {
      results = results.filter((doc) => doc.sourceType === this.filterSource);
    }

    // 排序
    results = this.sortDocuments(results, this.sortOrder);

    // 更新结果状态
    this.totalDocuments = results.length;

    // 根据分页计算当前显示的文档
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.documents = results.slice(startIndex, endIndex);
  }

  // 按日期筛选文档
  filterByDate(docs, dateFilter) {
    const now = new Date();
    let cutoffDate = new Date();

    switch (dateFilter) {
      case "last_month":
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case "last_quarter":
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case "last_year":
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return docs;
    }

    return docs.filter((doc) => new Date(doc.date) >= cutoffDate);
  }

  // 计算语义相关度分数
  calculateSemanticScore(doc, query) {
    let score = 0;
    const queryTerms = query.split(/\s+/).filter((term) => term.length > 0);
    const docText = (
      doc.title +
      " " +
      doc.summary +
      " " +
      (doc.tags || []).join(" ")
    ).toLowerCase();

    // 直接匹配
    queryTerms.forEach((term) => {
      if (docText.includes(term)) {
        score += 10;
      }

      // 标题匹配
      if (doc.title.toLowerCase().includes(term)) {
        score += 15;
      }

      // 标签匹配
      if ((doc.tags || []).some((tag) => tag.toLowerCase().includes(term))) {
        score += 8;
      }

      // 同义词匹配
      Object.keys(this.semanticMappings).forEach((key) => {
        if (key.includes(term) || term.includes(key)) {
          score += 3;
          this.semanticMappings[key].forEach((synonym) => {
            if (docText.includes(synonym.toLowerCase())) {
              score += 5;
            }
          });
        }
      });
    });

    // 限制最高分为100
    return Math.min(100, score);
  }

  // 文档排序
  sortDocuments(docs, sortOrder) {
    const sortedDocs = [...docs];

    switch (sortOrder) {
      case "date_desc":
        sortedDocs.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
      case "date_asc":
        sortedDocs.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case "title_asc":
        sortedDocs.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "title_desc":
        sortedDocs.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case "importance":
        sortedDocs.sort((a, b) => b.views - a.views);
        break;
      default:
        break;
    }

    return sortedDocs;
  }

  // 切换智能搜索
  toggleSemanticSearch() {
    this.isSemanticSearchEnabled = !this.isSemanticSearchEnabled;

    // 如果有搜索内容，重新执行搜索
    if (this.searchText) {
      this.onSearch();
    }

    // 提示用户
    this.$message[this.isSemanticSearchEnabled ? "success" : "info"](
      this.isSemanticSearchEnabled
        ? "智能搜索已开启，将使用AI语义匹配"
        : "智能搜索已关闭"
    );
  }

  // 切换收藏夹模式
  toggleFavorites() {
    this.isFavoritesMode = !this.isFavoritesMode;
    this.onSearch();

    this.$message.info(
      this.isFavoritesMode ? "已切换至收藏夹" : "已退出收藏夹模式"
    );
  }

  // 切换高级筛选
  toggleAdvancedSearch() {
    this.isAdvancedSearchVisible = !this.isAdvancedSearchVisible;
  }

  // 查看文档
  viewDocument(docId: string) {
    const doc = this.documents.find((d) => d.id === docId);
    if (doc) {
      this.$message.info(`正在打开: ${doc.title}`);
      setTimeout(() => {
        this.$router.push(`/document/${docId}`);
      }, 500);
    }
  }

  // 下载文档
  downloadDocument(docId: string) {
    const doc = this.documents.find((d) => d.id === docId);
    if (doc) {
      this.$message.info(`正在准备下载: ${doc.title}`);

      // 模拟下载进度
      setTimeout(() => {
        this.$message.success(`下载已开始: ${doc.title}`);
      }, 1500);
    }
  }

  // 收藏/取消收藏文档
  collectDocument(docId: string) {
    const index = this.favoriteDocuments.indexOf(docId);
    const doc = this.documents.find((d) => d.id === docId);

    if (!doc) return;

    if (index === -1) {
      // 添加到收藏
      this.favoriteDocuments.push(docId);
      this.$message.success(`已收藏: ${doc.title}`);
    } else {
      // 从收藏中移除
      this.favoriteDocuments.splice(index, 1);
      this.$message.info(`已取消收藏: ${doc.title}`);

      // 如果在收藏模式下移除了文档，需要刷新列表
      if (this.isFavoritesMode) {
        this.onSearch();
      }
    }

    // 保存到本地存储
    localStorage.setItem(
      "favoriteDocuments",
      JSON.stringify(this.favoriteDocuments)
    );
  }

  // 编辑文档
  editDocument(docId: string, docTitle: string) {
    this.$message.info(`准备编辑文档: ${docTitle}`);
    // 实际项目中可能会跳转到编辑页面或打开编辑对话框
  }

  // 移除文档
  removeDocument(docId: string) {
    const doc = this.documents.find((d) => d.id === docId);
    if (!doc) return;

    this.$confirm({
      title: "确定要移除文档吗？",
      content: `文档"${doc.title}"将被移除，此操作不可撤销。`,
      okText: "确认",
      cancelText: "取消",
      onOk: () => {
        // 移除文档
        this.documents = this.documents.filter((d) => d.id !== docId);
        this.$message.success(`文档"${doc.title}"已移除`);

        // 如果文档在收藏夹中，也应该从收藏夹移除
        const index = this.favoriteDocuments.indexOf(docId);
        if (index !== -1) {
          this.favoriteDocuments.splice(index, 1);
          localStorage.setItem(
            "favoriteDocuments",
            JSON.stringify(this.favoriteDocuments)
          );
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
  getTagColor(type: string): string {
    if (!type) return "blue";
    const colorMap: Record<string, string> = {
      law: "red",
      policy: "orange",
      case: "green",
      guide: "purple",
      internal: "green",
      interpretation: "cyan",
    };
    return colorMap[type] || "blue";
  }

  // 获取类型文本
  getTypeText(type: string): string {
    if (!type) return "其他";
    const textMap: Record<string, string> = {
      law: "法律法规",
      policy: "监管政策",
      case: "典型案例",
      guide: "合规指南",
      internal: "内部规章",
      interpretation: "司法解读",
    };
    return textMap[type] || "其他";
  }

  // 获取文档操作按钮
  getDocActions(doc: DocumentItem) {
    const isFavorite = this.isDocumentFavorite(doc.id);
    return [
      {
        icon: "eye",
        text: "查看",
        handler: () => this.viewDocument(doc.id),
      },
      {
        icon: "download",
        text: "下载",
        handler: () => this.downloadDocument(doc.id),
      },
      {
        type: isFavorite ? "primary" : "default",
        icon: isFavorite ? "check" : "star",
        text: isFavorite ? "已收藏" : "收藏",
        handler: () => this.collectDocument(doc.id),
      },
      {
        icon: "edit",
        text: "编辑",
        handler: () => this.editDocument(doc.id, doc.title),
      },
      {
        icon: "delete",
        text: "移除",
        handler: () => this.removeDocument(doc.id),
      },
    ];
  }

  // 加载文档数据
  async loadDocuments() {
    this.listLoading = true;

    try {
      // 模拟异步请求
      const mockData = [
        {
          id: "1",
          title: "保险资金股权投资管理暂行办法",
          summary:
            "规范保险资金股权投资行为，防范投资风险，保护被保险人利益。明确股权投资的基本原则、投资范围、投资比例等核心要求...",
          date: "2024-01-15",
          source: "金融监管总局",
          sourceType: "regulator",
          views: 2156,
          tags: ["法律法规", "资金运用"],
          category: "law",
          type: "law",
        },
        {
          id: "2",
          title: "偿付能力监管规则第1号：保险公司偿付能力充足率",
          summary:
            "建立健全偿付能力监管制度，规范保险公司偿付能力计算标准，确保保险公司具备与其风险相适应的资本水平...",
          date: "2024-01-10",
          source: "金融监管总局",
          sourceType: "regulator",
          views: 1845,
          tags: ["监管规则", "偿付能力"],
          category: "law",
          type: "law",
        },
        {
          id: "3",
          title: "关联交易管理办法（2022年修订）",
          summary:
            "加强保险公司关联交易监管，规范关联交易行为，防控关联交易风险，保护保险消费者合法权益和保险公司稳健经营...",
          date: "2023-12-28",
          source: "金融监管总局",
          sourceType: "regulator",
          views: 3267,
          tags: ["管理办法", "关联交易"],
          category: "policy",
          type: "policy",
        },
        {
          id: "4",
          title: "保险公司信息披露管理办法",
          summary:
            "规范保险公司信息披露行为，保护投保人、被保险人和受益人的合法权益，促进保险市场健康发展...",
          date: "2023-12-15",
          source: "金融监管总局",
          sourceType: "regulator",
          views: 1523,
          tags: ["管理办法", "信息披露"],
          category: "policy",
          type: "policy",
        },
        {
          id: "5",
          title: "保险资产管理公司管理规定",
          summary:
            "规范保险资产管理公司经营行为，加强监督管理，促进保险资产管理行业健康发展，更好服务保险业和实体经济发展...",
          date: "2023-11-30",
          source: "金融监管总局",
          sourceType: "regulator",
          views: 987,
          tags: ["管理规定", "资产管理"],
          category: "policy",
          type: "policy",
        },
      ];

      await new Promise((r) => setTimeout(r, 1200));
      this.documents = mockData;
    } catch (error) {
      console.error("加载文档数据失败", error);
      this.$message.error("加载数据失败，请刷新页面重试");
    } finally {
      this.listLoading = false;
    }
  }
}
</script>

<style lang="less" scoped>
// 公共卡片样式
.lawyer-card {
  background: var(--lawyer-surface);
  padding: 24px;
  border-radius: 8px;
  border: 1px solid var(--lawyer-border);
}

// 搜索区域
.lawyer-search-section {
  &:extend(.lawyer-card);
  margin-bottom: 24px;

  h1 {
    font-size: 28px;
    font-weight: 600;
    color: var(--lawyer-text);
    margin-bottom: 12px;
  }

  p {
    color: var(--lawyer-text-light);
    margin-bottom: 24px;
    font-size: 16px;
  }
}

// 搜索表单
.lawyer-search-form {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 24px;

  .lawyer-search-input {
    flex: 1;
    min-width: 250px;
  }

  .lawyer-search-btn {
    background-color: var(--lawyer-primary);
    border-color: var(--lawyer-primary);

    &:hover,
    &:focus {
      background-color: var(--lawyer-primary-dark);
      border-color: var(--lawyer-primary-dark);
    }
  }
}

// 按钮激活状态
.lawyer-btn-active {
  background-color: var(--lawyer-primary);
  color: white;
  border-color: var(--lawyer-primary);
}

// 智能搜索信息
.lawyer-search-mode-info {
  background-color: rgba(245, 158, 11, 0.1);
  color: var(--lawyer-primary-dark);
  padding: 12px 16px;
  border-radius: 4px;
  font-size: 14px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
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
  font-size: 14px;
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
  &:extend(.lawyer-card);
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

// 文档项
.lawyer-document-item {
  &:extend(.lawyer-card);
  transition: background-color 0.2s ease;

  &:hover {
    background-color: rgba(var(--lawyer-primary-rgb), 0.03);
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
  color: var(--lawyer-primary-dark);
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

    .anticon {
      margin-right: 6px;
    }
  }

  &-summary {
    font-size: 14px;
    color: var(--lawyer-text-light);
    line-height: 1.6;
    margin-bottom: 16px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
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

    .ant-btn .anticon {
      font-size: 12px;
    }
  }
}

.lawyer-semantic-score {
  color: var(--lawyer-success);
  font-weight: 600;
}

// 分页
.lawyer-pagination {
  display: flex;
  justify-content: center;
  padding: 32px 0;
}
</style>
