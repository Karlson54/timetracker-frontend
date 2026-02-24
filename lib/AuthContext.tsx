'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { UserInfo, AuthResponse } from '@/lib/api/types'
import { saveAuth, getToken, getUser, clearAuth } from '@/lib/api/tokenStorage'
import authService from '@/lib/api/services/authService'

interface AuthContextType {
  user: UserInfo | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (data: AuthResponse) => void
  logout: () => void
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const initAuth = async () => {
      const token = getToken()
      const savedUser = getUser()

      if (!token || !savedUser) {
        setIsLoading(false)
        return
      }

      try {
        // Проверяем токен на бэке — жив ли он и активен ли пользователь
        await authService.validate()
        setUser(savedUser)
      } catch {
        // Токен невалидный или пользователь деактивирован — чистим всё
        clearAuth()
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = useCallback((data: AuthResponse) => {
    saveAuth(data)
    setUser({
      userId: data.userId,
      login: data.login,
      email: data.email,
      name: data.name,
      agencyId: data.agencyId,
      agencyName: data.agencyName,
      roles: data.roles,
    })
  }, [])

  const logout = useCallback(() => {
    clearAuth()
    setUser(null)
    router.push('/login')
  }, [router])

  const isAdmin = user?.roles?.includes('Admin') ?? false

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      isAdmin,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider')
  }
  return context
}