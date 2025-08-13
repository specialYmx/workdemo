<template>
  <div class="document-viewer-wrapper" ref="documentViewerContainer">
    <div class="lawyer-document-page">
      <!-- 主要内容区 -->
      <div class="lawyer-main-layout">
        <!-- 左侧：文档查看器 -->
        <div class="lawyer-document-left">
          <a-card
            class="lawyer-document-viewer lawyer-chart-card"
            :bordered="false"
          >
            <!-- 文档头部信息 -->
            <div class="lawyer-document-header">
              <div class="lawyer-header-row">
                <div class="lawyer-document-info">
                  <!-- 标题和状态标签 -->
                  <div class="lawyer-title-with-status">
                    <h1>{{ document.title }}</h1>
                    <a-tag
                      :color="document.isRevoke ? 'red' : 'green'"
                      @click="handleStatusTagClick"
                      :class="[
                        'lawyer-editable-status',
                        'lawyer-inline-status',
                        { 'lawyer-status-disabled': document.isRevoke },
                      ]"
                    >
                      {{ document.timeLiness || "未知" }}
                      <a-icon
                        v-if="!document.isRevoke"
                        type="edit"
                        class="lawyer-status-edit-icon"
                      />
                    </a-tag>
                  </div>

                  <!-- 文档元数据 -->
                  <div class="lawyer-document-meta">
                    <span
                      v-for="(item, index) in documentMetaItems"
                      :key="index"
                    >
                      <a-icon :type="item.icon" /> {{ item.content }}
                    </span>
                  </div>
                </div>

                <div class="lawyer-header-actions">
                  <a-button class="lawyer-back-btn" @click="goBack">
                    <a-icon type="arrow-left" />
                    返回
                  </a-button>
                  <a-button type="primary" @click="downloadDocument">
                    下载
                  </a-button>
                </div>
              </div>
            </div>

            <!-- 文档内容 -->
            <lawyer-common-div-text-search>
              <div
                class="lawyer-document-content lawyer-scrollable lawyer-markdown-content"
                ref="documentContent"
                tabindex="0"
              >
                <v-md-preview :text="document.content" />
              </div>
            </lawyer-common-div-text-search>
          </a-card>
        </div>

        <!-- 右侧：文档智能问答 -->
        <div class="lawyer-document-right">
          <lawyer-common-document-a-i-chat :document="document" />
        </div>
      </div>

      <!-- 废止状态编辑模态框 -->
      <a-modal
        title="编辑文档状态"
        :visible="revokeStatusVisible"
        @ok="handleRevokeStatusConfirm"
        @cancel="handleRevokeStatusCancel"
        :width="400"
        okText="确认"
        cancelText="取消"
        :getContainer="() => $refs.documentViewerContainer"
      >
        <div class="lawyer-revoke-status-content">
          <div class="lawyer-status-row">
            <label>文档状态</label>
            <div class="lawyer-status-switch-container">
              <a-switch
                v-model="tempIsRevoke"
                :checked-children="'已废止'"
                :un-checked-children="'未废止'"
                size="default"
              />
              <span class="lawyer-status-text">
                {{ tempIsRevoke ? "已废止" : "未废止" }}
              </span>
            </div>
          </div>

          <!-- 废止说明 -->
          <div class="lawyer-status-description">
            <p v-if="tempIsRevoke" class="lawyer-revoke-tip">
              <a-icon
                type="exclamation-circle"
                style="color: #ff4d4f; margin-right: 8px"
              />
              设置为已废止后，该文档将标记为无效状态
            </p>
            <p v-else class="lawyer-active-tip">
              <a-icon
                type="check-circle"
                style="color: #52c41a; margin-right: 8px"
              />
              文档当前为有效状态
            </p>
          </div>
        </div>
      </a-modal>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Emit } from "nuxt-property-decorator";

import { downloadFileWithMessage } from "~/utils/personal";
import { DocumentViewerData, DocumentMetaItem } from "~/model/LawyerModel";

@Component({})
export default class DocumentViewer extends Vue {
  @Prop({ required: true }) document!: DocumentViewerData;

  // 废止状态编辑相关
  revokeStatusVisible: boolean = false;
  tempIsRevoke: boolean = false;

