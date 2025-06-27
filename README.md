# 法律合规智能系统

使用Vue2 + Nuxt + Ant Design Vue 1.6实现的法律合规智能系统前端。这个项目包含了四个主页面和两个详情页面。

## 技术栈

- Vue 2
- Nuxt.js
- TypeScript
- Ant Design Vue 1.6.x
- Less

## 系统功能

该系统包含4个主要页面：

1. **首页概览**：显示法律合规分析数据和风险事件
2. **大家智库**：查询和浏览法律法规内容、研究报告及案例分析
3. **法规更新**：查看最新法规动态和更新
4. **人工审核**：审核和管理法律法规文档的变更和更新

以及2个详情页面：

1. **文档详情**（大家智库和法规更新的详情）：完整展示法规文档内容
2. **文档对比**（首页概览和人工审核的对比详情）：对比显示文档修订差异

## 项目结构

```
law/
├── assets/
│   └── styles/
│       └── global.less   # 全局样式
├── components/          # 公共组件
├── layouts/
│   └── default.vue      # 默认布局（包含导航栏）
├── pages/
│   ├── index.vue        # 首页概览
│   ├── knowledge/
│   │   └── index.vue    # 大家智库
│   ├── updates/
│   │   └── index.vue    # 法规更新
│   ├── db/
│   │   └── index.vue    # 人工审核
│   ├── document/
│   │   └── _id.vue      # 文档详情页面
│   └── document-compare/
│       └── _id.vue      # 文档对比页面
├── plugins/
│   ├── ant-design-vue.js # Ant Design Vue 按需引入
│   └── axios.js          # Axios 配置
├── static/              # 静态资源
├── store/               # Vuex 存储
├── types/               # TypeScript 类型定义
├── nuxt.config.js       # Nuxt 配置
└── tsconfig.json        # TypeScript 配置
```

## 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm run start

# 生成静态站点
npm run generate
```

## 浏览器兼容性

- Chrome (最近两个版本)
- Firefox (最近两个版本)
- Edge (最近两个版本)
- Safari (最近两个版本)

## 未来计划

- 添加单元测试和集成测试
- 实现用户认证系统
- 增加法规文档搜索功能
- 添加更多数据可视化图表 