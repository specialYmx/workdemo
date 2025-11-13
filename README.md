## 项目说明

- 本次更新优化了 `components/lawyer/knowledge/FilterOptions.vue` 中筛选项布局，去除冗余的 Flex 相关样式，仅保留 `min-width: 200px`，并为分类级联选择器新增 320px 宽度以提升可读性。
- 本次更新将律师模块相关组件中仅用于类型标注的导入调整为 `import type` 形式，避免运行时请求不存在的导出并消除构建阶段的 TypeScript 报错与告警。

## 优化建议

- 建议后续根据不同分辨率进一步调优筛选器宽度，例如使用响应式断点或 `@media` 查询实现自适应长度，以保持整体布局协调。
- 建议检查 `tsconfig.json` 中的 `importsNotUsedAsValues` 设置，并保持团队约定使用 `import type` 习惯，以从源头避免类似问题再次出现。

