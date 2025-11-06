<template>
  <div>
    <lawyer-manual-review-index-component />
  </div>
</template>

<script lang="ts">
  import { Component, Vue } from 'nuxt-property-decorator';

  @Component({ layout: 'page', middleware: 'auth' })
  class ManualReviewPage extends Vue {
    // 页面头部配置
    head(): { title: string } {
      return { title: '法律合规智能系统' };
    }
  }
  export default ManualReviewPage;
</script>
