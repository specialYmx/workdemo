export const state = () => ({
  id: 'DJ101015', // 硬编码的用户ID
  user: null,
  token:
    'eyJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJESkJYIiwic3ViIjoiVXNlciBQb3J0YWwiLCJhdWQiOiJMS1IiLCJ1c2VyY29kZSI6IkRKMTAxMDE1IiwiaWRlbnRpdHlDbGllbnQiOiJESlpDIiwiaWRlbnRpdHlQYXJhbTEiOiJESjEwMTAxNSIsImlhdCI6MTc4MTA3MDk2NiwiZXhwIjoxNzgxMTM1NzY2fQ.gaAAsW1j9ABNgvqe0rLI0dIlNCIhDTPyv8ewDaL63PBXhhanQ8ZQspYZ6if02Xv2mYB9fYiujGbwtbiAabfjcB2pEHWuaZX3q7jaRTsrVNH-KbXxG0EKHxS8tVW6KPWObL4grGcR2PsiFgtQnLl_-L9hTRy1z5m4nsnjp4_ZiVSvJRy-wefzO0zLtHKRuN8xeLm7_eD_xyJsApXeByUqnL_69wzOOxve9s_H7OAPQ0YrvVtWVnwOjq-Y9vkYP3eXI7RbL19xXa5XAzKW_OEHbHXQhXBzFRaPway6uFLbbIr4vggyocYkQ4e7NeZRMkM2cbCzt8sFrijlr0mrDzzUCQ',
  isAuthenticated: true
});

export const mutations = {
  SET_USER(state, user) {
    state.user = user;
  },
  SET_TOKEN(state, token) {
    state.token = token;
  },
  SET_AUTH_STATUS(state, status) {
    state.isAuthenticated = status;
  }
};

export const actions = {
  // 这里可以添加登录、退出等操作
};

export const getters = {
  userId: state => state.id,
  isAuthenticated: state => state.isAuthenticated
};
