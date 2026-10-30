import { AUTH_STORAGE_KEY } from '../utils/constants'
import { authApi } from '../api'

export function readAuth() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || 'null')
  } catch {
    return null
  }
}

export function writeAuth(payload) {
  if (!payload) {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    return
  }
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload))
}

export const authService = {
  async login(login, password) {
    const result = await authApi.login(login, password)
    writeAuth({ token: result.token, user: result.user })
    return result.user
  },
  async logout() {
    try {
      await authApi.logout()
    } catch {
      /* still clear local session */
    }
    writeAuth(null)
  },
  async restore() {
    const stored = readAuth()
    if (!stored?.token) return null
    try {
      const user = await authApi.me()
      writeAuth({ token: stored.token, user })
      return user
    } catch {
      writeAuth(null)
      return null
    }
  },
  async updateProfile(body) {
    const user = await authApi.updateProfile(body)
    const stored = readAuth()
    writeAuth({ token: stored?.token, user })
    return user
  },
}
