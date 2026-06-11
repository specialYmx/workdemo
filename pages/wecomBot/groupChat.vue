<template>
  <a-layout>
    <a-layout-content class="layout-content">
      <road-wecom-bot-group-chat-index-component />
    </a-layout-content>
  </a-layout>
</template>

<script lang="ts">
  import { Component, Vue } from 'nuxt-property-decorator';

  @Component({ layout: 'page', middleware: 'auth' })
  class WeComBotGroupChatPage extends Vue {
    head(): { title: string } {
      return { title: '群聊管理' };
    }
  }

  export default WeComBotGroupChatPage;
</script>
