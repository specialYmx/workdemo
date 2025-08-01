export const state = () => ({
  id: "DJ101015", // 硬编码的用户ID
  user: null,
  token:
    "eyJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJESkJYIiwic3ViIjoiVXNlciBQb3J0YWwiLCJhdWQiOiJwcm9kdWN0IiwidXNlcmNvZGUiOiJESjEwMTAxNSIsImlkZW50aXR5Q2xpZW50IjoiREpaQyIsImlkZW50aXR5UGFyYW0xIjoiREoxMDEwMTUiLCJpYXQiOjE3NTM5MjkwNTQsImV4cCI6MTc1Mzk5Mzg1NH0.knIL-O62XoXqAyAC8Mj0D-ixiz2iG6B0uMVvrLtfjfKDRusoI4kT852MlfuVzZc1MLHsjxfwgPmBkz_IFXZH3Vl9W7j6DR37FAb2SMWH_UOaBtPwqdpUdv0FYRB94BrAyojaeG_JHpGYlqCVloJELautxJagM0xhOaX4w_kEyHUKitdJCIWVLioL5ob8gIppwClAhfxGyW6_vPpAViofAAGwZS2bSCaFIqeNkLCzRLVHDFGbo65s2F22gxEEocRtRzE8zrqQCYpFVJvCI25kzv7LBOZinreO9VMtvj-LWKVlpDav07IiH3GT6BG-qV_YBzYFCmC58T8TBA7V_vzIIA",
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
