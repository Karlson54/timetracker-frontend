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
  }
}

export const agenciesService = createDictionaryService('agencies')
export const marketsService = createDictionaryService('markets')
export const clientsService = createDictionaryService('clients')
export const mediaService = createDictionaryService('media')
export const jobTypesService = createDictionaryService('jobtypes')
export const projectBrandsService = createDictionaryService('projectbrands')
export const contractingAgenciesService = createDictionaryService('contractingagencies')