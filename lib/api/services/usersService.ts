import httpClient from '@/lib/api/httpClient'
import type { UserListItem, CreateUserRequest, UpdateUserRequest } from '@/lib/api/types'

const usersService = {
  async getAll(): Promise<UserListItem[]> {
    const response = await httpClient.get<UserListItem[]>('/api/users')
    return response.data
  },

  async getActive(): Promise<UserListItem[]> {
    const response = await httpClient.get<UserListItem[]>('/api/users/active')
    return response.data
  },

  async getById(id: number): Promise<UserListItem> {
    const response = await httpClient.get<UserListItem>(`/api/users/${id}`)
    return response.data
  },

  async create(data: CreateUserRequest): Promise<UserListItem> {
    const response = await httpClient.post<UserListItem>('/api/users', data)
    return response.data
  },

  async update(id: number, data: UpdateUserRequest): Promise<UserListItem> {
    const response = await httpClient.put<UserListItem>(`/api/users/${id}`, data)
    return response.data
  },

  async activate(id: number): Promise<void> {
    await httpClient.patch(`/api/users/${id}/activate`)
  },

  async deactivate(id: number): Promise<void> {
    await httpClient.patch(`/api/users/${id}/deactivate`)
  },
}

export default usersService