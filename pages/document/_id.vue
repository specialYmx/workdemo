<template>
  <div class="document-page-wrapper">
    <!-- 调试信息 -->
    <div
      v-if="$route.query.debug"
      style="
        background: #f0f0f0;
        padding: 10px;
        margin: 10px;
        border-radius: 4px;
      "
    >
      <h3>调试信息</h3>
      <p><strong>Document Title:</strong> {{ document.title }}</p>
      <p>
        <strong>Content Length:</strong>
        {{ document.content ? document.content.length : 0 }}
      </p>
      <p>
        <strong>Content Preview:</strong>
        {{
          document.content
            ? document.content.substring(0, 100) + "..."
            : "No content"
        }}
      </p>
    </div>

    <document-viewer
      :document="document"
      :relatedDocuments="relatedDocuments"
      @go-back="goBack"
      @open-related="openRelatedDocument"
    />
  </div>
</template>

<script lang="ts">
// @ts-nocheck
import { Component, Vue } from "nuxt-property-decorator";
import { KnowledgeDataItem } from "~/model/LawyerModel";

@Component({})
export default class DocumentPage extends Vue {
  head() {
    return {
      title: "法律合规智能系统",
    };
  }

  // 文档数据
  document: any = {
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

  loading = false;

  // 废止状态控制（从文档详情弹窗的已废止控件获取）
  isRevoke = false;

  // 临时保留的模拟数据（用于fallback）
  fallbackDocument = {
    id: "1",
    title: "《中华人民共和国个人信息保护法》",
    date: "2021-08-20",
    effectiveDate: "2021-11-01",
    publisher: "全国人民代表大会常务委员会",
    fileNumber: "中华人民共和国主席令第九十一号",
    status: "已生效",
    views: 3254,
    isRevoke: false,
    timeLiness: "已生效",
    content: `
      <h1 class="doc-title">中华人民共和国个人信息保护法</h1>
      <p class="doc-meta">（2021年8月20日第十三届全国人民代表大会常务委员会第三十次会议通过）</p>

      <div class="doc-toc">
        <h2>目录</h2>
        <ul>
          <li>第一章 总则</li>
          <li>第二章 个人信息处理规则</li>
          <li>第三章 个人信息跨境提供的规则</li>
          <li>第四章 个人在个人信息处理活动中的权利</li>
          <li>第五章 个人信息处理者的义务</li>
          <li>第六章 履行个人信息保护职责的部门</li>
          <li>第七章 法律责任</li>
          <li>第八章 附则</li>
        </ul>
      </div>

      <h2>第一章 总则</h2>

      <p class="doc-article"><strong>第一条</strong> 为了保护个人信息权益，规范个人信息处理活动，促进个人信息合理利用，根据宪法，制定本法。</p>

      <p class="doc-article"><strong>第二条</strong> 自然人的个人信息受法律保护，任何组织、个人不得侵害自然人的个人信息权益。</p>

      <p class="doc-article"><strong>第三条</strong> 本法适用于中华人民共和国境内自然人个人信息的处理活动。</p>
      <p>在中华人民共和国境外处理中华人民共和国境内自然人个人信息的活动，有下列情形之一的，也适用本法：</p>
      <p>（一）以向境内自然人提供产品或者服务为目的；</p>
      <p>（二）分析、评估境内自然人的行为；</p>
      <p>（三）法律、行政法规规定的其他情形。</p>

      <p class="doc-article"><strong>第四条</strong> 个人信息是以电子或者其他方式记录的与已识别或者可识别的自然人有关的各种信息，不包括匿名化处理后的信息。</p>
      <p>个人信息的处理包括个人信息的收集、存储、使用、加工、传输、提供、公开、删除等。</p>

      <p class="doc-article"><strong>第五条</strong> 处理个人信息应当遵循合法、正当、必要和诚信原则，不得通过误导、欺诈、胁迫等方式处理个人信息。</p>

      <h2>第二章 个人信息处理规则</h2>

      <p class="doc-article"><strong>第十三条</strong> 符合下列情形之一的，个人信息处理者方可处理个人信息：</p>
      <p>（一）取得个人的同意；</p>
      <p>（二）为订立、履行个人作为一方当事人的合同所必需，或者按照依法制定的劳动规章制度和依法签订的集体合同实施人力资源管理所必需；</p>
      <p>（三）为履行法定职责或者法定义务所必需；</p>
      <p>（四）为应对突发公共卫生事件，或者紧急情况下为保护自然人的生命健康和财产安全所必需；</p>
      <p>（五）为公共利益实施新闻报道、舆论监督等行为，在合理的范围内处理个人信息；</p>
      <p>（六）依照本法规定在合理的范围内处理已经公开的个人信息；</p>
      <p>（七）法律、行政法规规定的其他情形。</p>

      <p class="doc-article">根据本法其他有关规定，处理个人信息应当取得个人同意，但是有前款第二项至第七项规定情形的，不需取得个人同意。</p>
    `,
  };

  // 相关文档（模拟数据）
  relatedDocuments = [
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
  openRelatedDocument(doc: any): void {
    this.$router.push({
      path: "/document",
      query: { id: doc.id },
    });
  }

  // 获取文档详情数据
  async fetchDocument(docId: string): Promise<void> {
    if (!docId) return;

    this.loading = true;
    try {
      const result = await this.$service.lawyer.getRuleSourceDetail({
        searchId: docId,
        isRevoke: this.isRevoke,
      });
      console.log("获取到的文档详情:", result);

      if (result) {
        // 转换KnowledgeDataItem数据为DocumentViewer需要的格式
        const formattedContent = this.formatContent(result.fileContent);
        console.log("格式化后的内容:", formattedContent);

        this.document = {
          id: result.id,
          title: result.ruleName,
          date: result.publishDateStr || result.createdTimeStr,
          effectiveDate: result.effectDateStr || "暂无",
          publisher: result.legalSource,
          fileNumber: result.docNo || "暂无",
          status: result.timeLiness || "未知",
          views: result.readCount,
          content: formattedContent,
          isRevoke: result.timeLiness === "已废止",
          timeLiness: result.timeLiness || "未知",
        };

        console.log("设置后的document:", this.document);
      } else {
        // 如果没有获取到数据，使用fallback数据
        this.document = this.fallbackDocument;
        this.$message.warning("未找到文档数据，显示示例内容");
      }
    } catch (error) {
      console.error("获取文档详情失败:", error);
      this.document = this.fallbackDocument;
      this.$message.error("获取文档详情失败，显示示例内容");
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
    const formatted = content
      .split("\n")
      .map((line) => {
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
    console.log("文档ID:", docId);

    // 从路由查询参数中获取isRevoke状态
    const isRevokeParam = this.$route.query.isRevoke;
    if (isRevokeParam !== undefined) {
      this.isRevoke = isRevokeParam === "true" || isRevokeParam === true;
    }
    console.log("废止状态:", this.isRevoke);

    if (docId) {
      await this.fetchDocument(docId);
    } else {
      this.document = this.fallbackDocument;
    }
  }
}
</script>
