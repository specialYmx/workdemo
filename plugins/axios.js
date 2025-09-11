// 自动切换服务器地址的配置
const PRIMARY_SERVER = "http://10.14.10.88:9090";
const FALLBACK_SERVER = "http://10.14.10.87:9090";

// 存储当前使用的服务器地址
let currentBaseURL = PRIMARY_SERVER;
let isCheckingServer = false;

// 检查服务器是否可用的函数
async function checkServerAvailability(baseURL) {
  try {
    // 创建一个AbortController来控制超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3秒超时

    // 使用一个轻量级的API端点来检查服务器可用性
    // 使用网站比例统计接口，这个接口比较轻量且通常可用
    const response = await fetch(`${baseURL}/legal/getWebSiteRatio`, {
      method: "POST", // 使用POST方法，因为大部分API都是POST
      signal: controller.signal,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "", // 空的form data
    });

    clearTimeout(timeoutId);

    // 只要服务器有响应且不是5xx错误就认为可用
    return response.status < 500;
  } catch (error) {
    // 如果是AbortError说明超时了
    if (error.name === "AbortError") {
      console.warn(`服务器 ${baseURL} 响应超时`);
    } else {
      console.warn(`服务器 ${baseURL} 不可用:`, error.message);
    }
    return false;
  }
}

// 切换到备用服务器
async function switchToFallbackServer($axios) {
  if (isCheckingServer) return;

  isCheckingServer = true;
  console.log("正在切换到备用服务器...");

  try {
    const isFallbackAvailable = await checkServerAvailability(FALLBACK_SERVER);
    if (isFallbackAvailable) {
      currentBaseURL = FALLBACK_SERVER;
      $axios.setBaseURL(currentBaseURL);
      console.log(`已切换到备用服务器: ${currentBaseURL}`);
    } else {
      console.error("备用服务器也不可用，保持当前配置");
    }
  } catch (error) {
    console.error("切换服务器时发生错误:", error);
  } finally {
    isCheckingServer = false;
  }
}

export default function ({ $axios, redirect, store }) {
  // 初始化时设置首选服务器地址
  $axios.setBaseURL(PRIMARY_SERVER);
  currentBaseURL = PRIMARY_SERVER;
  console.log(`初始化 axios baseURL: ${currentBaseURL}`);

  // 请求拦截器
  $axios.onRequest((config) => {
    // 这里可以添加请求头等配置
    // 例如: config.headers.Authorization = `Bearer ${store.state.auth.token}`
    return config;
  });

  // 响应拦截器
  $axios.onResponse((response) => {
    return response;
  });

  // 错误拦截器
  $axios.onError(async (error) => {
    const code = parseInt(error.response && error.response.status);

    // 检查是否是网络连接错误或服务器不可用
    if (
      !error.response ||
      code >= 500 ||
      error.code === "ECONNREFUSED" ||
      error.code === "NETWORK_ERROR" ||
      error.code === "ENOTFOUND" ||
      error.code === "ETIMEDOUT"
    ) {
      // 如果当前使用的是主服务器且出现连接错误，尝试切换到备用服务器
      if (currentBaseURL === PRIMARY_SERVER && !isCheckingServer) {
        console.warn(
          `主服务器 ${PRIMARY_SERVER} 连接失败，尝试切换到备用服务器`
        );
        await switchToFallbackServer($axios);

        // 如果成功切换到备用服务器，重试当前请求
        if (currentBaseURL === FALLBACK_SERVER && error.config) {
          console.log("重试请求...", error.config.url);
          // 更新请求配置中的baseURL
          const retryConfig = {
            ...error.config,
            baseURL: currentBaseURL,
          };
          return $axios.request(retryConfig);
        }
      }
    }

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

    return Promise.reject(error);
  });

  // 定期检查主服务器是否恢复（每5分钟检查一次）
  if (process.client) {
    setInterval(async () => {
      // 如果当前使用备用服务器，检查主服务器是否恢复
      if (currentBaseURL === FALLBACK_SERVER && !isCheckingServer) {
        isCheckingServer = true;
        try {
          const isPrimaryAvailable = await checkServerAvailability(
            PRIMARY_SERVER
          );
          if (isPrimaryAvailable) {
            currentBaseURL = PRIMARY_SERVER;
            $axios.setBaseURL(currentBaseURL);
            console.log(`主服务器已恢复，切换回主服务器: ${currentBaseURL}`);
          }
        } catch (error) {
          console.warn("检查主服务器状态时发生错误:", error);
        } finally {
          isCheckingServer = false;
        }
      }
    }, 5 * 60 * 1000); // 5分钟
  }
}
