import { useCallback, useEffect, useRef, useState } from 'react'
import { getErrorMessage } from '../utils/errors'

export function useAsync(fn, deps = []) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const dataRef = useRef(null)

  const run = useCallback(async (options = {}) => {
    const silent = Boolean(options.silent) || dataRef.current != null
    if (!silent) setLoading(true)
    setError('')
    try {
      const result = await fn()
      dataRef.current = result
      setData(result)
      return result
    } catch (err) {
      setError(getErrorMessage(err))
      throw err
    } finally {
      setLoading(false)
    }
  }, deps)

  useEffect(() => {
    run().catch(() => {})
  }, [run])

  return { data, error, loading, reload: run, setData }
}
