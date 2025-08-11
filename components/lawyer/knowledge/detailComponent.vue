<template>
  <div class="lawyer-knowledge-detail-wrapper">
    <document-viewer
      :document="document"
      :relatedDocuments="relatedDocuments"
      @go-back="goBack"
      @open-related="openRelatedDocument"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "nuxt-property-decorator";

import {
  KnowledgeDataItem,
  DocumentViewerData,
  RelatedDocumentItem,
} from "~/model/LawyerModel";

@Component({ name: "lawyer-knowledge-detail-component" })
export default class LawyerKnowledgeDetailComponent extends Vue {
  // 文档数据
  document: DocumentViewerData = {
    id: "",
    title: "正在加载...",
    date: "",
    effectiveDate: "",
    publisher: "",
    fileNumber: "",
    status: "",
    views: 0,
    content: "正在加载文档内容...",
    isRevoke: false,
    timeLiness: "",
  };

  loading: boolean = false;

  // 废止状态控制（从文档详情弹窗的已废止控件获取）
  isRevoke: boolean = false;

  // 相关文档（模拟数据）
  relatedDocuments: RelatedDocumentItem[] = [
    {
      id: "2",
      title: "《中华人民共和国数据安全法》",
      date: "2021-06-10",
    },
    {
      id: "3",
      title: "《网络安全审查办法》",
      date: "2022-01-04",
    },
    {
      id: "4",
      title: "《互联网信息服务深度合成管理规定》",
      date: "2022-12-11",
    },
    {
      id: "5",
      title: "《关于个人信息出境标准合同办法》",
      date: "2023-02-24",
    },
  ];

  // 返回上一页
  goBack(): void {
    this.$router.back();
  }

  // 打开相关文档
  openRelatedDocument(doc: RelatedDocumentItem): void {
    this.$router.push({
      path: "/lawyerKnowledge/detail",
      query: {
        id: doc.id,
        pageTitle: doc.title,
      },
    });
  }

  // 获取文档详情数据
  async fetchDocument(docId: string): Promise<void> {
    if (!docId) return;

    this.loading = true;
    try {
      const result: KnowledgeDataItem | null =
        await this.$roadLawyerService.getRuleSourceDetail({
          searchId: docId,
          isRevoke: this.isRevoke,
        });
      console.log("获取到的文档详情:", result);

      if (result) {
        // 转换KnowledgeDataItem数据为DocumentViewer需要的格式
        const formattedContent: string = this.formatContent(result.fileContent);
        console.log("格式化后的内容:", formattedContent);

        this.document = {
          id: result.id,
          title: result.ruleName,
          date: result.publishDateStr || result.createdTimeStr,
          effectiveDate: result.effectDateStr || "暂无",
          publisher: result.legalSource || result.websiteName,
          fileNumber: result.docNo || "暂无",
          status: result.timeLiness || "未知",
          views: result.readCount,
          content: formattedContent,
          isRevoke: result.timeLiness === "已废止",
          timeLiness: result.timeLiness || "未知",
        };

        console.log("设置后的document:", this.document);
      } else {
        // 如果没有获取到数据，显示错误信息
        this.$message.error("未找到文档数据");
        this.$router.push("/lawyerKnowledge");
      }
    } catch (error) {
      console.error("获取文档详情失败:", error);
      this.$message.error("获取文档详情失败，请重试");
      this.$router.push("/lawyerKnowledge");
    } finally {
      this.loading = false;
    }
  }

  // 格式化文档内容
  formatContent(content: string): string {
    console.log("原始内容:", content);
    if (!content) {
      console.log("内容为空，返回暂无内容");
      return "暂无内容";
    }

    // 将纯文本内容转换为HTML格式
    const formatted: string = content
      .split("\n")
      .map((line: string): string => {
        line = line.trim();
        if (!line) return "";

        // 处理标题（如：保险公司资金运用统计制度）
        if (
          line.match(/^[一二三四五六七八九十]+、/) ||
          line.match(/^第[一二三四五六七八九十]+章/)
        ) {
          return `<h2 class="doc-title">${line}</h2>`;
        }

        // 处理条款
        if (
          line.match(/^第[一二三四五六七八九十\d]+条/) ||
          line.match(/^[一二三四五六七八九十]+、/)
        ) {
          return `<p class="doc-article"><strong>${line}</strong></p>`;
        }

        // 处理文号等特殊格式
        if (line.match(/^[〔\[].+[〕\]]/) || line.match(/号$/)) {
          return `<p class="doc-meta">${line}</p>`;
        }

        // 处理普通段落
        return `<p class="doc-article">${line}</p>`;
      })
      .filter(Boolean)
      .join("\n");

    console.log("格式化结果:", formatted);
    return formatted;
  }

  // 生命周期钩子
  async mounted(): Promise<void> {
    const docId = this.$route.query.id;
    const pageTitle = this.$route.query.pageTitle;
    console.log("文档ID:", docId);
    console.log("页面标题:", pageTitle);

    // 如果有 pageTitle 参数，先设置标题
    if (pageTitle && typeof pageTitle === "string") {
      this.document.title = pageTitle;
    }

    // 从路由查询参数中获取isRevoke状态
    const isRevokeParam = this.$route.query.isRevoke;
    if (isRevokeParam !== undefined && isRevokeParam !== null) {
      this.isRevoke = String(isRevokeParam) === "true";
    }
    console.log("废止状态:", this.isRevoke);

    if (docId && typeof docId === "string") {
      await this.fetchDocument(docId);
    } else {
      this.$message.error("缺少文档ID参数");
      this.$router.push("/lawyerKnowledge");
    }
  }
}
</script>

<style lang="less">
.lawyer-knowledge-detail-wrapper {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}
</style>
