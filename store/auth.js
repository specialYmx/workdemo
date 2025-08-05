export const state = () => ({
  id: "DJ101015", // 硬编码的用户ID
  user: null,
  token:
    "eyJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJESkJYIiwic3ViIjoiVXNlciBQb3J0YWwiLCJhdWQiOiJBSSIsInVzZXJjb2RlIjoiREoxMDEwMTUiLCJpZGVudGl0eUNsaWVudCI6IkRKWkMiLCJpZGVudGl0eVBhcmFtMSI6IkRKMTAxMDE1IiwiaWF0IjoxNzU0MzU2NTExLCJleHAiOjE3NTQ0MjEzMTF9.DPNVyo8V4iqBjxtJGT-aDbOuWfZ6xLBwYJB5ERD2ILCXtJuo4Icq3wo31OITfOhqhi6UUDUDRRRMzZf5mg7QlYCcwZS7fWaibHwrlPR_OadyLOb1jW30pRz2mqlYqLdKhU_ohoB24i0lAX2N4SuY0NOabcR18EGf4tTXYNxdS0eJ0UAqUx76qROYcsSpVX782UxlPpTYqlE25d8Xi-kQzyF31BOI2etkMPmD0INxlzr4EtiZFYIWkR8AlnkX9HjzYhnWoA34WyIMy2DeyTIWsYlw1fwT2ym6hkvtbm0es9gQfxptIqj9hvUIplQPQ_Ldl24_QN5E3imb-A76U8LQgw",
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
