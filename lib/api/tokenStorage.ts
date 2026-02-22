const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

import type { AuthResponse, UserInfo } from './types'

export function saveAuth(data: AuthResponse): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(TOKEN_KEY, data.token)
  const user: UserInfo = {
    userId: data.userId,
    login: data.login,
    email: data.email,
    name: data.name,
    agencyId: data.agencyId,
    agencyName: data.agencyName,
    roles: data.roles,
  }
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function getUser(): UserInfo | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as UserInfo
  } catch {
    return null
  }
}

export function clearAuth(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function hasToken(): boolean {
  return !!getToken()
}