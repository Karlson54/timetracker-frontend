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

// ===== USERS =====
export interface UserListItem {
  id: number
  login: string
  email: string
  name: string
  agencyId: number
  agencyName: string
  isActive: boolean
}

export interface CreateUserRequest {
  login: string
  email: string
  name: string
  password: string
  agencyId: number
  roleIds: number[]
}

export interface UpdateUserRequest {
  email: string
  name: string
  agencyId: number
}

export interface RoleItem {
  id: number
  name: string
  isActive: boolean
}

// ===== DICTIONARIES =====
export interface DictionaryItem {
  id: number
  name: string
  isActive: boolean
}

export interface CreateDictionaryItemRequest {
  name: string
}

// ===== TIME ENTRIES =====
export interface TimeEntryListItem {
  id: number
  userId: number
  userName: string
  entryDate: string
  hoursMilliseconds: number
  clientId: number | null
  clientName: string | null
  projectBrandId: number | null
  projectBrandName: string | null
  marketId: number | null
  marketName: string | null
  mediaId: number | null
  mediaName: string | null
  jobTypeId: number | null
  jobTypeName: string | null
  contractingAgencyId: number | null
  contractingAgencyName: string | null
  comments: string | null
}

export interface CreateTimeEntryRequest {
  userId: number
  agencyId: number
  entryDate: string
  hoursMilliseconds: number
  clientId?: number | null
  projectBrandId?: number | null
  marketId?: number | null
  mediaId?: number | null
  jobTypeId?: number | null
  contractingAgencyId?: number | null
  comments?: string | null
}

export interface UpdateTimeEntryRequest extends CreateTimeEntryRequest { }