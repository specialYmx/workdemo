<template>
  <document-compare
    :document="documentData"
    @go-back="goBack"
    @submit-review="handleReviewSubmit"
  />
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
  // 对比数据（模拟数据）
  documentData = {
    id: "1",
    title: "《中华人民共和国个人信息保护法》修订版本对比",
    status: "pending",
    originalVersion: "1.0",
    newVersion: "1.1",
    changeSummary:
      "本次修订主要针对个人信息出境和个人信息处理者义务进行了补充和完善，增强了个人信息保护力度。",
    originalContent: `
      <h2>第四章 个人在个人信息处理活动中的权利</h2>
      <p><strong>第四十四条</strong> 个人对其个人信息的处理有权知情、有权决定，有权限制或者拒绝他人对其个人信息进行处理；法律、行政法规另有规定的除外。</p>
      <p><strong>第四十五条</strong> 个人有权向个人信息处理者查阅、复制其个人信息；有本法第十八条第一款、第三十五条规定情形的除外。</p>
      <p><strong>第四十六条</strong> 个人发现其个人信息的处理有错误、不完整的，有权要求个人信息处理者更正、补充。</p>
      <p><strong>第四十七条</strong> 有下列情形之一的，个人信息处理者应当主动删除个人信息；个人信息处理者未删除的，个人有权请求删除：</p>
      <p>（一）处理目的已实现、无法实现或者为实现处理目的不再必要；</p>
      <p>（二）个人信息处理者停止提供产品或者服务，或者保存期限已届满；</p>
      <p>（三）个人撤回同意；</p>
      <p>（四）个人信息处理者违反法律、行政法规或者违反约定处理个人信息；</p>
      <p>（五）法律、行政法规规定的其他情形。</p>
      <p>法律、行政法规规定的保存期限未届满，或者删除个人信息从技术上难以实现的，个人信息处理者应当停止除存储和采取必要的安全保护措施之外的处理。</p>
    `,
    newContent: `
      <h2>第四章 个人在个人信息处理活动中的权利</h2>
      <p><strong>第四十四条</strong> 个人对其个人信息的处理有权知情、有权决定，有权限制或者拒绝他人对其个人信息进行处理；法律、行政法规另有规定的除外。</p>
      <p><strong>第四十五条</strong> 个人有权向个人信息处理者查阅、复制其个人信息；有本法第十八条第一款、第三十五条规定情形的除外。</p>
      <p><strong>第四十五条之一</strong> 个人有权获取个人信息处理者关于个人信息处理规则的明确说明。</p>
      <p><strong>第四十六条</strong> 个人发现其个人信息的处理有错误、不完整的，有权要求个人信息处理者更正、补充。</p>
      <p><strong>第四十七条</strong> 有下列情形之一的，个人信息处理者应当主动删除个人信息；个人信息处理者未删除的，个人有权请求删除：</p>
      <p>（一）处理目的已实现、无法实现或者为实现处理目的不再必要；</p>
      <p>（二）个人信息处理者停止提供产品或者服务，或者保存期限已届满；</p>
      <p>（三）个人撤回同意；</p>
      <p>（四）个人信息处理者违反法律、行政法规或者违反约定处理个人信息；</p>
      <p>（五）法律、行政法规规定的其他情形。</p>
      <p>法律、行政法规规定的保存期限未届满，或者删除个人信息从技术上难以实现的，个人信息处理者应当停止除存储和采取必要的安全保护措施之外的处理。</p>
      <p><strong>第四十七条之一</strong> 个人信息处理者拒绝个人行使前述权利的请求的，应当说明理由。个人认为个人信息处理者违反法律、行政法规的规定处理个人信息的，有权向履行个人信息保护职责的部门投诉、举报。</p>
    `,
    changes: [
      {
        type: "add",
        section: "四",
        position: "45-1",
        newText: "个人有权获取个人信息处理者关于个人信息处理规则的明确说明。",
        reason: "增加个人知情权的具体内容，明确个人有权获取处理规则的说明。",
      },
      {
        type: "add",
        section: "四",
        position: "47-1",
        newText:
          "个人信息处理者拒绝个人行使前述权利的请求的，应当说明理由。个人认为个人信息处理者违反法律、行政法规的规定处理个人信息的，有权向履行个人信息保护职责的部门投诉、举报。",
        reason:
          "增加个人维权渠道，明确个人信息处理者的说明义务和个人的投诉权。",
      },
    ],
  };

  // 返回上一页
  goBack(): void {
    this.$router.back();
  }

  // 处理审核提交
  handleReviewSubmit(reviewData): void {
    const { action, comment } = reviewData;

    if (action === "reject" && !comment) {
      this.$message.error("请输入审核意见");
      return;
    }

    // 处理审核逻辑
    // 模拟API调用
    setTimeout(() => {
      this.documentData.status = action === "approve" ? "approved" : "rejected";

      this.$message.success(
        `${action === "approve" ? "通过" : "驳回"}操作成功！`
      );

      // 审核后返回列表页
      setTimeout(() => {
        this.$router.push("/db");
      }, 1500);
    }, 500);
  }

  // 生命周期钩子
  mounted(): void {
    // 实际项目中，这里应该根据 this.$route.params.id 获取对比数据
    const docId = this.$route.params.id;
    console.log("对比文档ID:", docId);

    // 这里应该通过API调用获取文档数据
    // this.fetchCompareData(docId)
  }
}
</script>

<style lang="less" scoped>
/* 所有样式已移至组件中 */
</style>
