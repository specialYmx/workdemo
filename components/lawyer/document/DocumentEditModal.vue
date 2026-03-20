<template>
  <div ref="documentEditModalContainer">
    <a-modal
      title="编辑文档信息"
      :visible="visible"
      :width="1000"
      ok-text="确认"
      cancel-text="取消"
      :dialog-style="{ top: '20px' }"
      class="modalBodyH152"
      :get-container="modalContainerGetter"
      @ok="handleEditConfirm"
      @cancel="handleEditCancel"
    >
      <div class="lawyer-edit-content">
        <a-form-model
          ref="form"
          :model="formData"
          :label-col="{ span: 5 }"
          :wrapper-col="{ span: 19 }"
        >
          <a-form-model-item v-if="fieldConfig.showTimeliness" label="时效性" prop="timeliness">
            <a-select v-model="formData.timeliness" placeholder="请选择时效性">
              <a-select-option value="待生效">待生效</a-select-option>
              <a-select-option value="已施行">已施行</a-select-option>
              <a-select-option value="已修订">已修订</a-select-option>
              <a-select-option value="已废止">已废止</a-select-option>
            </a-select>
          </a-form-model-item>

          <a-form-model-item v-if="fieldConfig.showCategory" label="分类" prop="categoryPath">
            <a-cascader
              v-model="formData.categoryPath"
              :options="tagOptions"
              placeholder="请选择分类"
              :show-search="true"
              :change-on-select="true"
              style="width: 100%"
            />
          </a-form-model-item>

          <a-form-model-item v-if="fieldConfig.showPublishDate" label="发布时间" prop="publishDate">
            <a-date-picker
              v-model="formData.publishDate"
              style="width: 100%"
              placeholder="请选择发布时间"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
            />
          </a-form-model-item>

          <a-form-model-item v-if="fieldConfig.showDocumentNo" label="发文字号" prop="documentNo">
            <a-input v-model="formData.documentNo" placeholder="请输入发文字号" />
          </a-form-model-item>

          <a-form-model-item v-if="fieldConfig.showAppendix" label="是否附录" prop="appendix">
            <a-switch v-model="formData.appendix" />
            <span style="margin-left: 8px; color: #666; font-size: 12px">
              {{ formData.appendix ? '是' : '否' }}
            </span>
          </a-form-model-item>

          <a-form-model-item
            v-if="fieldConfig.showEffectivenessLevel"
            label="效力位阶"
            prop="effectivenessLevel"
          >
            <a-select v-model="formData.effectivenessLevel" placeholder="请选择效力位阶">
              <a-select-option value="法律法规">法律法规</a-select-option>
              <a-select-option value="部门规章规范性文件">部门规章规范性文件</a-select-option>
              <a-select-option value="自律规则">自律规则</a-select-option>
              <a-select-option value="其他">其他</a-select-option>
            </a-select>
          </a-form-model-item>

          <a-form-model-item v-if="fieldConfig.showSource" label="来源" prop="legalSource">
            <a-select v-model="formData.legalSource" placeholder="请选择来源">
              <a-select-option
                v-for="option in websiteOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </a-select-option>
            </a-select>
          </a-form-model-item>

          <a-form-model-item v-if="fieldConfig.showEffectDate" label="生效时间" prop="effectDate">
            <a-date-picker
              v-model="formData.effectDate"
              style="width: 100%"
              placeholder="请选择生效时间"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
            />
          </a-form-model-item>

          <a-form-model-item v-if="fieldConfig.showDepartment" label="印发部门" prop="department">
            <a-select
              v-model="formData.department"
              mode="multiple"
              placeholder="请选择印发部门"
              :allow-clear="true"
              :max-tag-count="2"
              max-tag-placeholder="..."
            >
              <a-select-option
                v-for="option in departmentOptions"
                :key="option.id"
                :value="option.value"
              >
                {{ option.label }}
              </a-select-option>
            </a-select>
          </a-form-model-item>
        </a-form-model>
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts">
  import { Component, Vue, Prop, Watch, Emit } from 'nuxt-property-decorator';

  interface DocumentViewerFieldConfig {
    showTimeliness: boolean;
    showEffectivenessLevel: boolean;
    showCategory: boolean;
    showSource: boolean;
    showPublishDate: boolean;
    showEffectDate: boolean;
    showDocumentNo: boolean;
    showDepartment: boolean;
    showAppendix: boolean;
  }

  interface DocumentEditFormData {
    timeliness?: string;
    effectivenessLevel?: string;
    categoryPath?: string[];
    legalSource?: string;
    publishDate?: string;
    effectDate?: string;
    department?: string[];
    documentNo?: string;
    appendix?: boolean;
  }

  interface DocumentStatusUpdatePayload {
    timeLiness: string;
    categoryMain?: string;
    categoryId?: string;
    effectivenessLevel?: string;
    effectDate?: string;
    legalSource?: string;
    department?: string[];
    documentNo?: string;
    appendix?: boolean;
    publishDateStr?: string;
  }

  interface DocumentEditCascaderOption {
    value: string;
    label: string;
    children?: DocumentEditCascaderOption[];
  }

  interface DocumentEditSelectOption {
    id?: string;
    value: string;
    label: string;
  }

  interface DocumentEditDocumentData {
    id: string;
    timeLiness?: string;
    effectivenessLevel?: string;
    categoryId?: string;
    legalSource?: string;
    publisher?: string;
    date?: string;
    effectiveDate?: string;
    department?: string | string[];
    fileNumber?: string;
    appendix?: boolean;
  }

  @Component({
    name: 'document-edit-modal'
  })
  class DocumentEditModal extends Vue {
    @Prop({ default: false }) visible!: boolean;
    @Prop({ required: true }) document!: DocumentEditDocumentData;
    @Prop({ required: true }) fieldConfig!: DocumentViewerFieldConfig;
    @Prop({ default: () => [] }) tagOptions!: DocumentEditCascaderOption[];
    @Prop({ default: () => [] }) websiteOptions!: DocumentEditSelectOption[];
    @Prop({ default: () => [] }) departmentOptions!: DocumentEditSelectOption[];
    @Prop({ default: null }) getContainer!: (() => Element | null | undefined) | null;

    formData: DocumentEditFormData = {
      timeliness: undefined,
      effectivenessLevel: undefined,
      categoryPath: [],
      legalSource: undefined,
      publishDate: undefined,
      effectDate: undefined,
      department: [],
      documentNo: undefined,
      appendix: false
    };

    get isLawyerKnowledgePage(): boolean {
      const sourcePath = this.$route.query.source as string;
      const routePath = sourcePath || this.$route.path;
      return routePath.includes('/lawyerKnowledge');
    }

    get modalContainerGetter(): () => Element {
      return () => {
        const customContainer =
          typeof this.getContainer === 'function' ? this.getContainer() : null;
        const localContainer = this.$refs.documentEditModalContainer as Element | undefined;

        if (customContainer) {
          return customContainer;
        }

        if (localContainer) {
          return localContainer;
        }

        return document.body;
      };
    }

    @Watch('visible')
    onVisibleChange(visible: boolean): void {
      if (visible) {
        this.fillFormData();
      }
    }

    @Watch('tagOptions')
    onTagOptionsChange(): void {
      if (this.visible) {
        this.fillFormData();
      }
    }

    fillFormData(): void {
      this.formData.timeliness = this.document.timeLiness || undefined;
      this.formData.effectivenessLevel = this.document.effectivenessLevel || undefined;
      this.formData.categoryPath = [];

      if (this.document.categoryId) {
        this.formData.categoryPath = this.getCategoryPathById(this.document.categoryId);
      }

      this.formData.legalSource = this.document.legalSource || this.document.publisher || undefined;
      this.formData.publishDate = this.document.date || undefined;
      this.formData.effectDate = this.document.effectiveDate || undefined;

      if (Array.isArray(this.document.department)) {
        this.formData.department = this.document.department;
      } else if (typeof this.document.department === 'string') {
        this.formData.department = this.document.department
          .split(',')
          .map((dept: string) => dept.trim())
          .filter((dept: string) => dept);
      } else {
        this.formData.department = [];
      }

      const fileNumber = this.document.fileNumber;
      this.formData.documentNo =
        fileNumber && fileNumber !== '暂无' && fileNumber !== 'undefined' && fileNumber !== 'null'
          ? fileNumber
          : undefined;

      this.formData.appendix = !!this.document.appendix;
    }

    async handleEditConfirm(): Promise<void> {
      let hideLoading = null;

      try {
        if (
          this.isLawyerKnowledgePage &&
          (!this.formData.categoryPath || this.formData.categoryPath.length === 0)
        ) {
          this.$message.warning('请选择分类');
          return;
        }

        hideLoading = this.$message.loading('正在更新文档信息...', 0);
        const resolvedCategory = this.resolveCategoryInfo();

        const updateParams = {
          searchId: this.document.id,
          appendix: this.formData.appendix,
          timeLiness: this.formData.timeliness,
          effectivenessLevel: this.formData.effectivenessLevel,
          legalSource: this.formData.legalSource,
          publishDateStr: this.formData.publishDate,
          effectDateStr: this.formData.effectDate,
          department: this.formData.department,
          documentNo: this.formData.documentNo,
          categoryId: resolvedCategory.categoryId,
          categoryMain: resolvedCategory.categoryMain
        };

        const result = await this.$roadLawyerService.updateRuleSourceDetail(updateParams);

        if (!result.success) {
          throw new Error(result.message || '更新失败');
        }

        if (hideLoading) {
          hideLoading();
        }

        this.emitSuccess({
          timeLiness: this.formData.timeliness || '已施行',
          categoryMain: updateParams.categoryMain,
          categoryId: updateParams.categoryId,
          effectivenessLevel: this.formData.effectivenessLevel,
          effectDate: this.formData.effectDate,
          legalSource: this.formData.legalSource,
          department: this.formData.department,
          documentNo: this.formData.documentNo,
          appendix: this.formData.appendix,
          publishDateStr: this.formData.publishDate
        });

        this.$message.success('文档信息已更新');
      } catch (error) {
        if (hideLoading) {
          hideLoading();
        }

        console.error('更新文档信息失败:', error);
        this.$message.error('更新文档信息失败，请重试');
      }
    }

    handleEditCancel(): void {
      this.$emit('cancel');
    }

    resolveCategoryInfo(): { categoryId: string; categoryMain: string } {
      if (this.formData.categoryPath && this.formData.categoryPath.length > 0) {
        const lastCategoryId = this.formData.categoryPath[this.formData.categoryPath.length - 1];
        return {
          categoryId: lastCategoryId,
          categoryMain: this.getCategoryNameById(lastCategoryId)
        };
      }

      const routeCategoryId = this.getCategoryIdByRoute();
      if (routeCategoryId) {
        return {
          categoryId: routeCategoryId,
          categoryMain:
            this.getCategoryNameById(routeCategoryId) ||
            this.getCategoryNameByRoute(routeCategoryId)
        };
      }

      return {
        categoryId: '',
        categoryMain: ''
      };
    }

    getCategoryIdByRoute(): string | undefined {
      const sourcePath = this.$route.query.source as string;
      const routePath = sourcePath || this.$route.path;

      if (routePath.includes('/institutionLibrary')) {
        return '3';
      }
      if (routePath.includes('/punishmentCompilation')) {
        return '1';
      }
      if (routePath.includes('/regulationCompilation')) {
        return '2';
      }
      if (routePath.includes('/newRegulationInterpretation')) {
        return '310';
      }
      if (routePath.includes('/researchCollection')) {
        return '311';
      }
      if (routePath.includes('/legalComplianceQuarterly')) {
        return '312';
      }

      return undefined;
    }

    getCategoryNameByRoute(categoryId: string): string {
      const routeCategoryNameMap: Record<string, string> = {
        '1': '处罚汇编',
        '2': '法规汇编',
        '3': '制度库',
        '310': '新规解读',
        '311': '研究集锦',
        '312': '法律合规季刊'
      };

      return routeCategoryNameMap[categoryId] || '';
    }

    getCategoryNameById(categoryId: string): string {
      const findCategoryName = (options: DocumentEditCascaderOption[], id: string): string => {
        for (const option of options) {
          if (option.value === id) {
            return option.label;
          }

          if (option.children && option.children.length > 0) {
            const childName = findCategoryName(option.children, id);
            if (childName) {
              return childName;
            }
          }
        }

        return '';
      };

      return findCategoryName(this.tagOptions, categoryId);
    }

    getCategoryPathById(categoryId: string): string[] {
      const findCategoryPath = (
        options: DocumentEditCascaderOption[],
        id: string,
        path: string[] = []
      ): string[] => {
        for (const option of options) {
          const currentPath = [...path, option.value];

          if (option.value === id) {
            return currentPath;
          }

          if (option.children && option.children.length > 0) {
            const childPath = findCategoryPath(option.children, id, currentPath);
            if (childPath.length > 0) {
              return childPath;
            }
          }
        }

        return [];
      };

      return findCategoryPath(this.tagOptions, categoryId);
    }

    @Emit('success')
    emitSuccess(payload: DocumentStatusUpdatePayload): DocumentStatusUpdatePayload {
      return payload;
    }
  }

  export default DocumentEditModal;
</script>
