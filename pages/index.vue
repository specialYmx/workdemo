<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator'

@Component({ middleware: 'auth' })
export default class IndexPage extends Vue {
    // 页面加载时重定向到 lawyerIndex
    mounted() {
        this.$router.push('/lawyerIndex')
    }

    // 页面头部配置
    head(): { title: string } {
        return { title: '法律合规智能系统' }
    }
}
</script>
