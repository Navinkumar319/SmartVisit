import api from './api';

const UserService = {
  // Get all users (Admin only)
  getAllUsers: async () => {
    const response = await api.get('/api/users');
    return response.data;
  },

  // Get user details by ID
  getUserById: async (id) => {
    const response = await api.get(`/api/users/${id}`);
    return response.data;
  },

  // Update user details (Admin only)
  updateUser: async (id, userData) => {
    const response = await api.put(`/api/users/${id}`, userData);
    return response.data;
  },

  // Delete a user (Admin only)
  deleteUser: async (id) => {
    const response = await api.delete(`/api/users/${id}`);
    return response.data;
  },

  // --- NEW OTP-BASED USER CREATION FLOW ---
  // Send OTP (Admin only)
  adminSendOtp: async (email) => {
    const response = await api.post('/api/admin/send-otp', { email });
    return response.data;
  },

  // Verify OTP (Admin only)
  adminVerifyOtp: async (email, otp) => {
    const response = await api.post('/api/admin/verify-otp', { email, otp });
    return response.data;
  },

  // Create User after OTP verification (Admin only)
  adminCreateUser: async (userData) => {
    const response = await api.post('/api/admin/create-user', userData);
    return response.data;
  },

  // Get suggested credentials based on role
  adminSuggestCredentials: async (role) => {
    const response = await api.get('/api/admin/suggest-credentials', { params: { role } });
    return response.data;
  },
};

export default UserService;
