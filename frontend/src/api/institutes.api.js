import api from './client';

export const institutesApi = {
  getAll: async (params = {}) => {
    const res = await api.get('/institutes', { params });
    return res.data.data.institutes;
  },
  getById: async (id) => {
    const res = await api.get(`/institutes/${id}`);
    return res.data.data.institute;
  },
  create: async (data) => {
    const res = await api.post('/institutes', data);
    return res.data.data.institute;
  },
  update: async (id, data) => {
    const res = await api.patch(`/institutes/${id}`, data);
    return res.data.data.institute;
  },
  remove: async (id) => {
    const res = await api.delete(`/institutes/${id}`);
    return res.data;
  }
};

export const departmentsApi = {
  getAll: async (params = {}) => {
    const res = await api.get('/departments', { params });
    return res.data.data.departments;
  },
  getById: async (id) => {
    const res = await api.get(`/departments/${id}`);
    return res.data.data.department;
  },
  create: async (data) => {
    const res = await api.post('/departments', data);
    return res.data.data.department;
  },
  update: async (id, data) => {
    const res = await api.patch(`/departments/${id}`, data);
    return res.data.data.department;
  },
  remove: async (id) => {
    const res = await api.delete(`/departments/${id}`);
    return res.data;
  }
};
