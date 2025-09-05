export const state = () => ({
  id: "DJ101015", // 硬编码的用户ID
  user: null,
  token:
    "eyJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJESkJYIiwic3ViIjoiVXNlciBQb3J0YWwiLCJhdWQiOiJEcmlzayIsInVzZXJjb2RlIjoiREoxMDEwMTUiLCJpZGVudGl0eUNsaWVudCI6IkRKWkMiLCJpZGVudGl0eVBhcmFtMSI6IkRKMTAxMDE1IiwiaWF0IjoxNzU2Nzc1OTAzLCJleHAiOjE3NTY4NDA3MDN9.gwqH2sOzTsXWPAuiX6U-j8_iM0C8RT9j3Z6lyXDumTleJzY8PytsNcj5mXyJ63k4yeW4ehWDlN69O8nN0420drqI1wjuR96O5BSniB4oLVnmMCMX3CRKU6nI7-HqDZf8yGBmmJ7JQ0wnfh484s9vfeiz3dEKyQEVyFuQPr7Jz6U7GhSc78xeg6TtJbIVvHcHQ4Zsu-jAh3jdAZ3DsF9mW3Q_FCXT49SrILDBkleVMHHgizE7UCYG702suI1IueyqeKx7S_9TaKtp6FolGWbDNTccr9AiAQsvXS_pwHCwHLXRmK3kzmlS9XdeBCvFT1AS8kEKPWy5VotihQjye4X5Cw",
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
