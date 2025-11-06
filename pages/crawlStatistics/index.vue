<template>
  <div>
    <lawyer-crawl-statistics-index-component />
  </div>
</template>

<script lang="ts">
  import { Component, Vue } from 'nuxt-property-decorator';

  @Component({ layout: 'page', middleware: 'auth' })
  class CrawlStatisticsPage extends Vue {
    // 页面头部配置
    get head(): { title: string } {
      return { title: 'AI魔方' };
    }
  }
  export default CrawlStatisticsPage;
</script>
