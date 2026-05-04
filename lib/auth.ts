'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/lib/AuthContext'
import authService from '@/lib/api/services/authService'
import { clearAuth } from '@/lib/api/tokenStorage'

function useBaseProtection(requireAdmin = false) {
  const { isAuthenticated, isAdmin, isLoading, logout } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    if (requireAdmin && !isAdmin) {
      router.push('/dashboard')
      return
    }
    authService.validate().catch(() => {
      clearAuth()
      logout()
    })
  }, [isAuthenticated, isAdmin, isLoading, router])

  return requireAdmin ? isAdmin : isAuthenticated
}

export function useAuthProtection() {
  return useBaseProtection(false)
}

export function useAdminProtection() {
  return useBaseProtection(true)
}