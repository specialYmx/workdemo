<template>
  <div>
    <lawyer-crawl-config-index-component />
  </div>
</template>

<script lang="ts">
  import { Component, Vue } from 'nuxt-property-decorator';

  @Component({ layout: 'page', middleware: 'auth' })
  class CrawlConfigPage extends Vue {
    // 页面头部配置
    head(): { title: string } {
      return { title: '爬取配置管理 - 法律合规智能系统' };
    }
  }
  export default CrawlConfigPage;
</script>