  // 文档元数据项
  get documentMetaItems(): DocumentMetaItem[] {
    return [
      {
        icon: "number",
        content: `文号：${this.document.fileNumber || "暂无"}`,
      },
      {
        icon: "bank",
        content: `发布机构：${this.document.publisher || "暂无"}`,
      },
      {
        icon: "calendar",
        content: `发布日期：${this.document.date || "暂无"}`,
      },
      {
        icon: "clock-circle",
        content: `生效日期：${this.document.effectiveDate || "暂无"}`,
      },
    ];
  }

  // 返回上一页
  goBack(): void {
    this.emitGoBack();
  }

  // 处理状态标签点击
  handleStatusTagClick(): void {
    // 只有非已废止状态的文档才能点击
    if (!this.document.isRevoke) {
      this.showRevokeStatusModal();
    }
  }

  // 显示废止状态编辑模态框
  showRevokeStatusModal(): void {
    // 初始状态为false，让用户选择是否要将状态改为已废止
    this.tempIsRevoke = false;
    this.revokeStatusVisible = true;
  }

  // 处理废止状态编辑确认
  async handleRevokeStatusConfirm(): Promise<void> {
    try {
      // 如果用户打开了已废止开关，才调用接口
      if (this.tempIsRevoke) {
        this.$message.loading("正在更新文档状态...", 0);

        await this.$roadLawyerService.getRuleSourceDetail({
          searchId: this.document.id,
          isRevoke: true,
        });

        this.$message.destroy();

        // 更新为已废止状态
        this.document.isRevoke = true;
        this.document.timeLiness = "已废止";

        this.$message.success(`文档状态已更新为：已废止`);
      } else {
        // 用户关闭了开关，不调用接口，保持原状态
        this.$message.success("已取消状态修改");
      }

      this.revokeStatusVisible = false;
    } catch (error) {
      this.$message.destroy();
      console.error("更新文档状态失败:", error);
      this.$message.error("更新文档状态失败，请重试");
    }
  }

  // 处理废止状态编辑取消
  handleRevokeStatusCancel(): void {
    this.revokeStatusVisible = false;
  }

  // 使选中内容在视图中可见
  makeSelectionVisible(): void {
    const selection: Selection | null = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range: Range = selection.getRangeAt(0);
      if (range) {
        // 获取选中范围的边界矩形
        const rect: DOMRect = range.getBoundingClientRect();

        // 获取文档容器
        const contentDiv = this.$refs.documentContent as HTMLElement;
        if (contentDiv) {
          // 判断选中内容是否在可视区域内
          const containerRect: DOMRect = contentDiv.getBoundingClientRect();

          // 如果选中内容不在可视区域内，滚动到该位置
          if (
            rect.top < containerRect.top ||
            rect.bottom > containerRect.bottom
          ) {
            // 使用scrollIntoView确保元素可见
            const parentElement = range.startContainer.parentElement;
            if (parentElement) {
              parentElement.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
            }
          }
        }
      }
    }
  }

  // 下载文档
  async downloadDocument(): Promise<void> {
    try {
      this.$message.loading(`正在准备下载: ${this.document.title}`, 0);

      const result = await this.$roadLawyerService.downloadRuleFile({
        searchId: this.document.id,
      });

      this.$message.destroy();

      if (result) {
        downloadFileWithMessage(result, {
          fileName: `${this.document.title}.docx`,
          showMessage: true,
          messageService: this.$message,
        });
      }
    } catch (error) {
      this.$message.destroy();
      console.error("下载失败:", error);
      this.$message.error("下载失败，请检查网络连接后重试");
    }
  }

  // Emit 装饰器方法
  @Emit("go-back")
  emitGoBack(): void {
    // 无需返回值
  }
}
</script>

<style lang="less">
@import "~/assets/styles/lawyer.less";

