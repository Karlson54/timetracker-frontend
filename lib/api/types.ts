// Запрос на логин — точно по LoginDto бекенда
export interface LoginRequest {
  loginOrEmail: string
  password: string
}

// Ответ после логина — точно по AuthResponseDto бекенда
export interface AuthResponse {
  userId: number
  login: string
  email: string
  name: string
  agencyId: number
  agencyName: string
  roles: string[]
  token: string
  expiresAt: string // ISO string из бекенда
}

// Данные пользователя, которые храним в памяти приложения
export interface UserInfo {
  userId: number
  login: string
  email: string
  name: string
  agencyId: number
  agencyName: string
  roles: string[]
}

// Стандартный формат ошибки от бекенда
export interface ApiError {
  message: string
}