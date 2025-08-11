export default function ({ store, redirect, route }) {
  // 检查用户是否已认证
  if (!store.state.auth.isAuthenticated) {
    // 如果未认证，可以重定向到登录页面
    // return redirect('/login')
    
    // 或者显示错误信息（当前项目中用户已硬编码为已认证状态）
    console.warn('用户未认证，但当前为开发模式，允许访问')
  }
  
  // 可以在这里添加其他认证逻辑
  // 例如：检查 token 是否过期、验证用户权限等
  
  // 如果需要，可以设置用户信息到 context
  // context.user = store.state.auth.user
}