.document-viewer-wrapper {
  // 基础布局
  .lawyer-document-page {
    height: calc(100vh - 70px);
    display: flex;
    flex-direction: column;
    background-color: var(--lawyer-background);
    padding: 16px;
  }

  // 标题和状态标签同行布局
  .lawyer-title-with-status {
    display: flex;
    align-items: baseline;
    gap: 12px;
    margin-bottom: 8px;

    h1 {
      margin: 0;
      line-height: 1.2;
      font-size: 18px;
      color: var(--lawyer-text);
    }

    .lawyer-inline-status {
      flex-shrink: 0;
      font-size: 11px;
      padding: 2px 6px;
      margin-left: 4px;
    }

    // 响应式：小屏幕时保持同行
    @media (max-width: 768px) {
      flex-wrap: wrap;
      gap: 8px;
    }
  }

  // 可编辑状态标签样式
  .lawyer-editable-status {
    cursor: pointer;
    transition: all 0.3s;
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 4px;
    display: inline-flex;
    align-items: center;
    gap: 4px;

    &:hover {
      opacity: 0.8;
      transform: translateY(-1px);
    }

    .lawyer-status-edit-icon {
      font-size: 10px;
      opacity: 0.7;
    }

    // 禁用状态样式
    &.lawyer-status-disabled {
      cursor: not-allowed;
      opacity: 0.6;

      &:hover {
        opacity: 0.6;
        transform: none;
      }
    }
  }

  .lawyer-document-meta {
    font-size: 13px;
    color: var(--lawyer-text-light);
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    margin-top: 6px;
    @media (max-width: 768px) {
      gap: 12px;
      font-size: 12px;
    }
  }

  // 主布局
  .lawyer-main-layout {
    display: flex;
    flex: 1;
    overflow: hidden;
    gap: 16px;

    // 响应式布局
    @media (max-width: 1200px) {
      flex-direction: column;
      gap: 12px;
    }
  }

  // 左侧文档区域
  .lawyer-document-left {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0; // 防止flex子项溢出

    @media (max-width: 1200px) {
      height: 60vh; // 小屏幕时限制高度
    }
  }

  // 右侧AI问答区域
  .lawyer-document-right {
    width: 400px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;

    @media (max-width: 1200px) {
      width: 100%;
      min-height: 500px; // 确保足够的最小高度
      height: auto; // 改为自适应高度
    }
  }

  // 文档查看器
  .lawyer-document-viewer {
    flex: 1;
    background: var(--lawyer-surface);
    display: flex;
    flex-direction: column;
    height: 100%;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

    .ant-card-body {
      padding: 0;
      display: flex;
      flex-direction: column;
      height: 100%;
    }
  }

  // 文档头部（在卡片内）
  .lawyer-document-header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--lawyer-border);
    background: var(--lawyer-surface);

    .lawyer-header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;

      .lawyer-header-actions {
        display: flex;
        gap: 8px;
        flex-shrink: 0;
        align-self: flex-start;

        .lawyer-back-btn {
          display: flex;
          align-items: center;
        }
      }
    }

    // 响应式布局
    @media (max-width: 768px) {
      .lawyer-header-row {
        flex-direction: column;
        gap: 12px;

        .lawyer-header-actions {
          align-self: flex-end;
        }
      }
    }
  }

  // 文档信息样式
  .lawyer-document-info {
    h1 {
      font-size: 18px;
      color: var(--lawyer-text);
      margin: 0;
    }
  }

  .lawyer-document-content {
    flex: 1;
    padding: 20px 24px;
    overflow-y: auto;
    height: 100%;
  }
  // 废止状态编辑弹窗样式
  .lawyer-revoke-status-content {
    .lawyer-status-row {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;

      label {
        font-weight: 500;
        color: #333;
        min-width: 80px;
      }

      .lawyer-status-switch-container {
        display: flex;
        align-items: center;
        gap: 12px;

        .lawyer-status-text {
          font-size: 14px;
          color: #666;
          font-weight: 500;
        }
      }
    }

    .lawyer-status-description {
      padding: 12px;
      background-color: #fafafa;
      border-radius: 6px;
      border: 1px solid #f0f0f0;

      .lawyer-revoke-tip,
      .lawyer-active-tip {
        margin: 0;
        font-size: 13px;
        display: flex;
        align-items: center;
      }

      .lawyer-revoke-tip {
        color: #ff4d4f;
      }

      .lawyer-active-tip {
        color: #52c41a;
      }
    }
  }
}
</style>
