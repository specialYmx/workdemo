export { default as CommonChartComponent } from '../..\\components\\common\\ChartComponent.vue'
export { default as CommonDivTextSearch } from '../..\\components\\common\\DivTextSearch.vue'
export { default as CommonDocumentAIChat } from '../..\\components\\common\\DocumentAIChat.vue'
export { default as CommonFileUploadModal } from '../..\\components\\common\\FileUploadModal.vue'
export { default as DocumentCompare } from '../..\\components\\document\\DocumentCompare.vue'
export { default as DocumentViewer } from '../..\\components\\document\\DocumentViewer.vue'

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
