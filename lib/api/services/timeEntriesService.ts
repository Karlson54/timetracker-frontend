import httpClient from '@/lib/api/httpClient'
import type { TimeEntryListItem, CreateTimeEntryRequest, UpdateTimeEntryRequest } from '@/lib/api/types'

interface PagedTimeEntriesResponse {
  entries: TimeEntryListItem[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
}

const timeEntriesService = {
  async getMy(
    fromDate?: string,
    toDate?: string,
    pageNumber: number = 1,
    pageSize: number = 50
  ): Promise<PagedTimeEntriesResponse> {
    const response = await httpClient.get<PagedTimeEntriesResponse>('/api/timeentries/my', {
      params: { fromDate, toDate, pageNumber, pageSize },
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

  async deleteBulk(ids: number[]): Promise<void> {
    await httpClient.delete('/api/timeentries/bulk', { data: ids })
  },

  async copySelected(entryIds: number[], targetDate: string): Promise<TimeEntryListItem[]> {
    const response = await httpClient.post<TimeEntryListItem[]>('/api/timeentries/copy-selected', {
      entryIds,
      targetDate,
    })
    return response.data
  },
}

export default timeEntriesService