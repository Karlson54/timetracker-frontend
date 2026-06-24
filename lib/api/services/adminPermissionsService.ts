import httpClient from '@/lib/api/httpClient'

export interface AdminPermissionItem {
  agencyId: number
  agencyName: string
  departmentId: number
  departmentName: string
}

export interface AdminPermissionsForUser {
  userId: number
  userName: string
  permissions: AdminPermissionItem[]
}

export interface SetAdminPermissionsRequest {
  permissions: { agencyId: number; departmentId: number }[]
}

const adminPermissionsService = {
  async getByUser(userId: number): Promise<AdminPermissionsForUser> {
    const response = await httpClient.get<AdminPermissionsForUser>(
      `/api/admin-permissions/user/${userId}`
    )
    return response.data
  },

  async getMyPermissions(): Promise<AdminPermissionsForUser> {
    const response = await httpClient.get<AdminPermissionsForUser>(
      '/api/admin-permissions/my'
    )
    return response.data
  },

  async setPermissions(userId: number, data: SetAdminPermissionsRequest): Promise<void> {
    await httpClient.put(`/api/admin-permissions/user/${userId}`, data)
  },

  async clearPermissions(userId: number): Promise<void> {
    await httpClient.delete(`/api/admin-permissions/user/${userId}`)
  },
}

export default adminPermissionsService