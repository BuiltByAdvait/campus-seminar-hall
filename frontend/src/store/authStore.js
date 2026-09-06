// Simple auth store using localStorage
const TOKEN_KEY = 'csh_access_token';
const REFRESH_KEY = 'csh_refresh_token';
const USER_KEY = 'csh_user';

export const authStore = {
  getAccessToken: () => localStorage.getItem(TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_KEY),
  getUser: () => {
    const u = localStorage.getItem(USER_KEY);
    return u ? JSON.parse(u) : null;
  },
  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
  },
  setUser: (user) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  setAccessToken: (token) => {
    localStorage.setItem(TOKEN_KEY, token);
  },
  setRefreshToken: (token) => {
    localStorage.setItem(REFRESH_KEY, token);
  },
  isAuthenticated: () => !!localStorage.getItem(TOKEN_KEY),
  isAdmin: () => {
    const user = authStore.getUser();
    return user?.email === 'admin@campus.edu.in';
  },
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  }
};
