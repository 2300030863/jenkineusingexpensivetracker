import axios from 'axios'

// Base URL for backend API - use environment variable or default to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/expense-tracker-api' : 'http://localhost:9090/ExpenseTrackerApplication/expense-tracker')

// Debug logging for API URL
console.log('API Base URL:', API_BASE_URL)
console.log('Environment:', import.meta.env.MODE)
console.log('Production:', import.meta.env.PROD)

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token conditionally
api.interceptors.request.use(
  (config) => {
    const publicEndpoints = ['/auth/login', '/auth/register']
    const isPublic = publicEndpoints.some((endpoint) => config.url.includes(endpoint))

    if (!isPublic) {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }

    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  verifyToken: () => api.get('/auth/verify'),
}

// Transaction API
export const transactionAPI = {
  getAll: (params) => api.get('/transactions', { params }),
  getById: (id) => api.get(`/transactions/${id}`),
  create: (data) => api.post('/transactions', data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`),
  search: (params) => api.get('/transactions/search', { params }),
}

// Category API
export const categoryAPI = {
  getAll: () => api.get('/categories'),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
}

// Account API
export const accountAPI = {
  getAll: () => api.get('/accounts'),
  getById: (id) => api.get(`/accounts/${id}`),
  create: (data) => api.post('/accounts', data),
  update: (id, data) => api.put(`/accounts/${id}`, data),
  delete: (id) => api.delete(`/accounts/${id}`),
}

// Budget API
export const budgetAPI = {
  getAll: () => api.get('/budgets'),
  getById: (id) => api.get(`/budgets/${id}`),
  create: (data) => api.post('/budgets', data),
  update: (id, data) => api.put(`/budgets/${id}`, data),
  delete: (id) => api.delete(`/budgets/${id}`),
}

// Analytics API
export const analyticsAPI = {
  getDashboard: (params) => api.get('/analytics/dashboard', { params }),
  getCategorySpending: (params) => api.get('/analytics/category-spending', { params }),
  getMonthlyTrend: (params) => api.get('/analytics/monthly-trend', { params }),
  getBudgetStatus: () => api.get('/analytics/budget-status'),
}

// Recurring Transaction API
export const recurringTransactionAPI = {
  getAll: () => api.get('/recurring-transactions'),
  getActive: () => api.get('/recurring-transactions/active'),
  getById: (id) => api.get(`/recurring-transactions/${id}`),
  create: (data) => api.post('/recurring-transactions', data),
  update: (id, data) => api.put(`/recurring-transactions/${id}`, data),
  delete: (id) => api.delete(`/recurring-transactions/${id}`),
  toggle: (id) => api.post(`/recurring-transactions/${id}/toggle`),
  execute: (id) => api.post(`/recurring-transactions/${id}/execute`),
}

// User Profile API
export const profileAPI = {
  get: () => api.get('/profile'),
  update: (data) => api.put('/profile', data),
  changePassword: (data) => api.post('/profile/change-password', data),
}

export default api
