import httpClient from '@/lib/api/httpClient'

export interface Department {
  id: number
  name: string
  isActive: boolean
  agencyId: number
  agencyName: string
  usersCount: number
  createdAt: string
  updatedAt: string | null
}

export interface CreateDepartmentRequest {
  name: string
  agencyId: number
}

export interface UpdateDepartmentRequest {
  name: string
}

const departmentsService = {
  async getByAgency(agencyId: number): Promise<Department[]> {
    const response = await httpClient.get<Department[]>(`/api/departments/by-agency/${agencyId}`)
    return response.data
  },

  async getActiveByAgency(agencyId: number): Promise<Department[]> {
    const response = await httpClient.get<Department[]>(`/api/departments/by-agency/${agencyId}/active`)
    return response.data
  },

  async getById(id: number): Promise<Department> {
    const response = await httpClient.get<Department>(`/api/departments/${id}`)
    return response.data
  },

  async create(data: CreateDepartmentRequest): Promise<Department> {
    const response = await httpClient.post<Department>('/api/departments', data)
    return response.data
  },

  async update(id: number, data: UpdateDepartmentRequest): Promise<Department> {
    const response = await httpClient.put<Department>(`/api/departments/${id}`, data)
    return response.data
  },

  async delete(id: number): Promise<void> {
    await httpClient.delete(`/api/departments/${id}`)
  },

  async activate(id: number): Promise<void> {
    await httpClient.patch(`/api/departments/${id}/activate`)
  },

  async deactivate(id: number): Promise<void> {
    await httpClient.patch(`/api/departments/${id}/deactivate`)
  },
}

export default departmentsService