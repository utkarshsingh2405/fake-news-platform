import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const refreshToken = localStorage.getItem('refresh_token')
        const response = await axios.post('/api/auth/refresh', { refresh_token: refreshToken })
        const { access_token, refresh_token } = response.data
        localStorage.setItem('access_token', access_token)
        localStorage.setItem('refresh_token', refresh_token)
        originalRequest.headers.Authorization = `Bearer ${access_token}`
        return api(originalRequest)
      } catch (refreshError) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  login: (email, password) => api.post('/api/auth/login', { email, password }),
  register: (data) => api.post('/api/auth/register', data),
  getMe: () => api.get('/api/auth/me'),
}

export const predictionApi = {
  predictText: (text) => api.post('/api/predict/text', { text }),
  predictUrl: (url) => api.post('/api/predict/url', { url }),
  predictVideo: (url) => api.post('/api/predict/video', { url }),
  predictFile: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/api/predict/file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  predictBatch: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/api/predict/batch', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  getHistory: (skip = 0, limit = 20) => api.get(`/api/predict/history?skip=${skip}&limit=${limit}`),
  getStats: () => api.get('/api/predict/stats'),
}

export const adminApi = {
  getUsers: () => api.get('/api/admin/users'),
  updateUser: (userId, data) => api.put(`/api/admin/users/${userId}`, data),
  deleteUser: (userId) => api.delete(`/api/admin/users/${userId}`),
  getAnalytics: () => api.get('/api/admin/analytics'),
  retrainModel: (useDefaultDataset = true) => api.post('/api/admin/retrain', { use_default_dataset: useDefaultDataset }),
  getLogs: () => api.get('/api/admin/logs'),
}

export default api