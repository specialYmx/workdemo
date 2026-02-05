# Markdown 图片鉴权方案备选
## 背景
- 页面使用 `v-md-preview` 渲染后端返回的 `fileContent`。
- 内容里包含 Markdown 图片链接（`![](https://.../parser/image/download?image_id=xxx)`）。
- 直接由浏览器发起的 `<img src>` 请求不会走 `plugins/axios.js`，因此不会自动带 Bearer Token。

## 方案一：后端图片代理（推荐，长期方案）
### 思路
- 前端把 Markdown 中的图片地址改写为同源代理地址（例如：`/legal/image-proxy?image_id=xxx`）。
- 代理接口由后端转发到真实图片服务，并在服务端请求头加入 `Authorization: Bearer <token>`。

### 典型实现步骤
1. 前端在展示前将 `fileContent` 中的图片 URL 做一次规则替换（只保留 `image_id`）。
2. 后端新增 `image-proxy` 接口：
   - 校验参数，只允许白名单域名和指定路径，避免 SSRF。
   - 读取当前用户会话或服务端可用 token。
   - 以 Bearer 请求真实图片接口，透传图片流。
   - 回传 `Content-Type`/`Cache-Control` 等头部。
3. 前端 `v-md-preview` 继续正常渲染，不需要改组件逻辑。

### 优点
- 鉴权和安全都在服务端控制，最稳定。
- 不依赖目标域 CORS。
- 更符合“Bearer 必须放 Header”的规范。

### 风险/成本
- 需要后端配合开发和部署。
- 需要明确 token 来源与失效策略。

## 方案二：前端预取图片并替换为 Blob URL（快速验证方案）
### 思路
- 在 `v-md-preview` 渲染前，前端先解析 Markdown 图片 URL。
- 用 `$axios.get(url, { responseType: 'blob' })` 请求图片（会走 axios 拦截器带 Bearer）。
- 将返回 Blob 转为 `blob:` URL，再把 Markdown 里的原 URL 替换成 `blob:` URL 后渲染。

### 典型实现步骤
1. 监听 `document.content` 变化。
2. 提取 Markdown 图片地址并去重。
3. 批量请求图片 -> 生成 `blob:` URL 映射。
4. 替换原 Markdown 链接，渲染替换后的内容。
5. 组件销毁或内容切换时 `URL.revokeObjectURL` 释放内存。

### 优点
- 不改后端，前端可快速落地。
- 适合先验证业务链路。

### 风险/成本
- 依赖目标域允许跨域且允许 Authorization（CORS 不通就失败）。
- 图片多时有额外加载耗时和内存开销。
- 需要处理并发、失败回退、内存释放。

## 选型建议
- 可改后端：优先方案一。
- 需要先快速跑通：先上方案二，再逐步切到方案一。
