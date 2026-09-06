import api from './client';

export const dashboardApi = {
  get: async () => {
    const res = await api.get('/dashboard');
    return res.data;
  },
  getUser: async () => {
    const res = await api.get('/dashboard/user');
    return res.data.data;
  },
  getAdmin: async () => {
    const res = await api.get('/dashboard/admin');
    return res.data.data;
  }
};

export const reportsApi = {
  getUserReport: async (userId, fromDate, toDate) => {
    const res = await api.get(`/reports/user/${userId}`, { params: { fromDate, toDate } });
    return res.data.data.report;
  },
  getHallReport: async (hallId, fromDate, toDate) => {
    const res = await api.get(`/reports/hall/${hallId}`, { params: { fromDate, toDate } });
    return res.data.data.report;
  },
  getWeeklyReport: async (weekStart, weekEnd) => {
    const res = await api.get('/reports/weekly', { params: { weekStart, weekEnd } });
    return res.data.data.report;
  },
  getMonthlyReport: async (yearMonth) => {
    const res = await api.get('/reports/monthly', { params: { yearMonth } });
    return res.data.data.report;
  },
  getCancellationReport: async (fromDate, toDate) => {
    const res = await api.get('/reports/cancellations', { params: { fromDate, toDate } });
    return res.data.data.report;
  },
  getOverstayReport: async (fromDate, toDate) => {
    const res = await api.get('/reports/overstay', { params: { fromDate, toDate } });
    return res.data.data.report;
  }
};

export const constantsApi = {
  getAll: async () => {
    const res = await api.get('/constants');
    return res.data.data;
  }
};
