<template>
  <div>
    <lawyer-task-history-index-component />
  </div>
</template>

<script lang="ts">
  import { Component, Vue } from 'nuxt-property-decorator';

  @Component({ layout: 'page', middleware: 'auth' })
  class TaskHistoryPage extends Vue {
    get head() {
      return {
        title: '法律智库服务'
      };
    }
  }
  export default TaskHistoryPage;
</script>
