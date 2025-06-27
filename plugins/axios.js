export default function ({ $axios, redirect, store }) {
  // 请求拦截器
  $axios.onRequest((config) => {
    // 这里可以添加请求头等配置
    // 例如: config.headers.Authorization = `Bearer ${store.state.auth.token}`
    return config
  })

  // 响应拦截器
  $axios.onResponse((response) => {
    return response
  })

  // 错误拦截器
  $axios.onError((error) => {
    const code = parseInt(error.response && error.response.status)
    
    if (code === 401) {
      // 未授权处理
      // redirect('/login')
    }
    
    if (code === 404) {
      // 资源不存在处理
      // redirect('/404')
    }
    
    if (code === 500) {
      // 服务器错误处理
      // redirect('/500')
    }
    
    return Promise.reject(error)
  })
} 