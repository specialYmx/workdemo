<template>
  <div class="document-compare-page-wrapper">
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
    const { action, comment } = reviewData;

    if (action === "reject" && !comment) {
      this.$message.error("请输入审核意见");
      return;
    }

    // 处理审核逻辑
    // 调用API
    this.$service.lawyer.approveToDoRule({
      id: this.documentData.id,
      approvalComment: action === "approve" ? "已通过" : "已驳回",
      effectDate: this.documentData.effectDate, // 使用当前文档的施行日期
    }).then(() => {
      this.documentData.status = action === "approve" ? "approved" : "rejected";

      this.$message.success(
        `${action === "approve" ? "通过" : "驳回"}操作成功！`
      );

      // 审核后返回列表页
      setTimeout(() => {
        this.$router.push("/db");
      }, 1500);
    }).catch(error => {
      console.error("审核操作失败:", error);
      this.$message.error("审核操作失败，请重试");
    });
  }

  // 格式化文档变更数据
  formatChanges(checkResult) {
    if (!checkResult) return [];
    
    try {
      // 解析对比结果字符串为对象
      let changes = [];
      
      // 处理特殊格式的字符串
      if (typeof checkResult === 'string') {
        // 原始格式示例: "[{第壹章-标题变更=由\"总则\"修改为\"总则22\"}, {第一章 总则-第二条=1. 修改内容：由\"本法\"修改为：\"本法aa\"；2. 新增条款：22}]"
        
        // 提取各个变更项
        const items = checkResult.match(/\{[^{}]+\}/g) || [];
        
        items.forEach(item => {
          // 从每个项中提取键和值
          const match = item.match(/\{([^=]+)=(.+)\}/);
          if (match) {
            const key = match[1];
            const value = match[2];
            
            // 提取章节和位置信息
            const keyParts = key.split('-');
            const section = keyParts[0].trim();
            const position = keyParts.length > 1 ? keyParts[1].trim() : '';
            
            // 根据内容确定变更类型
            if (value.includes('删除条款')) {
              changes.push({
                type: 'delete',
                section: section.includes('章') ? section.replace('第', '').replace('章', '') : '',
                position: position || '删除内容',
                oldText: value.replace('删除条款：', '').trim(),
                reason: '删除原有条款',
              });
            } else if (value.includes('新增条款')) {
              changes.push({
                type: 'add',
                section: section.includes('章') ? section.replace('第', '').replace('章', '') : '',
                position: position || '新增内容',
                newText: value.replace('新增条款：', '').trim(),
                reason: '新增法规条款',
              });
            } else if (value.includes('修改内容')) {
              // 处理修改类型，可能有多个修改点
              const modifyPoints = value.split(/；\s*\d+\.\s*/);
              
              modifyPoints.forEach(point => {
                if (point.includes('修改内容：') && point.includes('修改为：')) {
                  const oldTextMatch = point.match(/由"([^"]+)"/);
                  const newTextMatch = point.match(/修改为："([^"]+)"/);
                  
                  if (oldTextMatch && newTextMatch) {
                    changes.push({
                      type: 'modify',
                      section: section.includes('章') ? section.replace('第', '').replace('章', '') : '',
                      position: position || '内容更新',
                      oldText: oldTextMatch[1].trim(),
                      newText: newTextMatch[1].trim(),
                      reason: '修改原有条款内容',
                    });
                  }
                }
              });
            } else if (value.includes('标题变更')) {
              // 处理标题变更，格式如：由"总则"修改为"总则22"
              const oldTextMatch = value.match(/由"([^"]+)"/);
              const newTextMatch = value.match(/修改为"([^"]+)"/);
              
              if (oldTextMatch && newTextMatch) {
                changes.push({
                  type: 'modify',
                  section: section.includes('章') ? section.replace('第', '').replace('章', '') : '',
                  position: '标题变更',
                  oldText: oldTextMatch[1].trim(),
                  newText: newTextMatch[1].trim(),
                  reason: '修改章节标题',
                });
              }
            }
          }
        });
      } else if (Array.isArray(checkResult)) {
        // 如果已经是数组对象，直接处理
        checkResult.forEach(item => {
          for (const key in item) {
            const value = item[key];
            // 获取键值对
            const keyParts = key.split('-');
            const section = keyParts[0].trim();
            const position = keyParts.length > 1 ? keyParts[1].trim() : '';
            
            if (typeof value === 'string') {
              if (value.includes('删除条款')) {
                changes.push({
                  type: 'delete',
                  section: section.includes('章') ? section.replace('第', '').replace('章', '') : '',
                  position: position || '删除内容',
                  oldText: value.replace('删除条款：', '').trim(),
                  reason: '删除原有条款',
                });
              } else if (value.includes('新增条款')) {
                changes.push({
                  type: 'add',
                  section: section.includes('章') ? section.replace('第', '').replace('章', '') : '',
                  position: position || '新增内容',
                  newText: value.replace('新增条款：', '').trim(),
                  reason: '新增法规条款',
                });
              } else if (value.includes('标题变更')) {
                const oldTextMatch = value.match(/由"([^"]+)"/);
                const newTextMatch = value.match(/修改为"([^"]+)"/);
                
                if (oldTextMatch && newTextMatch) {
                  changes.push({
                    type: 'modify',
                    section: section.includes('章') ? section.replace('第', '').replace('章', '') : '',
                    position: '标题',
                    oldText: oldTextMatch[1].trim(),
                    newText: newTextMatch[1].trim(),
                    reason: '修改章节标题',
                  });
                }
              }
            }
          }
        });
      }
      
      // 确保章节显示为中文数字
      changes = changes.map(change => {
        if (change.section && !isNaN(change.section)) {
          const num = parseInt(change.section);
          // 转换为中文数字（简单版）
          const chineseNums = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
          if (num > 0 && num <= 10) {
            change.section = chineseNums[num - 1];
          }
        }
        
        // 处理位置信息，删除多余空格和换行符
        if (change.position) {
          change.position = change.position.replace(/\s+/g, ' ').trim();
        }
        
        return change;
      });
      
      return changes;
    } catch (error) {
      console.error('解析变更数据失败:', error);
      return [];
    }
  }

  // 获取文档对比数据
  async fetchDocumentData() {
    const docId = this.$route.params.id;
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
      currentMaxFileVersion: 0
    };
    
    try {
      // 调用接口获取文档详情
      const result = await this.$service.lawyer.getToDoRuleDetail({ id: docId });
      console.log('文档详情数据:', result);
      
      if (result && (result.oldFileContent || result.newFileContent)) {
        // 构建标签数组，包含一级和二级分类
        const tags = [];
        if (result.categoryMain) tags.push(result.categoryMain);
        if (result.categorySub) tags.push(result.categorySub);
        
        // 处理文档数据 - 使用从URL参数获取的标题
        this.documentData = {
          id: docId,
          title: pageTitle || `${result.categoryMain || ''}${result.categorySub ? '/' + result.categorySub : ''}`,
          status: result.checkStatus === '1' ? 'approved' : (result.checkStatus === '2' ? 'rejected' : 'pending'),
          tags: tags, // 使用包含一级和二级分类的标签数组
          originalVersion: '原始版本',
          newVersion: result.newFileVersion || '修订版本',
          originalContent: result.oldFileContent || '',
          newContent: result.newFileContent || '',
          changes: this.formatChanges(result.checkResult),
          modifiedDate: result.newPublishTime || result.effect_date,
          effectDate: result.effect_date,
          oldFileVersion: result.oldFileVersion,
          oldPublishTime: result.oldPublishTime,
          newFileVersion: result.newFileVersion,
          newPublishTime: result.newPublishTime,
          currentMaxFileVersion: result.currentMaxFileVersion || 0
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
        this.$message.error('获取的文档数据为空，请检查文档ID是否正确');
      }
    } catch (error) {
      console.error('获取文档对比数据失败:', error);
      this.$message.error('获取文档对比数据失败，请重试');
      
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
        currentMaxFileVersion: 0
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
