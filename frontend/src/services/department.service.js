import api from './api';

const DepartmentService = {
  // Get all departments
  getAllDepartments: async () => {
    const response = await api.get('/api/departments');
    return response.data;
  },

  // Create a new department
  createDepartment: async (deptData) => {
    const response = await api.post('/api/departments', deptData);
    return response.data;
  },

  // Update department details
  updateDepartment: async (id, deptData) => {
    const response = await api.put(`/api/departments/${id}`, deptData);
    return response.data;
  },

  // Delete a department
  deleteDepartment: async (id) => {
    const response = await api.delete(`/api/departments/${id}`);
    return response.data;
  }
};

export default DepartmentService;
