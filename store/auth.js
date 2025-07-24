export const state = () => ({
  id: 'DJ101015', // 硬编码的用户ID
  user: null,
  token: null,
  isAuthenticated: true
})

export const mutations = {
  SET_USER(state, user) {
    state.user = user
  },
  SET_TOKEN(state, token) {
    state.token = token
  },
  SET_AUTH_STATUS(state, status) {
    state.isAuthenticated = status
  }
}

export const actions = {
  // 这里可以添加登录、退出等操作
}

export const getters = {
  userId: state => state.id,
  isAuthenticated: state => state.isAuthenticated
} 