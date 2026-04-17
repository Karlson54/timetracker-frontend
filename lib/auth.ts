'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/lib/AuthContext'
import authService from '@/lib/api/services/authService'
import { clearAuth } from '@/lib/api/tokenStorage'

export function useAuthProtection() {
  const { isAuthenticated, isLoading, logout } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    // Перевіряємо токен на сервері
    authService.validate().catch(() => {
      clearAuth()
      logout()
    })
  }, [isAuthenticated, isLoading, router])

  return isAuthenticated
}

export function useAdminProtection() {
  const { isAuthenticated, isAdmin, isLoading, logout } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    if (!isAdmin) {
      router.push('/dashboard')
      return
    }

    // Перевіряємо токен на сервері
    authService.validate().catch(() => {
      clearAuth()
      logout()
    })
  }, [isAuthenticated, isAdmin, isLoading, router])

  return isAdmin
}