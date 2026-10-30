import { useEffect } from 'react'

export function usePolling(reload, ms = 5000) {
  useEffect(() => {
    const refresh = () => Promise.resolve(reload({ silent: true })).catch(() => {})
    refresh()
    const timer = setInterval(refresh, ms)
    window.addEventListener('focus', refresh)
    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', refresh)
    }
  }, [reload, ms])
}
