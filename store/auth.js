export const state = () => ({
  id: "DJ101015", // 硬编码的用户ID
  user: null,
  token:
    "eyJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJESkJYIiwic3ViIjoiVXNlciBQb3J0YWwiLCJhdWQiOiJ1YyIsInVzZXJjb2RlIjoiREoxMDEwMTUiLCJpZGVudGl0eUNsaWVudCI6IkRKWkMiLCJpZGVudGl0eVBhcmFtMSI6IkRKMTAxMDE1IiwiaWF0IjoxNzU4MDcyOTUwLCJleHAiOjE3NTgxMzc3NTB9.LVYymxfPubDqE_d-oe_vQNuGwZQaV2KAI9aPHuBEILGdisRuFP3rSlDzHrkj3c-qBmtFRm7J1rqynnliNn9_mKXLUPtNns15q1LJWwW7thD7aPDESdbs56XiZ72jeuPpFbMB8X8p-iE5M-IkU5nFru8Pt3akQKq5neE2BwaP00lKMko94aJoo_fVomcW343VoNSiAYOrPJADoM7Ob_awmuNo-vKAunILhf1JW8LJsbKFJGi3xFwPzvNM9AMeh_2707m127gBQTbcExKqKfWngt0s_WXNflcWnPci4d_Sawn8n2hk7_B8D3OJfohNJzrzExleBFhIb6wR3sTnbekTKA",
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
