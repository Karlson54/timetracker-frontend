'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/lib/AuthContext'
import authService from '@/lib/api/services/authService'
import { clearAuth } from '@/lib/api/tokenStorage'

function useBaseProtection(requireSuperAdmin = false) {
  const { isAuthenticated, isAdmin, isSuperAdmin, isLoading, logout } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    if (requireSuperAdmin && !isSuperAdmin) {
      router.push('/dashboard')
      return
    }
    // Обычная защита — нужна хотя бы роль Admin или SuperAdmin
    if (!requireSuperAdmin && !isAdmin) {
      router.push('/dashboard')
      return
    }
    authService.validate().catch(() => {
      clearAuth()
      logout()
    })
  }, [isAuthenticated, isAdmin, isSuperAdmin, isLoading, router])

  return requireSuperAdmin ? isSuperAdmin : isAdmin
}

export function useSuperAdminProtection() {
  // Пускает только SuperAdmin
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
  return useBaseProtection(false)
}

export function useAdminProtection() {
  // Пускает и Admin и SuperAdmin
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