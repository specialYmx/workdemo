<template>
  <div>
    <lawyer-crawl-statistics-index-component />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "nuxt-property-decorator";

@Component({ layout: "page", middleware: "auth" })
export default class CrawlStatisticsPage extends Vue {
  // 页面头部配置
  get head(): { title: string } {
    return { title: "AI魔方" };
  }
}
</script>
