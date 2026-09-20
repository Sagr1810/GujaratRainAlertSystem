import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 20000,
});

// Response interceptor — never let an API error go unhandled as a white screen
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log but always reject so callers can handle with try/catch
    console.warn('[API Error]', error.config?.url, error.response?.status, error.message);
    return Promise.reject(error);
  }
);

export const weatherAPI = {
  getLive: (params) => api.get('/weather/live', { params }),
  getCity: (id) => api.get(`/weather/city/${id}`),
  getRegion: (code) => api.get(`/weather/region/${code}`),
  getSummary: () => api.get('/weather/summary'),
  refresh: () => api.post('/weather/refresh'),
};

export const alertAPI = {
  getAll: (params) => api.get('/alerts', { params }),
  getHistory: (params) => api.get('/alerts/history', { params }),
  create: (data) => api.post('/alerts', data),
  deactivate: (id) => api.put(`/alerts/${id}/deactivate`),
};

export const historyAPI = {
  getAll: (params) => api.get('/history', { params }),
  getSummary: () => api.get('/history/summary'),
  getCities: () => api.get('/history/cities'),
  getSyncStatus: () => api.get('/history/sync-status'),
  sync: () => api.post('/history/sync'),
};

export const agentAPI = {
  chat: (data) => api.post('/agent/chat', data),
  getHistory: (sessionId) => api.get(`/agent/history/${sessionId}`),
  rate: (data) => api.post('/agent/rate', data),
};

export const regionAPI = {
  getAll: () => api.get('/regions'),
  getByCode: (code) => api.get(`/regions/${code}`),
  getCities: (code) => api.get(`/regions/${code}/cities`),
};

export const reservoirAPI = {
  getAll: (params) => api.get('/reservoirs', { params }),
  update: (id, data) => api.put(`/reservoirs/${id}`, data),
};

export const miscAPI = {
  getStats: () => api.get('/stats'),
  getCities: (params) => api.get('/cities', { params }),
  getForecast: (cityId) => api.get(`/forecast/${cityId}`),
  getHealth: () => api.get('/health'),
};

export default api;
