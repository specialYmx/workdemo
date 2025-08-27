<template>
  <div>
    <lawyer-knowledge-index-component />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'

@Component({ layout: 'page', middleware: 'auth' })
export default class LawyerKnowledgePage extends Vue {
  // 页面头部配置
  head(): { title: string } {
    return { title: '法律合规智能系统' }
  }
}
</script>
