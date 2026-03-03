export const state = () => ({
  id: 'DJ101015', // 硬编码的用户ID
  user: null,
  token:
    'eyJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJESkJYIiwic3ViIjoiVXNlciBQb3J0YWwiLCJhdWQiOiJMS1IiLCJ1c2VyY29kZSI6IkRKMTAxMDE1IiwiaWRlbnRpdHlDbGllbnQiOiJESlpDIiwiaWRlbnRpdHlQYXJhbTEiOiJESjEwMTAxNSIsImlhdCI6MTc3MjA4Nzg4MywiZXhwIjoxNzcyMTUyNjgzfQ.q_lGThUTV939bgw70JkcUaMTrTrgWT5N1Frf3hzf2cWOzrXl-ittg8OUcVsk0B87OlqbHCqu6zLe4NLYxTcx2xxKcH7o9cgZl9lgCSrJOZsyzdnqG6g-TS6YNKDfviSsvxxBVNbYYhyo3KQ7vHha65LWKAMbfqlocd0ibyI6Fl0lmcAui33p5fqVZLViVJ5hlUfnFlEg4JT_AZt1I4_dVJA1vdrSllrtWj9MP8E5fG0D4VZwTAYIngLjX1RKTuoH_mLNx_7XI791zNtCn6kVZWGSY6Rnl6rPalQlPeHjYJn4p8n6koGFPLoz-z9MfPbqvpMDllwV2TVL-7eVZ9pJCA',
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
