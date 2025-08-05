export const CommonChartComponent = () => import('../..\\components\\common\\ChartComponent.vue' /* webpackChunkName: "components/common-chart-component" */).then(c => wrapFunctional(c.default || c))
export const CommonDivTextSearch = () => import('../..\\components\\common\\DivTextSearch.vue' /* webpackChunkName: "components/common-div-text-search" */).then(c => wrapFunctional(c.default || c))
export const CommonDocumentAIChat = () => import('../..\\components\\common\\DocumentAIChat.vue' /* webpackChunkName: "components/common-document-a-i-chat" */).then(c => wrapFunctional(c.default || c))
export const CommonFileUploadModal = () => import('../..\\components\\common\\FileUploadModal.vue' /* webpackChunkName: "components/common-file-upload-modal" */).then(c => wrapFunctional(c.default || c))
export const DocumentCompare = () => import('../..\\components\\document\\DocumentCompare.vue' /* webpackChunkName: "components/document-compare" */).then(c => wrapFunctional(c.default || c))
export const DocumentViewer = () => import('../..\\components\\document\\DocumentViewer.vue' /* webpackChunkName: "components/document-viewer" */).then(c => wrapFunctional(c.default || c))
export const IndexDashboardOverview = () => import('../..\\components\\index\\DashboardOverview.vue' /* webpackChunkName: "components/index-dashboard-overview" */).then(c => wrapFunctional(c.default || c))
export const IndexLatestUpdates = () => import('../..\\components\\index\\LatestUpdates.vue' /* webpackChunkName: "components/index-latest-updates" */).then(c => wrapFunctional(c.default || c))
export const IndexReviewTable = () => import('../..\\components\\index\\ReviewTable.vue' /* webpackChunkName: "components/index-review-table" */).then(c => wrapFunctional(c.default || c))
export const IndexSourceDistribution = () => import('../..\\components\\index\\SourceDistribution.vue' /* webpackChunkName: "components/index-source-distribution" */).then(c => wrapFunctional(c.default || c))

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
