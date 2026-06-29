import httpClient from '@/lib/api/httpClient'
import type { DictionaryItem, CreateDictionaryItemRequest } from '@/lib/api/types'

function createDictionaryService(endpoint: string) {
  return {
    async getAll(): Promise<DictionaryItem[]> {
      const response = await httpClient.get<DictionaryItem[]>(`/api/${endpoint}`)
      return response.data
    },

    async getActive(): Promise<DictionaryItem[]> {
      const response = await httpClient.get<DictionaryItem[]>(`/api/${endpoint}/active`)
      return response.data
    },

    async create(data: CreateDictionaryItemRequest): Promise<DictionaryItem> {
      const response = await httpClient.post<DictionaryItem>(`/api/${endpoint}`, data)
      return response.data
    },

    async update(id: number, data: CreateDictionaryItemRequest): Promise<DictionaryItem> {
      const response = await httpClient.put<DictionaryItem>(`/api/${endpoint}/${id}`, data)
      return response.data
    },

    async delete(id: number): Promise<void> {
      await httpClient.delete(`/api/${endpoint}/${id}`)
    },

    async activate(id: number): Promise<void> {
      await httpClient.patch(`/api/${endpoint}/${id}/activate`)
    },

    async deactivate(id: number): Promise<void> {
      await httpClient.patch(`/api/${endpoint}/${id}/deactivate`)
    },

    async getPaged(
      pageNumber: number,
      pageSize: number,
      searchTerm?: string,
      isActive?: boolean
    ): Promise<{ data: DictionaryItem[]; totalCount: number; totalPages: number }> {
      const response = await httpClient.get(`/api/${endpoint}/paged`, {
        params: {
          pageNumber,
          pageSize,
          searchTerm: searchTerm || undefined,
          isActive,
        },
      })
      const res = response.data
      return {
        data: res.data,
        totalCount: res.totalCount,
        totalPages: res.totalPages,
      }
    },
  }
}

export const agenciesService = createDictionaryService('agencies')
export const marketsService = createDictionaryService('markets')
export const clientsService = createDictionaryService('clients')
export const mediaService = createDictionaryService('media')
export const jobTypesService = createDictionaryService('jobtypes')
export const contractingAgenciesService = createDictionaryService('contractingagencies')