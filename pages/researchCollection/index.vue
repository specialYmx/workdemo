<template>
  <div>
    <lawyer-knowledge-index-component />
  </div>
</template>

<script lang="ts">
  import { Component, Vue } from 'nuxt-property-decorator';

  @Component({ layout: 'page', middleware: 'auth' })
  class ResearchCollection311Page extends Vue {
    // 页面头部配置
    head(): { title: string } {
      return { title: '专题研究 - 法律合规智能系统' };
    }
  }
  export default ResearchCollection311Page;
</script>
