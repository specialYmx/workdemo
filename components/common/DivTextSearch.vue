<template>
  <div class="lawyer-div-text-search-container">
    <div class="lawyer-search-bar">
      <div class="lawyer-search-box">
        <input
          type="text"
          v-model="searchTerm"
          placeholder="搜索..."
          @keyup.enter="onSearch"
          class="lawyer-detail-search-input"
        />
        <a-button
          v-if="searchTerm"
          @click="clearSearch"
          type="link"
          class="lawyer-clear-button"
          icon="close"
          size="small"
        />
        <a-button
          @click="onSearch"
          type="primary"
          icon="search"
          class="lawyer-search-button"
        />
      </div>
      <div class="lawyer-match-count">
        <span v-if="highlightCount === 0">0 个匹配项</span>
        <span v-else
          >{{ currentIndex + 1 }} / {{ highlightCount }} 个匹配项</span
        >
      </div>
    </div>
    <div class="lawyer-content-area" ref="contentArea">
      <div ref="searchableContent">
        <slot />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";

@Component({
  name: "DivTextSearch",
})
export default class DivTextSearch extends Vue {
  searchTerm: string = "";
  lastSearchTerm: string = "";
  highlightCount: number = 0;
  currentIndex: number = -1;
  highlightSpans: HTMLSpanElement[] = [];
  private observer: MutationObserver | null = null;

  mounted() {
    this.initMutationObserver();
  }

  beforeDestroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  // 初始化 DOM 变化监听器
  initMutationObserver() {
    const content = this.$refs.searchableContent as HTMLElement;
    this.observer = new MutationObserver(() => {
      // 如果用户正在搜索，需要重新高亮
      if (this.searchTerm && this.lastSearchTerm) {
        // 暂时断开观察器，避免高亮操作触发无限循环
        if (this.observer) this.observer.disconnect();

        // 重新高亮当前搜索词
        this.clearHighlights();
        this.highlightAll();

        // 尝试保持当前搜索位置
        if (this.highlightSpans.length > 0) {
          // 确保当前索引在有效范围内
          if (this.currentIndex >= this.highlightSpans.length) {
            this.currentIndex = 0;
          }
          this.updateCurrentHighlight();
        } else {
          this.currentIndex = -1;
        }

        // 重新启动观察器
        if (this.observer) {
          this.observer.observe(content, { childList: true, subtree: true });
        }
      }
    });

    // 开始观察 DOM 变化
    this.observer.observe(content, { childList: true, subtree: true });
  }

  // 转义正则特殊字符
  escapeRegExp(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // 清除所有高亮
  clearHighlights() {
    const content = this.$refs.searchableContent as HTMLElement;
    const highlights = content.querySelectorAll(
      ".lawyer-highlight, .lawyer-current-highlight"
    );
    highlights.forEach((span) => {
      const parent = span.parentNode;
      if (parent) {
        const textNode = document.createTextNode(span.textContent || "");
        parent.replaceChild(textNode, span);
      }
    });
    content.normalize();
  }

  // 高亮所有匹配项
  highlightAll() {
    this.highlightSpans = [];
    if (!this.searchTerm) return;

    const regex = new RegExp(this.escapeRegExp(this.searchTerm), "gi");
    const content = this.$refs.searchableContent as HTMLElement;
    const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
    const nodesToProcess: Text[] = [];

    let node: Text | null;
    while ((node = walker.nextNode() as Text | null)) {
      if (regex.test(node.nodeValue || "")) {
        nodesToProcess.push(node);
      }
    }

    nodesToProcess.forEach((textNode) => {
      const text = textNode.nodeValue || "";
      const fragment = document.createDocumentFragment();
      let lastIndex = 0;
      let match: RegExpExecArray | null;

      regex.lastIndex = 0;
      while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
          fragment.appendChild(
            document.createTextNode(text.slice(lastIndex, match.index))
          );
        }

        const span = document.createElement("span");
        span.className = "lawyer-highlight";
        span.textContent = match[0];
        fragment.appendChild(span);
        this.highlightSpans.push(span);
        lastIndex = regex.lastIndex;
      }

      if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
      }

      const parent = textNode.parentNode;
      if (parent) {
        parent.replaceChild(fragment, textNode);
      }
    });

    this.highlightCount = this.highlightSpans.length;
  }

  // 更新当前高亮项
  updateCurrentHighlight() {
    this.highlightSpans.forEach((span) =>
      span.classList.remove("lawyer-current-highlight")
    );

    if (this.highlightSpans.length === 0) return;

    if (
      this.currentIndex < 0 ||
      this.currentIndex >= this.highlightSpans.length
    ) {
      this.currentIndex = 0;
    }

    const currentSpan = this.highlightSpans[this.currentIndex];
    currentSpan.classList.add("lawyer-current-highlight");
    currentSpan.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  // 搜索/循环跳转
  onSearch() {
    if (!this.searchTerm) {
      this.resetSearch();
      return;
    }

    if (this.searchTerm !== this.lastSearchTerm) {
      this.clearHighlights();
      this.highlightAll();
      this.currentIndex = 0;
      this.lastSearchTerm = this.searchTerm;
    } else if (this.highlightSpans.length > 0) {
      this.currentIndex = (this.currentIndex + 1) % this.highlightSpans.length;
    }

    if (this.highlightSpans.length > 0) {
      this.updateCurrentHighlight();
    } else {
      this.currentIndex = -1;
    }
  }

  // 重置搜索状态
  resetSearch() {
    this.clearHighlights();
    this.highlightSpans = [];
    this.highlightCount = 0;
    this.currentIndex = -1;
    this.lastSearchTerm = "";
  }

  // 清空搜索
  clearSearch() {
    this.searchTerm = "";
    this.resetSearch();
  }

  // 清空时自动清除高亮
  @Watch("searchTerm")
  onSearchTermChange(newVal: string) {
    if (!newVal) {
      this.resetSearch();
    }
  }
}
</script>

<style>
.lawyer-div-text-search-container {
  background: var(--lawyer-surface);
  overflow: hidden;
}

.lawyer-search-bar {
  position: sticky;
  top: 0;
  width: 100%;
  z-index: 100;
  background: var(--lawyer-surface);
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px 0 5px 0;
}

.lawyer-search-box {
  flex: 1;
  min-width: 200px;
  display: flex;
  background: var(--lawyer-surface);
  border: 1px solid var(--lawyer-border);
  margin-left: 10px;
  align-items: center;
}

.lawyer-detail-search-input {
  flex: 1;
  border: none;
  padding: 6px 10px;
  outline: none;
  background: transparent;
  color: var(--lawyer-text);
}

.lawyer-search-button {
  border-radius: 0 !important;
}

.lawyer-clear-button {
  color: var(--lawyer-text-light);
  padding: 0 !important;
  margin-right: 4px;
}

.lawyer-match-count {
  color: var(--lawyer-text-light);
  padding: 6px 10px;
  min-width: 100px;
  text-align: center;
  margin-right: 10px;
}

.lawyer-content-area {
  padding: 10px;
  min-height: 300px;
  max-height: calc(100vh - 300px);
  overflow-y: auto;
  position: relative;
}

.lawyer-highlight {
  background-color: #ffeb3b;
  color: var(--lawyer-text);
  font-weight: bold;
  padding: 0 2px;
}

.lawyer-current-highlight {
  background-color: var(--lawyer-warning) !important;
  animation: lawyer-pulse 1.5s infinite;
}

@keyframes lawyer-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7);
  }
  70% {
    box-shadow: 0 0 0 4px rgba(245, 158, 11, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(245, 158, 11, 0);
  }
}
</style>
