<template>
  <div class="document-compare-page-wrapper" ref="documentComparePageContainer">
    <document-compare
      :document="documentData"
      @go-back="goBack"
      @submit-review="handleReviewSubmit"
    />
  </div>
</template>

<script lang="ts">
// @ts-nocheck
import { Component, Vue } from "nuxt-property-decorator";
import DocumentCompare from "@/components/document/DocumentCompare.vue";

@Component({
  components: {
    DocumentCompare,
  },
  head() {
    return {
      title: "文档版本对比 - 法律合规智能系统",
    };
  },
})
export default class DocumentComparePage extends Vue {
  // 对比数据
  documentData = {
    id: "",
    title: "",
    status: "pending",
    tags: [],
    originalVersion: "",
    newVersion: "",
    originalContent: "",
    newContent: "",
    changes: [],
  };

  loading = false;

  // 返回上一页
  goBack(): void {
    this.$router.back();
  }

  // 处理审核提交
  handleReviewSubmit(reviewData): void {
    const { action } = reviewData;

    // 处理审核逻辑
    // 调用API
    this.$roadLawyerService
      .approveToDoRule({
        id: this.documentData.id,
        approvalComment: action === "approve" ? "已通过" : "已驳回",
        effectDate: this.documentData.effectDate, // 使用当前文档的施行日期
      })
      .then(() => {
        this.documentData.status =
          action === "approve" ? "approved" : "rejected";

        this.$message.success(
          `${action === "approve" ? "通过" : "驳回"}操作成功！`
        );

        // 审核后返回列表页
        setTimeout(() => {
          this.$router.push("/db");
        }, 1500);
      })
      .catch((error) => {
        console.error("审核操作失败:", error);
        this.$message.error("审核操作失败，请重试");
      });
  }

  // 解析章节信息，提取章节号
  parseSection(sectionRaw) {
    if (!sectionRaw) return { number: "", title: "" };

    // 处理各种格式的章节信息
    // 格式1: "第壹章" -> 提取"壹"
    // 格式2: "第一章 总则" -> 提取"一"
    // 格式3: "第一章　总则" -> 提取"一" (全角空格)

    // 先去掉"第"字
    let processed = sectionRaw.replace(/^第/, "");

    // 查找"章"字的位置
    const chapterIndex = processed.indexOf("章");
    if (chapterIndex !== -1) {
      // 提取章节号（"章"字之前的部分）
      const chapterNumber = processed.substring(0, chapterIndex);
      // 提取章节标题（"章"字之后的部分，去掉空格）
      const chapterTitle = processed
        .substring(chapterIndex + 1)
        .replace(/[\s　]+/g, "")
        .trim();

      return {
        number: chapterNumber,
        title: chapterTitle,
      };
    }

    // 如果没有"章"字，返回原始内容作为number
    return {
      number: processed,
      title: "",
    };
  }

  // 格式化文档变更数据
  formatChanges(checkResult) {
    if (!checkResult || typeof checkResult !== "string") return [];

    try {
      // 处理字符串格式，去掉首尾的方括号
      let content = checkResult.trim();
      if (content.startsWith("[") && content.endsWith("]")) {
        content = content.slice(1, -1);
      }

      // 如果内容为空，返回空数组
      if (!content.trim()) {
        return [];
      }

      // 按逗号分割各个变更项，但要注意单引号内的逗号不应该分割
      const items = this.splitChangeItems(content);
      const changes = [];

      items.forEach((item) => {
        item = item.trim();
        if (!item) return;

        // 解析每个变更项
        const change = this.parseChangeItem(item);
        if (change) {
          changes.push(change);
        }
      });

      // 清理数据中的换行符和多余空格
      return changes.map((change) => {
        if (change.section) {
          change.section = change.section
            .replace(/[\r\n\t]/g, "")
            .replace(/\s+/g, " ")
            .trim();
        }

        if (change.position) {
          change.position = change.position
            .replace(/[\r\n\t]/g, "")
            .replace(/\s+/g, " ")
            .trim();
        }

        return change;
      });
    } catch (error) {
      console.error("解析变更数据失败:", error);
      return [];
    }
  }

  // 智能分割变更项，考虑单引号内的逗号
  splitChangeItems(content) {
    const items = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < content.length; i++) {
      const char = content[i];

      if (char === "'" && !inQuotes) {
        inQuotes = true;
      } else if (char === "'" && inQuotes) {
        inQuotes = false;
      } else if (char === "," && !inQuotes) {
        if (current.trim()) {
          items.push(current.trim());
        }
        current = "";
        continue;
      }
      current += char;
    }

    if (current.trim()) {
      items.push(current.trim());
    }

