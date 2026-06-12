<template>
  <a-layout>
    <a-layout-content class="layout-content analysis-m-0">
      <road-wecom-bot-history-index-component />
    </a-layout-content>
  </a-layout>
</template>

<script lang="ts">
  import { Component, Vue } from 'nuxt-property-decorator';

  @Component({ layout: 'page', middleware: 'auth' })
  class WeComBotHistoryPage extends Vue {
    head(): { title: string } {
      return { title: '历史数据查询' };
    }
  }

  export default WeComBotHistoryPage;
</script>
