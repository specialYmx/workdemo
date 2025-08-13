<template>
  <div
    class="lawyer-manual-review-detail-wrapper"
    ref="documentComparePageContainer"
  >
    <lawyer-document-compare
      :document="documentData"
      @go-back="goBack"
      @submit-review="handleReviewSubmit"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "nuxt-property-decorator";

import {
  DocumentComparePageData,
  ChangeItem,
  ReviewSubmitData,
} from "@/model/LawyerModel";

@Component({ name: "lawyer-manual-review-detail-component" })
export default class LawyerManualReviewDetailComponent extends Vue {
  // 对比数据
  documentData: DocumentComparePageData = {
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

  loading: boolean = false;

  // 返回上一页
  goBack(): void {
    this.$router.back();
  }

  // 处理审核提交
  handleReviewSubmit(
    reviewData: ReviewSubmitData & {
      categoryMain?: string;
      categorySub?: string;
      effectDateStr?: string | null;
    }
  ): void {
    const { action, categoryMain, categorySub, effectDateStr } = reviewData;

    // 检查必要的分类信息
    if (!categoryMain) {
      this.$message.error("请先在文档对比页面设置分类信息");
      return;
    }

    // 处理审核逻辑
    // 调用API
    this.$roadLawyerService
      .approveToDoRule({
        id: this.documentData.id,
        approvalComment: action === "approve" ? "已通过" : "已驳回",
        effectDateStr: effectDateStr || this.documentData.effectDate, // 优先使用弹窗设置的施行日期
        categoryMain: categoryMain,
        categorySub: categorySub,
      })
      .then(() => {
        this.documentData.status =
          action === "approve" ? "approved" : "rejected";

        this.$message.success(
          `${action === "approve" ? "通过" : "驳回"}操作成功！`
        );

        // 审核后返回列表页
        setTimeout(() => {
          this.$router.push("/manualReview");
        }, 1500);
      })
      .catch((error) => {
        console.error("审核操作失败:", error);
        this.$message.error("审核操作失败，请重试");
      });
  }

  // 格式化文档变更数据（内联完成分割与解析，减少冗余方法）
  formatChanges(checkResult: string): ChangeItem[] {
    if (!checkResult || typeof checkResult !== "string") return [];

    try {
      // 1) 去掉方括号
      let content: string = checkResult.trim();
      if (content.startsWith("[") && content.endsWith("]")) {
        content = content.slice(1, -1);
      }

      // 检查特殊情况：无旧版文件或无新版文件
      const trimmedContent = content.trim();
      if (trimmedContent === "无旧版文件" || trimmedContent === "无新版文件") {
        // 返回特殊标记，用于在UI中显示相应信息
        return [
          {
            type: "info" as any,
            position: trimmedContent,
            sectionDisplay: "",
            oldText: "",
            newText: "",
          },
        ];
      }

      if (!content.trim()) return [];

      // 2) 智能分割（处理引号内逗号）
      const items: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < content.length; i++) {
        const ch = content[i];
        if (ch === "'" && !inQuotes) inQuotes = true;
        else if (ch === "'" && inQuotes) inQuotes = false;
        else if (ch === "," && !inQuotes) {
          if (current.trim()) items.push(current.trim());
          current = "";
          continue;
        }
        current += ch;
      }
      if (current.trim()) items.push(current.trim());

      // 3) 解析每一项
      const changes: ChangeItem[] = [];
      for (const raw of items) {
        const item = raw.trim();
        if (!item) continue;

        // 标题变更
        let m = item.match(/^(.+?)\s+标题变更：由'(.+?)'变更为'(.+?)'$/);
        if (m) {
          const sectionText = m[1].trim();
          changes.push({
            type: "modify",
            position: "标题变更",
            sectionDisplay: sectionText,
            oldText: m[2].trim(),
            newText: m[3].trim(),
          });
          continue;
        }

        // 删除条款
        m = item.match(/^删除条款：(.+)$/);
        if (m) {
          const contentText = m[1].trim();
          const displayMatch = contentText.match(/^(第.+?[章条])/);
          changes.push({
            type: "delete",
            position: "删除内容",
            sectionDisplay: displayMatch ? displayMatch[1] : "",
            oldText: contentText,
          });
          continue;
        }

        // 内容变更：由'..'变更为'..'
        m = item.match(/^(.+?)：由'(.+?)'变更为'(.+?)'$/);
        if (m) {
          const sectionText = m[1].trim();
          changes.push({
            type: "modify",
            position: "内容变更",
            sectionDisplay: sectionText,
            oldText: m[2].trim(),
            newText: m[3].trim(),
          });
          continue;
        }

        // 新增条款
        m = item.match(/^(.+?)\s*新增条款：(.+)$/);
        if (m) {
          const sectionText = m[1].trim();
          changes.push({
            type: "add",
            position: "新增内容",
            sectionDisplay: sectionText,
            newText: m[2].trim(),
          });
          continue;
        }

        // 未匹配
        console.warn("无法解析的变更项:", item);
      }

      // 4) 统一清理空白
      return changes.map((c) => {
        if (c.position)
          c.position = c.position
            .replace(/[\r\n\t]/g, "")
            .replace(/\s+/g, " ")
            .trim();
        if (c.sectionDisplay)
          c.sectionDisplay = c.sectionDisplay
            .replace(/[\r\n\t]/g, "")
            .replace(/\s+/g, " ")
            .trim();
        return c;
      });
    } catch (error) {
      console.error("解析变更数据失败:", error);
      return [];
    }
  }

  // 获取文档对比数据
  async fetchDocumentData(): Promise<void> {
    const docId = this.$route.query.id;
    const pageTitle = this.$route.query.pageTitle;
    const checkStatus = this.$route.query.checkStatus; // 从路由参数获取审核状态
    if (!docId) return;
    this.loading = true;
    this.documentData = {
      id: docId as string,
      title: (pageTitle as string) || "正在加载文档...",
      status: "pending",
      checkStatus: (checkStatus as string) || "待审核", // 使用路由参数中的审核状态
      tags: [],
      originalVersion: "",
      newVersion: "",
      originalContent: "暂无数据",
      newContent: "暂无数据",
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
        id: docId as string,
      });
      console.log("文档详情数据:", result);

      if (result && (result.oldFileContent || result.newFileContent)) {
        // 构建标签数组，包含一级和二级分类
        const tags: string[] = [];
        if (result.categoryMain) tags.push(result.categoryMain);
        if (result.categorySub) tags.push(result.categorySub);

        // 处理文档数据 - 使用从URL参数获取的标题
        this.documentData = {
          id: docId as string,
          title:
            (pageTitle as string) ||
            `${result.categoryMain || ""}${
              result.categorySub ? "/" + result.categorySub : ""
            }`,
          status:
            result.checkStatus === "1"
              ? "approved"
              : result.checkStatus === "2"
              ? "rejected"
              : "pending",
          checkStatus: (checkStatus as string) || "待审核", // 使用路由参数中的审核状态
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
          id: docId as string,
          title: (pageTitle as string) || "未找到文档数据",
          status: "pending",
          checkStatus: (checkStatus as string) || "待审核",
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
        id: docId as string,
        title: (pageTitle as string) || "加载失败",
        status: "pending",
        checkStatus: (checkStatus as string) || "待审核",
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
  created(): void {
    // 在created钩子中获取数据
    this.fetchDocumentData();
  }
}
</script>

<style lang="less">
@import "~/assets/styles/lawyer.less";

.lawyer-manual-review-detail-wrapper {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}
</style>
