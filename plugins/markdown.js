import Vue from "vue";

export default async ({ app: { context } }) => {
  // 简化逻辑：在所有页面都加载 v-md-preview 组件
  console.log(
    "开始加载 v-md-preview -- v-md-editor",
    "路径:",
    context.route.fullPath
  );

  try {
    // 动态导入 v-md-editor 组件
    const VMdPreview = await import("@kangc/v-md-editor/lib/preview");
    const GithubTheme = await import("@kangc/v-md-editor/lib/theme/github.js");
    const hljs = await import("highlight.js");

    // 配置主题
    VMdPreview.default.use(GithubTheme.default, {
      Hljs: hljs.default,
    });

    // 注册到 Vue
    Vue.use(VMdPreview.default);

    console.log("v-md-preview 加载完成");
  } catch (error) {
    console.error("v-md-preview 加载失败:", error);
  }
};
