import httpClient from '@/lib/api/httpClient'
import type { LoginRequest, AuthResponse } from '@/lib/api/types'

const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await httpClient.post<AuthResponse>('/api/auth/login', data)
    return response.data
  },

  async validate(): Promise<void> {
    await httpClient.get('/api/auth/validate')
  },
}

export default authService