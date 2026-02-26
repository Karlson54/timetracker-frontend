import httpClient from '@/lib/api/httpClient'
import type { RoleItem } from '@/lib/api/types'

const rolesService = {
  async getActive(): Promise<RoleItem[]> {
    const response = await httpClient.get<RoleItem[]>('/api/roles/active')
    return response.data
  },
}

export default rolesService