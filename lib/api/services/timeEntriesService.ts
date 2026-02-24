import httpClient from '@/lib/api/httpClient'
import type { TimeEntryListItem, CreateTimeEntryRequest, UpdateTimeEntryRequest } from '@/lib/api/types'

const timeEntriesService = {
  async getMy(fromDate?: string, toDate?: string): Promise<TimeEntryListItem[]> {
    const response = await httpClient.get<TimeEntryListItem[]>('/api/timeentries/my', {
      params: { fromDate, toDate },
    })
    return response.data
  },

  async getById(id: number): Promise<TimeEntryListItem> {
    const response = await httpClient.get<TimeEntryListItem>(`/api/timeentries/${id}`)
    return response.data
  },

  async create(data: CreateTimeEntryRequest): Promise<TimeEntryListItem> {
    const response = await httpClient.post<TimeEntryListItem>('/api/timeentries', data)
    return response.data
  },

  async update(id: number, data: UpdateTimeEntryRequest): Promise<TimeEntryListItem> {
    const response = await httpClient.put<TimeEntryListItem>(`/api/timeentries/${id}`, data)
    return response.data
  },

  async delete(id: number): Promise<void> {
    await httpClient.delete(`/api/timeentries/${id}`)
  },
}

export default timeEntriesService