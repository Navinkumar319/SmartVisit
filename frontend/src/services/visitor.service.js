import api from './api';

const VisitorService = {
  // Get all visitors (sanitized automatically in backend for SECURITY role)
  getAllVisitors: async () => {
    const response = await api.get('/api/visitors');
    return response.data;
  },

  // Get single visitor details
  getVisitorById: async (id) => {
    const response = await api.get(`/api/visitors/${id}`);
    return response.data;
  },

  // Register new visitor (Admin/Reception)
  registerVisitor: async (visitorData) => {
    const response = await api.post('/api/visitors', visitorData);
    return response.data;
  },

  // Update visitor details (Admin/Reception)
  updateVisitor: async (id, visitorData) => {
    const response = await api.put(`/api/visitors/${id}`, visitorData);
    return response.data;
  },

  // Delete visitor details (Admin only)
  deleteVisitor: async (id) => {
    const response = await api.delete(`/api/visitors/${id}`);
    return response.data;
  },

  // Search visitors by query (Visitor Code, Name, or Person to Meet)
  searchVisitors: async (query) => {
    const response = await api.get(`/api/visitors/search?query=${query}`);
    return response.data;
  },

  // Filter visitors by status
  getVisitorsByStatus: async (status) => {
    const response = await api.get(`/api/visitors/status/${status}`);
    return response.data;
  },

  // Approve visitor (Admin/Reception)
  approveVisitor: async (visitorId, remarks) => {
    const response = await api.post('/api/visitors/approve', { visitorId, remarks });
    return response.data;
  },

  // Reject visitor (Admin/Reception)
  rejectVisitor: async (visitorId, remarks) => {
    const response = await api.post('/api/visitors/reject', { visitorId, remarks });
    return response.data;
  },

  // Check-in visitor (Admin/Reception)
  checkInVisitor: async (visitorId, securityName, remarks) => {
    const response = await api.post('/api/visitors/checkin', { visitorId, securityName, remarks });
    return response.data;
  },

  // Check-out visitor (Admin only)
  checkOutVisitor: async (visitorId, remarks) => {
    const response = await api.post('/api/visitors/checkout', { visitorId, remarks });
    return response.data;
  },
};

export default VisitorService;
