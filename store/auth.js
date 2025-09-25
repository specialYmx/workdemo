export const state = () => ({
  id: "DJ101015", // 硬编码的用户ID
  user: null,
  token:
    "eyJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJESkJYIiwic3ViIjoiVXNlciBQb3J0YWwiLCJhdWQiOiJwcm9kdWN0IiwidXNlcmNvZGUiOiJESjEwMTAxNSIsImlkZW50aXR5Q2xpZW50IjoiREpaQyIsImlkZW50aXR5UGFyYW0xIjoiREoxMDEwMTUiLCJpYXQiOjE3NTg3Njk2NzgsImV4cCI6MTc1ODgzNDQ3OH0.pOqLdkO2pT7zod7tftVF8W5WY2G-LdYlCvWKapaCeJwjFAe3nm78vMKhi_lmsgaTWlupsSyxVf_tIiA1DqZbYJIyJdUQVY5Z6XzOO_PNJa5b-oPknZ8xxCOHTEl-ciVsrmp2z_wkknoEa7a1FnMlJGR2-fNGDtc5iX0exgdlJLAzTQise86MJ9Uq-8PHtgdSB_xOszJs20FLHN_TeHeO7ojOyBaQqKjgtwFg7_Gp1tuWZNcoGweznynqI3nR_4n2vWdhn_w83nPaZUEMFWJhVNeHlKvUC9dUAuQvGnhc_GD2TjqGwoApx2dx7Eg4rz-9VbMxBEGgMh0R68N9yEu3AQ",
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
