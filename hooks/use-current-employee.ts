'use client'

import { useState, useEffect } from 'react'
import { useAuthContext } from '@/lib/AuthContext'

interface Employee {
  id: number
  name: string
  email: string
  login: string
  agencyId: number
  agencyName: string
  roles: string[]
}

export function useCurrentEmployee() {
  const { user, isAuthenticated } = useAuthContext()

  const employee: Employee | null = user ? {
    id: user.userId,
    name: user.name,
    email: user.email,
    login: user.login,
    agencyId: user.agencyId,
    agencyName: user.agencyName,
    roles: user.roles,
  } : null

  return { employee, isLoading: false, error: null }
}