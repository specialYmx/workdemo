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
            <nuxt-link to="/" class="lawyer-nav-link" exact-active-class="active">
              <a-icon type="home" />
              首页概览
            </nuxt-link>
            <a-dropdown :trigger="['click']">
              <a
                href="#"
                :class="[
                  'lawyer-nav-link',
                  'lawyer-nav-dropdown-trigger',
                  { active: isLegalKnowledgeRoute }
                ]"
                @click.prevent
              >
                <a-icon type="book" />
                法律智库
                <a-icon type="down" />
              </a>
              <a-menu slot="overlay" @click="handleLegalKnowledgeMenuClick">
                <a-menu-item key="/lawyerKnowledge">大家智库</a-menu-item>
                <a-menu-item key="/regulationCompilation">法规汇编</a-menu-item>
                <a-menu-item key="/punishmentCompilation">处罚汇编</a-menu-item>
                <a-menu-item key="/researchCollection">专题研究</a-menu-item>
                <a-menu-item key="/legalComplianceQuarterly">法律合规季刊</a-menu-item>
                <a-menu-item key="/institutionLibrary">制度库</a-menu-item>
                <a-menu-item key="/newRegulationInterpretation">新规解读</a-menu-item>
              </a-menu>
            </a-dropdown>
            <nuxt-link to="/lawyerUpdate" class="lawyer-nav-link" exact-active-class="active">
              <a-icon type="file-text" />
              法规更新
              <span class="lawyer-badge">5</span>
            </nuxt-link>
            <nuxt-link to="/manualReview" class="lawyer-nav-link" exact-active-class="active">
              <a-icon type="audit" />
              人工审核
              <span class="lawyer-badge">3</span>
            </nuxt-link>
            <a-dropdown :trigger="['click']">
              <a
                href="#"
                :class="[
                  'lawyer-nav-link',
                  'lawyer-nav-dropdown-trigger',
                  { active: isWeComBotRoute }
                ]"
                @click.prevent
              >
                <a-icon type="message" />
                机器人与群聊管理
                <a-icon type="down" />
              </a>
              <a-menu slot="overlay" @click="handleWeComBotMenuClick">
                <a-menu-item key="/wecomBot">机器人与群聊管理</a-menu-item>
                <a-menu-item key="/wecomBot/robot">机器人管理</a-menu-item>
                <a-menu-item key="/wecomBot/groupChat">群聊管理</a-menu-item>
                <a-menu-item key="/wecomBot/history">历史数据查询</a-menu-item>
              </a-menu>
            </a-dropdown>
            <a-dropdown :trigger="['click']">
              <a
                href="#"
                :class="[
                  'lawyer-nav-link',
                  'lawyer-nav-dropdown-trigger',
                  { active: isCrawlManageRoute }
                ]"
                @click.prevent
              >
                <a-icon type="bar-chart" />
                爬取管理
                <a-icon type="down" />
              </a>
              <a-menu slot="overlay" @click="handleCrawlManageMenuClick">
                <a-menu-item key="/crawlStatistics">爬取统计</a-menu-item>
                <a-menu-item key="/taskHistory">执行记录</a-menu-item>
                <a-menu-item key="/crawlConfig">爬取配置</a-menu-item>
              </a-menu>
            </a-dropdown>
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
  import { Component, Vue } from 'nuxt-property-decorator';
  import zhCN from 'ant-design-vue/lib/locale-provider/zh_CN';

  @Component
  class PageLayout extends Vue {
    locale = zhCN;

    legalKnowledgeRoutes: string[] = [
      '/lawyerKnowledge',
      '/regulationCompilation',
      '/punishmentCompilation',
      '/researchCollection',
      '/legalComplianceQuarterly',
      '/institutionLibrary',
      '/newRegulationInterpretation'
    ];

    crawlManageRoutes: string[] = ['/crawlStatistics', '/taskHistory', '/crawlConfig'];

    get isLegalKnowledgeRoute(): boolean {
      return this.legalKnowledgeRoutes.some(routePath => this.$route.path.startsWith(routePath));
    }

    get isCrawlManageRoute(): boolean {
      return this.crawlManageRoutes.some(routePath => this.$route.path.startsWith(routePath));
    }

    get isWeComBotRoute(): boolean {
      return this.$route.path.startsWith('/wecomBot');
    }

    handleLegalKnowledgeMenuClick({ key }: { key: string }): void {
      this.$router.push(key);
    }

    handleCrawlManageMenuClick({ key }: { key: string }): void {
      this.$router.push(key);
    }

    handleWeComBotMenuClick({ key }: { key: string }): void {
      this.$router.push(key);
    }
  }
  export default PageLayout;
</script>

<style lang="less">
  @import '~/assets/styles/lawyer.less';
</style>
