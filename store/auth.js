export const state = () => ({
  id: "DJ101015", // 硬编码的用户ID
  user: null,
  token:
    "eyJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJESkJYIiwic3ViIjoiVXNlciBQb3J0YWwiLCJhdWQiOiJBSSIsInVzZXJjb2RlIjoiREoxMDEwMTUiLCJpZGVudGl0eUNsaWVudCI6IkRKWkMiLCJpZGVudGl0eVBhcmFtMSI6IkRKMTAxMDE1IiwiaWF0IjoxNzU1MDUwNjM1LCJleHAiOjE3NTUxMTU0MzV9.gpMylZ-XHNYDdoiEhFm3etODHVUm8dVf7cWAxC9VRFaRWWDZceqyky3Tlfb0AFsOgEmoGIDTadISPrfbttjlyXNsQubVBsdKsCbCvtdb-Y5aYGYSGpyfh71CxVB5Cz3eLtn31foWSbway7bWI-0GAKWBribR0E-Q1_RaA-pgJyPpMwtLsBQT58yFGU8QvDqzND3oK3OORo-rIsUOa9pYict_cfvRXNeT_DIcoCJ0IcWApS5WQiQn7tHjunNEzr99gVdCGvp-jq7kt30N1wpcZew-cDddNVvssLf32Zu4rVaUnRuhej_DATwQUseU8sH1Viuvl5Sv8ic1QM-hMeFTIw",
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