    return items;
  }

  // 解析单个变更项
  parseChangeItem(item) {
    try {
      // 处理标题变更：第一章 标题变更：由'总则'变更为'总则11'
      if (item.includes("标题变更")) {
        const match = item.match(/^(.+?)\s+标题变更：由'(.+?)'变更为'(.+?)'$/);
        if (match) {
          const parsedSection = this.parseSection(match[1].trim());
          return {
            type: "modify",
            section: parsedSection.number,
            position: "标题变更",
            oldText: match[2].trim(),
            newText: match[3].trim(),
            reason: "修改章节标题",
          };
        }
      }

      // 处理删除条款：删除条款：第四条  从事证券投资基金活动...
      if (item.includes("删除条款：")) {
        const match = item.match(/^删除条款：(.+)$/);
        if (match) {
          const content = match[1].trim();
          // 尝试提取条款号
          const sectionMatch = content.match(/^(第.+?[章条])/);
          let section = "";
          if (sectionMatch) {
            const parsedSection = this.parseSection(sectionMatch[1]);
            section = parsedSection.number;
          }

          return {
            type: "delete",
            section: section,
            position: "删除内容",
            oldText: content,
            reason: "删除原有条款",
          };
        }
      }

      // 处理内容变更：第二条：由'在中华人民共和国境内'变更为'在22中华人民共和国境内'
      if (item.includes("：由'") && item.includes("'变更为'")) {
        const match = item.match(/^(.+?)：由'(.+?)'变更为'(.+?)'$/);
        if (match) {
          const sectionText = match[1].trim();
          const parsedSection = this.parseSection(sectionText);

          return {
            type: "modify",
            section: parsedSection.number,
            position: sectionText,
            oldText: match[2].trim(),
            newText: match[3].trim(),
            reason: "修改条款内容",
          };
        }
      }

      // 处理新增条款（如果有的话）
      if (item.includes("新增条款")) {
        const match = item.match(/^(.+?)\s*新增条款：(.+)$/);
        if (match) {
          const parsedSection = this.parseSection(match[1].trim());
          return {
            type: "add",
            section: parsedSection.number,
            position: "新增内容",
            newText: match[2].trim(),
            reason: "新增法规条款",
          };
        }
      }

      console.warn("无法解析的变更项:", item);
      return null;
    } catch (error) {
      console.error("解析变更项失败:", item, error);
      return null;
    }
  }

  // 获取文档对比数据
  async fetchDocumentData() {
    const docId = this.$route.query.id;
    console.log("🚀 ~ DocumentComparePage ~ fetchDocumentData ~ docId:", docId);
    if (!docId) return;

    this.loading = true;
    // 从路由获取文档标题
    const pageTitle = this.$route.query.pageTitle as string;

    this.documentData = {
      id: docId,
      title: pageTitle || "正在加载文档...",
      status: "pending",
      tags: [],
      originalVersion: "",
      newVersion: "",
      originalContent: "加载中...",
      newContent: "加载中...",
      changes: [],
      oldFileVersion: null,
      oldPublishTime: null,
      newFileVersion: null,
      newPublishTime: null,
      effectDate: null,
      currentMaxFileVersion: 0,
    };

    try {
      // 调用接口获取文档详情
      const result = await this.$roadLawyerService.getToDoRuleDetail({
        id: docId,
      });
      console.log("文档详情数据:", result);

      if (result && (result.oldFileContent || result.newFileContent)) {
        // 构建标签数组，包含一级和二级分类
        const tags = [];
        if (result.categoryMain) tags.push(result.categoryMain);
        if (result.categorySub) tags.push(result.categorySub);

        // 处理文档数据 - 使用从URL参数获取的标题
        this.documentData = {
          id: docId,
          title:
            pageTitle ||
            `${result.categoryMain || ""}${
              result.categorySub ? "/" + result.categorySub : ""
            }`,
          status:
            result.checkStatus === "1"
              ? "approved"
              : result.checkStatus === "2"
              ? "rejected"
              : "pending",
          tags: tags, // 使用包含一级和二级分类的标签数组
          originalVersion: "原始版本",
          newVersion: result.newFileVersion || "修订版本",
          originalContent: result.oldFileContent || "",
          newContent: result.newFileContent || "",
          changes: this.formatChanges(result.checkResult),
          modifiedDate: result.newPublishTime || result.effect_date,
          effectDate: result.effect_date,
          oldFileVersion: result.oldFileVersion,
          oldPublishTime: result.oldPublishTime,
          newFileVersion: result.newFileVersion,
          newPublishTime: result.newPublishTime,
          currentMaxFileVersion: result.currentMaxFileVersion || 0,
        };
      } else {
        // 数据为空
        this.documentData = {
          id: docId,
          title: pageTitle || "未找到文档数据",
          status: "pending",
          tags: [],
          originalVersion: "",
          newVersion: "",
          originalContent: "error",
          newContent: "error",
          changes: [],
        };
        this.$message.error("获取的文档数据为空，请检查文档ID是否正确");
      }
    } catch (error) {
      console.error("获取文档对比数据失败:", error);
      this.$message.error("获取文档对比数据失败，请重试");

      // 显示错误状态
      this.documentData = {
        id: docId,
        title: pageTitle || "加载失败",
        status: "pending",
        tags: [],
        originalVersion: "",
        newVersion: "",
        originalContent: "error",
        newContent: "error",
        changes: [],
        oldFileVersion: null,
        oldPublishTime: null,
        newFileVersion: null,
        newPublishTime: null,
        effectDate: null,
        currentMaxFileVersion: 0,
      };
    } finally {
      this.loading = false;
    }
  }

  // 生命周期钩子
  created() {
    // 在created钩子中获取数据
    this.fetchDocumentData();
  }
}
</script>
