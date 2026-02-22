'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/lib/AuthContext'

// Защита страниц — редирект если не авторизован
export function useAuthProtection() {
  const { isAuthenticated, isLoading } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  return isAuthenticated
}

// Защита страниц — редирект если не админ
export function useAdminProtection() {
  const { isAuthenticated, isAdmin, isLoading } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    if (!isAdmin) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, isAdmin, isLoading, router])

  return isAdmin
}