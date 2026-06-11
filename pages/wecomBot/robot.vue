<template>
  <a-layout>
    <a-layout-content class="layout-content">
      <road-wecom-bot-robot-index-component />
    </a-layout-content>
  </a-layout>
</template>

<script lang="ts">
  import { Component, Vue } from 'nuxt-property-decorator';

  @Component({ layout: 'page', middleware: 'auth' })
  class WeComBotRobotPage extends Vue {
    head(): { title: string } {
      return { title: '机器人管理' };
    }
  }

  export default WeComBotRobotPage;
</script>
