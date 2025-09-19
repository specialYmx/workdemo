export const state = () => ({
  id: "DJ101015", // 硬编码的用户ID
  user: null,
  token:
    "eyJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJESkJYIiwic3ViIjoiVXNlciBQb3J0YWwiLCJhdWQiOiJEcmlzayIsInVzZXJjb2RlIjoiREoxMDEwMTUiLCJpZGVudGl0eUNsaWVudCI6IkRKWkMiLCJpZGVudGl0eVBhcmFtMSI6IkRKMTAxMDE1IiwiaWF0IjoxNzU4MjQ0NTc5LCJleHAiOjE3NTgzMDkzNzl9.r57RYBZEU86h3f8vP3_rkdsArAqnmPqtwBjmWhHTuWUDCWFR_yPAV_SaarOLrZTGbKsHTHZsU1Wx7hftGGKF4tuoD4woualXFb2EYNKvpt4DFuWCZjbbOts1RcL8qGDjuE2oYjWoSd_GS_e83XHsRGJfzQWWbAnLKddrJtbgszTXA_At_3yvTjQL___0XO7JPB9NYys5P7m0QJz3SNqSQtVirnkOScX-9CS3ru-nzgQcUJ9SwKW8e_joEf3U09RiykOiWcOx23kOkvzzcWFjct1WlyyQrMgg-D1_yrLTEd6VkerjuYp2_JAL4uQGT94D_PMOpIN1BdYAGh4l5Z2NXg",
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
