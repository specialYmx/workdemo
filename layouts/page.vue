<template>
  <a-config-provider :locale="locale">
    <div class="lawyer-app-layout">
      <header class="lawyer-top-header">
        <div class="lawyer-top-header-content">
          <router-link to="/" class="lawyer-top-logo">
            <a-icon type="balance" />
            法律合规智能系统
          </router-link>
          <nav class="lawyer-nav-links">
            <nuxt-link
              to="/"
              class="lawyer-nav-link"
              exact-active-class="active"
            >
              <a-icon type="home" />
              首页概览
            </nuxt-link>
            <nuxt-link
              to="/lawyerKnowledge"
              class="lawyer-nav-link"
              exact-active-class="active"
            >
              <a-icon type="book" />
              大家智库
            </nuxt-link>
            <nuxt-link
              to="/lawyerUpdate"
              class="lawyer-nav-link"
              exact-active-class="active"
            >
              <a-icon type="file-text" />
              法规更新
              <span class="lawyer-badge">5</span>
            </nuxt-link>
            <nuxt-link
              to="/manualReview"
              class="lawyer-nav-link"
              exact-active-class="active"
            >
              <a-icon type="audit" />
              人工审核
              <span class="lawyer-badge">3</span>
            </nuxt-link>
            <nuxt-link
              to="/crawlStatistics"
              class="lawyer-nav-link"
              exact-active-class="active"
            >
              <a-icon type="bar-chart" />
              爬取统计
            </nuxt-link>
            <nuxt-link
              to="/crawlConfig"
              class="lawyer-nav-link"
              exact-active-class="active"
            >
              <a-icon type="setting" />
              爬取配置
            </nuxt-link>
          </nav>
        </div>
      </header>
      <main class="lawyer-main-content">
        <nuxt />
      </main>
    </div>
  </a-config-provider>
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'
import zhCN from 'ant-design-vue/lib/locale-provider/zh_CN'

@Component
export default class PageLayout extends Vue {
  locale = zhCN;
}
</script>

<style lang="less">
@import "~/assets/styles/lawyer.less";
</style>
