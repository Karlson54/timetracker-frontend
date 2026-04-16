import { useState, useCallback } from 'react'
import { parseApiError } from '@/lib/utils'

export function useErrorToast() {
  const [error, setError] = useState<string | null>(null)

  const showError = useCallback((err: any, fallback = 'Виникла помилка') => {
    setError(parseApiError(err, fallback))
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return { error, showError, clearError }
}