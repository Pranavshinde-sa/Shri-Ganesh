import axios from 'axios'

// Point this at wherever your FastAPI backend is running.
// Locally that's http://localhost:8000. Set VITE_API_URL when deploying
// the frontend so it points at your hosted backend instead.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({ baseURL: API_URL })

const TOKEN_KEY = 'nidhi_admin_token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

// Attach the admin token (if present) to every request. Read-only GET
// endpoints on the backend ignore it; write endpoints require it.
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// If the token is invalid or expired, drop it and let the app know so
// the UI can fall back to the read-only view instead of staying stuck.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && getToken()) {
      clearToken()
      window.dispatchEvent(new Event('nidhi-session-expired'))
    }
    return Promise.reject(error)
  }
)

export const login = (username, password) => {
  const form = new URLSearchParams()
  form.append('username', username)
  form.append('password', password)
  return api.post('/auth/login', form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  }).then((r) => r.data)
}

export const getDashboard = () => api.get('/dashboard').then(r => r.data)

export const getDonations = () => api.get('/donations').then(r => r.data)
export const addDonation = (payload) => api.post('/donations', payload).then(r => r.data)
export const deleteDonation = (id) => api.delete(`/donations/${id}`)

export const getExpenses = () => api.get('/expenses').then(r => r.data)
export const addExpense = (payload) => api.post('/expenses', payload).then(r => r.data)
export const deleteExpense = (id) => api.delete(`/expenses/${id}`)

export const exportDonationsPdf = () => api.get('/export/donations', { responseType: 'blob' })
export const exportExpensesPdf = () => api.get('/export/expenses', { responseType: 'blob' })

export default api
