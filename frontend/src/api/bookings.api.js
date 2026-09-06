import api from './client';

export const bookingsApi = {
  getAll: async (filters = {}) => {
    const res = await api.get('/bookings', { params: filters });
    return res.data.data;
  },
  getById: async (id) => {
    const res = await api.get(`/bookings/${id}`);
    return res.data.data.booking;
  },
  getUpcoming: async (limit = 5) => {
    const res = await api.get('/bookings/upcoming', { params: { limit } });
    return res.data.data.bookings;
  },
  getToday: async () => {
    const res = await api.get('/bookings/today');
    return res.data.data.bookings;
  },
  create: async (bookingData) => {
    const res = await api.post('/bookings', bookingData);
    return res.data.data.booking;
  },
  update: async (id, updates) => {
    const res = await api.patch(`/bookings/${id}`, updates);
    return res.data.data.booking;
  },
  cancel: async (id, reasonData) => {
    const res = await api.post(`/bookings/${id}/cancel`, reasonData);
    return res.data.data.booking;
  },
  approve: async (id, adminNotes = {}) => {
    const res = await api.post(`/bookings/${id}/approve`, adminNotes);
    return res.data.data.booking;
  },
  reject: async (id, adminNotes = '') => {
    const res = await api.post(`/bookings/${id}/reject`, { adminNotes });
    return res.data.data.booking;
  }
};

export const checkInOutApi = {
  checkIn: async (bookingId, data = {}) => {
    const res = await api.post(`/check-in-out/${bookingId}/check-in`, data);
    return res.data;
  },
  checkOut: async (bookingId, data = {}) => {
    const res = await api.post(`/check-in-out/${bookingId}/check-out`, data);
    return res.data;
  },
  getByBooking: async (bookingId) => {
    const res = await api.get(`/check-in-out/${bookingId}`);
    return res.data.data.record;
  }
};

export const feedbackApi = {
  submit: async (bookingId, data) => {
    const res = await api.post(`/feedback/${bookingId}`, data);
    return res.data.data.feedback;
  },
  getByBooking: async (bookingId) => {
    const res = await api.get(`/feedback/${bookingId}`);
    return res.data.data.feedback;
  }
};
