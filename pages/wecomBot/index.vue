<template>
  <a-layout>
    <a-layout-content class="layout-content analysis-m-0">
      <road-wecom-bot-config-index-component />
    </a-layout-content>
  </a-layout>
</template>

<script lang="ts">
  import { Component, Vue } from 'nuxt-property-decorator';

  @Component({ layout: 'page', middleware: 'auth' })
  class WeComBotConfigPage extends Vue {
    head(): { title: string } {
      return { title: '机器人与群聊管理' };
    }
  }

  export default WeComBotConfigPage;
</script>
