'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/lib/AuthContext'
import authService from '@/lib/api/services/authService'
import { clearAuth } from '@/lib/api/tokenStorage'

export function useSuperAdminProtection() {
  const { isAuthenticated, isSuperAdmin, isLoading, logout } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) { router.push('/login'); return }
    if (!isSuperAdmin) { router.push('/dashboard'); return }
    authService.validate().catch(() => { clearAuth(); logout() })
  }, [isAuthenticated, isSuperAdmin, isLoading, router])

  return isSuperAdmin
}

export function useAuthProtection() {
  const { isAuthenticated, isLoading, logout } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) { router.push('/login'); return }
    authService.validate().catch(() => { clearAuth(); logout() })
  }, [isAuthenticated, isLoading, router])

  return isAuthenticated
}

export function useAdminProtection() {
  const { isAuthenticated, isAdmin, isLoading, logout } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) { router.push('/login'); return }
    if (!isAdmin) { router.push('/dashboard'); return }
    authService.validate().catch(() => { clearAuth(); logout() })
  }, [isAuthenticated, isAdmin, isLoading, router])

  return isAdmin
}