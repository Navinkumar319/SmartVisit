import api from './api';

const SystemService = {
  // Get dashboard counts (for cards)
  getDashboardStats: async () => {
    const response = await api.get('/api/dashboard/stats');
    return response.data;
  },

  // Get global settings config
  getSettings: async () => {
    const response = await api.get('/api/settings');
    return response.data;
  },

  // Save/Update global settings
  saveSettings: async (settingsData) => {
    const response = await api.put('/api/settings', settingsData);
    return response.data;
  },

  // Get report data by type
  getReportData: async (type) => {
    const response = await api.get(`/api/reports?type=${type}`);
    return response.data;
  },
};

export default SystemService;
