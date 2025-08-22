export { default as LawyerIndexComponent } from '../..\\components\\lawyer\\indexComponent.vue'
export { default as LawyerCommonChartComponent } from '../..\\components\\lawyer\\common\\ChartComponent.vue'
export { default as LawyerCommonDivTextSearch } from '../..\\components\\lawyer\\common\\DivTextSearch.vue'
export { default as LawyerCommonDocumentAIChat } from '../..\\components\\lawyer\\common\\DocumentAIChat.vue'
export { default as LawyerCommonFileUploadModal } from '../..\\components\\lawyer\\common\\FileUploadModal.vue'
export { default as LawyerDocumentCompare } from '../..\\components\\lawyer\\document\\DocumentCompare.vue'
export { default as LawyerDocumentViewer } from '../..\\components\\lawyer\\document\\DocumentViewer.vue'
export { default as LawyerIndexDashboardOverview } from '../..\\components\\lawyer\\index\\DashboardOverview.vue'
export { default as LawyerIndexLatestUpdates } from '../..\\components\\lawyer\\index\\LatestUpdates.vue'
export { default as LawyerIndexReviewTable } from '../..\\components\\lawyer\\index\\ReviewTable.vue'
export { default as LawyerIndexSourceDistribution } from '../..\\components\\lawyer\\index\\SourceDistribution.vue'
export { default as LawyerCrawlStatisticsIndexComponent } from '../..\\components\\lawyer\\crawlStatistics\\indexComponent.vue'
export { default as LawyerKnowledgeDetailComponent } from '../..\\components\\lawyer\\knowledge\\detailComponent.vue'
export { default as LawyerKnowledgeIndexComponent } from '../..\\components\\lawyer\\knowledge\\indexComponent.vue'
export { default as LawyerUpdatesDetailComponent } from '../..\\components\\lawyer\\updates\\detailComponent.vue'
export { default as LawyerUpdatesIndexComponent } from '../..\\components\\lawyer\\updates\\indexComponent.vue'
export { default as LawyerManualReviewDetailComponent } from '../..\\components\\lawyer\\manualReview\\detailComponent.vue'
export { default as LawyerManualReviewIndexComponent } from '../..\\components\\lawyer\\manualReview\\indexComponent.vue'

// nuxt/nuxt.js#8607
function wrapFunctional(options) {
  if (!options || !options.functional) {
    return options
  }

  const propKeys = Array.isArray(options.props) ? options.props : Object.keys(options.props || {})

  return {
    render(h) {
      const attrs = {}
      const props = {}

      for (const key in this.$attrs) {
        if (propKeys.includes(key)) {
          props[key] = this.$attrs[key]
        } else {
          attrs[key] = this.$attrs[key]
        }
      }

      return h(options, {
        on: this.$listeners,
        attrs,
        props,
        scopedSlots: this.$scopedSlots,
      }, this.$slots.default)
    }
  }
}
