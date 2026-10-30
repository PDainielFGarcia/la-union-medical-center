import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { authService, readAuth } from './authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const stored = readAuth()
  const [user, setUser] = useState(stored?.user || null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    authService.restore().then((restored) => {
      if (!active) return
      setUser(restored)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      async login(loginName, password) {
        const nextUser = await authService.login(loginName, password)
        setUser(nextUser)
        return nextUser
      },
      async logout() {
        await authService.logout()
        setUser(null)
      },
      async updateProfile(body) {
        const nextUser = await authService.updateProfile(body)
        setUser(nextUser)
        return nextUser
      },
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
