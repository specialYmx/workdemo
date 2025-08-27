export const state = () => ({
  id: 'DJ101015', // 硬编码的用户ID
  user: null,
  token:
    'eyJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJESkJYIiwic3ViIjoiVXNlciBQb3J0YWwiLCJhdWQiOiJEZXBvc2l0IiwidXNlcmNvZGUiOiJESjEwMTAxNSIsImlkZW50aXR5Q2xpZW50IjoiREpaQyIsImlkZW50aXR5UGFyYW0xIjoiREoxMDEwMTUiLCJpYXQiOjE3NTUyMjIxNDYsImV4cCI6MTc1NTI4Njk0Nn0.md7PcIwQKH0MOPq1uwdm6Q2-Q8j62lAipA4wMMVpV1bVIjdRymJMHABC_y5m_dA9ahUEzWBUpOJYyA9JIAxpAfklpaFKOM80Vvx0xNmXEiBHro_rDKpM6HKfnvcaZXAc38SK-oMIGRnz1PKagb6HleJcITc3fyabvZmiz-z2aMHc8XL_jUMdbCWNEv-5kInHISVT7r8gtYi9C5H99x2X6ZH-v5pWWY6m7hwwWgFjVO0ZlQK62jJFd4ewRN5BqSgxqa2mv4CYTIxO_VegN9hXyGZjMPKWkw4brYZ3mM_CMqH5q5XRA_f5mo1W5Pc_J6Gr807YH46TbMtMpaVMcC4P6Q',
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
