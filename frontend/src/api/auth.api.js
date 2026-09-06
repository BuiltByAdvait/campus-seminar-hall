import api from './client';
import { authStore } from '../store/authStore';

export const authApi = {
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { accessToken, refreshToken, user } = res.data.data;
    authStore.setTokens(accessToken, refreshToken);
    authStore.setUser(user);
    return res.data;
  },

  register: async (userData) => {
    const res = await api.post('/auth/register', userData);
    return res.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // ignore
    }
    authStore.logout();
  },

  getProfile: async () => {
    const res = await api.get('/auth/me');
    authStore.setUser(res.data.data.user);
    return res.data.data.user;
  },

  updateProfile: async (updates) => {
    const res = await api.patch('/auth/profile', updates);
    authStore.setUser(res.data.data.user);
    return res.data.data.user;
  }
};
