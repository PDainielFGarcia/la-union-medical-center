import axios from 'axios'
import { ApiError } from '../utils/errors'
import { AUTH_STORAGE_KEY } from '../utils/constants'
// The offline mock predates the Laravel API and does not cover the current flows.
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

function getStoredAuth() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || 'null')
  } catch {
    return null
  }
}

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const auth = getStoredAuth()
  if (auth?.token) {
    config.headers.Authorization = `Bearer ${auth.token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const message = error.response?.data?.message || error.message || 'Request failed'
    if (status === 401 && !error.config?.url?.includes('/login')) {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    }
    return Promise.reject(new ApiError(message, status || 0, error.response?.data))
  },
)

export async function request(method, path, { body, params, signal } = {}) {
  if (USE_MOCK) {
    const { handleMockRequest } = await import('../services/mock/handlers')
    const auth = getStoredAuth()
    const search = params ? `?${new URLSearchParams(params).toString()}` : ''
    const result = await handleMockRequest({
      method: method.toUpperCase(),
      path: `${path}${search}`,
      body,
      token: auth?.token,
    })
    return result.data
  }

  const response = await apiClient.request({
    method,
    url: path,
    data: body,
    params,
    signal,
  })
  return response.data?.data ?? response.data
}
