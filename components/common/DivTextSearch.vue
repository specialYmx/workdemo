<template>
  <div class="lawyer-div-text-search-container">
    <div class="lawyer-search-bar">
      <div class="lawyer-search-box">
        <input
          type="text"
          v-model="searchTerm"
          placeholder="搜索..."
          @keyup.enter="onSearch"
          ref="searchInput"
          class="lawyer-search-input"
        />
        <button
          v-if="searchTerm"
          @click="clearSearch"
          class="lawyer-clear-button"
        >
          <span>&times;</span>
        </button>
        <button @click="onSearch" class="lawyer-search-button">搜索</button>
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
    (this.$refs.searchInput as HTMLInputElement).focus();
    const content = this.$refs.searchableContent as HTMLElement;
    this.observer = new MutationObserver(() => {
      // 断开 observer，防止高亮操作引发死循环
      if (this.observer) this.observer.disconnect();
      this.clearHighlights();
      this.highlightAll();
      if (this.highlightSpans.length > 0) {
        this.currentIndex = 0;
        this.updateCurrentHighlight();
      } else {
        this.currentIndex = -1;
      }
      // 重新监听
      if (this.observer)
        this.observer.observe(content, { childList: true, subtree: true });
    });
    this.observer.observe(content, { childList: true, subtree: true });
  }

  beforeDestroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  // 转义正则特殊字符
  escapeRegExp(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // 清除所有高亮
  clearHighlights() {
    const content = this.$refs.searchableContent as HTMLElement;
    const highlights = content.querySelectorAll(
      "span.lawyer-highlight, span.lawyer-current-highlight"
    );
    highlights.forEach((span) => {
      const textNode = document.createTextNode(span.textContent || "");
      span.parentNode && span.parentNode.replaceChild(textNode, span);
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
    let node: Text | null;
    const nodesToProcess: Text[] = [];
    while ((node = walker.nextNode() as Text | null)) {
      if (regex.test(node.nodeValue || "")) {
        nodesToProcess.push(node);
      }
    }
    nodesToProcess.forEach((node) => {
      const text = node.nodeValue || "";
      let lastIndex = 0;
      let match: RegExpExecArray | null;
      regex.lastIndex = 0;
      const frag = document.createDocumentFragment();
      while ((match = regex.exec(text)) !== null) {
        // 前面非匹配部分
        if (match.index > lastIndex) {
          frag.appendChild(
            document.createTextNode(text.slice(lastIndex, match.index))
          );
        }
        // 匹配部分
        const span = document.createElement("span");
        span.className = "lawyer-highlight";
        span.textContent = match[0];
        frag.appendChild(span);
        this.highlightSpans.push(span);
        lastIndex = regex.lastIndex;
      }
      // 剩余部分
      if (lastIndex < text.length) {
        frag.appendChild(document.createTextNode(text.slice(lastIndex)));
      }
      node.parentNode && node.parentNode.replaceChild(frag, node);
    });
    this.highlightCount = this.highlightSpans.length;
  }

  // 更新当前高亮项
  updateCurrentHighlight() {
    this.highlightSpans.forEach((span) =>
      span.classList.remove("lawyer-current-highlight")
    );
    if (this.highlightSpans.length === 0) return;
    if (this.currentIndex < 0) this.currentIndex = 0;
    if (this.currentIndex >= this.highlightSpans.length) this.currentIndex = 0;
    const currentSpan = this.highlightSpans[this.currentIndex];
    currentSpan.classList.add("lawyer-current-highlight");
    // 滚动到当前
    currentSpan.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  // 搜索/循环跳转
  onSearch() {
    if (!this.searchTerm) {
      this.clearHighlights();
      this.highlightSpans = [];
      this.highlightCount = 0;
      this.currentIndex = -1;
      this.lastSearchTerm = "";
      return;
    }
    // 搜索词变了，重新高亮并跳到第一个
    if (this.searchTerm !== this.lastSearchTerm) {
      this.clearHighlights();
      this.highlightAll();
      this.currentIndex = 0;
      this.lastSearchTerm = this.searchTerm;
    } else {
      // 搜索词没变，跳到下一个
      if (this.highlightSpans.length > 0) {
        this.currentIndex =
          (this.currentIndex + 1) % this.highlightSpans.length;
      }
    }
    if (this.highlightSpans.length > 0) {
      this.updateCurrentHighlight();
    } else {
      this.currentIndex = -1;
    }
  }

  // 清空搜索
  clearSearch() {
    this.searchTerm = "";
    this.clearHighlights();
    this.highlightSpans = [];
    this.highlightCount = 0;
    this.currentIndex = -1;
    this.lastSearchTerm = "";
  }

  // 清空时自动清除高亮
  @Watch("searchTerm")
  onSearchTermChange(newVal: string) {
    if (!newVal) {
      this.clearHighlights();
      this.highlightSpans = [];
      this.highlightCount = 0;
      this.currentIndex = -1;
      this.lastSearchTerm = "";
    }
  }
}
</script>

<style>
.lawyer-div-text-search-container {
  max-width: 1000px;
  margin: 0 auto;
  background: #fff;
  overflow: hidden;
}
.lawyer-search-bar {
  position: sticky;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 100;
  background: #fff;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  padding: 10px 0 5px 0;
}
.lawyer-search-box {
  flex: 1;
  min-width: 200px;
  display: flex;
  background: white;
  overflow: hidden;
  border: 1px solid #d9d9d9;
  margin-left: 10px;
}
.lawyer-search-input {
  flex: 1;
  border: none;
  padding: 6px 10px;
  font-size: 0.9rem;
  outline: none;
  background: transparent;
}
.lawyer-search-button {
  background: #1890ff;
  color: white;
  border: none;
  padding: 0 12px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.3s;
}
.lawyer-search-button:hover {
  background: #40a9ff;
}
.lawyer-clear-button {
  background: transparent;
  color: #999;
  border: none;
  padding: 0 6px;
  cursor: pointer;
  font-size: 1.2rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
.lawyer-clear-button:hover {
  color: #666;
}
.lawyer-match-count {
  color: #666;
  padding: 6px 10px;
  font-size: 0.9rem;
  min-width: 100px;
  text-align: center;
  margin-right: 10px;
}
.lawyer-content-area {
  padding: 10px;
  min-height: 300px;
  max-height: calc(100vh - 80px);
  overflow-y: auto;
  position: relative;
}
.lawyer-highlight {
  background-color: #ffeb3b;
  color: #000;
  font-weight: bold;
  padding: 0 2px;
}
.lawyer-current-highlight {
  background-color: #ff9800 !important;
  animation: lawyer-pulse 1.5s infinite;
}
@keyframes lawyer-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 152, 0, 0.7);
  }
  70% {
    box-shadow: 0 0 0 4px rgba(255, 152, 0, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 152, 0, 0);
  }
}
@media (max-width: 768px) {
  .lawyer-search-bar {
    flex-direction: column;
    align-items: stretch;
  }
  .lawyer-match-count {
    width: 100%;
    justify-content: center;
    margin: 0;
  }
  .lawyer-search-box {
    margin: 0;
  }
}
</style>
