export const state = () => ({
  id: 'DJ101015', // 硬编码的用户ID
  user: null,
  token:
    'eyJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJESkJYIiwic3ViIjoiVXNlciBQb3J0YWwiLCJhdWQiOiJBSVJTIiwidXNlcmNvZGUiOiJESjEwMTAxNSIsImlkZW50aXR5Q2xpZW50IjoiREpaQyIsImlkZW50aXR5UGFyYW0xIjoiREoxMDEwMTUiLCJpYXQiOjE3ODExNTc3MTksImV4cCI6MTc4MTIyMjUxOX0.Z6bnOKlHfyr9eM3Wxpd_T-T005kwT37sWIXSWK4gEKUSwYaEuajLwu1BwA6li1LOyusAPUB0xt4M-UqVD2_oEHS2Esus4kELmrlG67WRB3Ksv2w3_Vcebiq-xqn8d_A3BpTirafk8JsPqUlEuF_j-8xi0MLNSdgKjeIFs-R4aVAt_eKASkk_j1JF65ixf63WU-Pgd7QpZZK_XWj8nB1MKD7j7kGW_fdyRYV3cwur3I936EI4iGw6ibHqazQ6B70zOEbIeBal2ClV_QpNlx1LG3RPwI3aFRjKFh_qeB13NdNt8IGEhv6dexev_hTFViACmmQX8Uyqk5WhgTvbzPTuRg',
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
