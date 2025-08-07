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

    // 配置主题，增加更宽松的解析选项
    VMdPreview.default.use(GithubTheme.default, {
      Hljs: hljs.default,
      extend(md) {
        // 配置 markdown-it 解析器，使其更宽松
        md.set({
          html: true, // 允许 HTML 标签
          xhtmlOut: false, // 使用 HTML 而不是 XHTML
          breaks: true, // 将换行符转换为 <br>
          linkify: true, // 自动识别链接
          typographer: true, // 启用智能引号和其他排版替换
        });
      },
    });

    // 注册到 Vue
    Vue.use(VMdPreview.default);

    console.log("v-md-preview 加载完成");
  } catch (error) {
    console.error("v-md-preview 加载失败:", error);
  }
};
