export const state = () => ({
  id: "DJ101015", // 硬编码的用户ID
  user: null,
  token:
    "eyJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJESkJYIiwic3ViIjoiVXNlciBQb3J0YWwiLCJhdWQiOiJuZXdDcmVkaXQiLCJ1c2VyY29kZSI6IkRKMTAxMDE1IiwiaWRlbnRpdHlDbGllbnQiOiJESlpDIiwiaWRlbnRpdHlQYXJhbTEiOiJESjEwMTAxNSIsImlhdCI6MTc1NzkwMjEzMCwiZXhwIjoxNzU3OTY2OTMwfQ.VDWFYEOmeHGQdKdPmaWJKg_2baqY-6kr6K-IM-4a6X7mm9XTavoiy2snn5MsCdRZtzVCFsoCHuzNKSuF6XoAQjnI1HUgih8Xc1veFPyuapNlCx5Zycs7AY0TnxNfYPGnf-xcI8jTLGxBfmp3dNz1TcY6fGCP10Hz8-RkAAsNueBtmCKRmkh7T3FTOXqXLQS7vvXlWjeoUu2EpdSKPOuiQY2lVZJcbYcmOY8sP26whZrWKkYS_5sd1xwExNLLSN24HvOizy-M4CpWfGTv3OGyenKSsdHYChhm3VPjCEUIFxsLjMYAFWY7WzUsUReZ4-jbvg7J2026I974OhC2ONIB_Q",
  isAuthenticated: true,
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
  },
};

export const actions = {
  // 这里可以添加登录、退出等操作
};

export const getters = {
  userId: (state) => state.id,
  isAuthenticated: (state) => state.isAuthenticated,
};
