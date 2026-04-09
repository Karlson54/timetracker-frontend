"use client"

import httpClient from '@/lib/api/httpClient'
import usersService from "@/lib/api/services/usersService"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/date-range-picker"
import { FileSpreadsheet } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useTranslation } from "react-i18next"
import type { DateRange } from "react-day-picker"
import type { TimeEntryListItem } from "@/lib/api/types"
import { cn, formatEmployeeName, toLocalDateString } from '@/lib/utils'

const PAGE_SIZE = 50

function msToHours(ms: number): number {
  return Math.round((ms / 3600000) * 10) / 10
}

interface ClientSummary {
  clientName: string
  totalHours: number
  percentage: number
}

interface Employee {
  id: number
  name: string
}

export function EmployeeReports() {
  const { t } = useTranslation()

  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const today = new Date()

  const [selectedEmployee, setSelectedEmployee] = useState("all")
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: firstDayOfMonth,
    to: today,
  })

  const [employees, setEmployees] = useState<Employee[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)

  // Зведення — с пагинацией
  const [entries, setEntries] = useState<TimeEntryListItem[]>([])
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Детальний — все записи за период
  const [allEntries, setAllEntries] = useState<TimeEntryListItem[]>([])
  const [loadingDetailed, setLoadingDetailed] = useState(false)

  // Диалог экспорта
  const [showDownloadDialog, setShowDownloadDialog] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [selectedColumns, setSelectedColumns] = useState({
    company: true,
    fullName: true,
    date: true,
    market: true,
    contractingAgency: true,
    client: true,
    projectBrand: true,
    media: true,
    jobType: true,
    hours: true,
    comments: true,
  })

  // Загрузка пользователей
  useEffect(() => {
    async function fetchUsers() {
      try {
        const users = await usersService.getAll()
        setEmployees(users.map((u: any) => ({ id: u.id, name: u.name })))
      } catch (err) {
        console.error("Error fetching users:", err)
      } finally {
        setLoadingUsers(false)
      }
    }
    fetchUsers()
  }, [])

  // Сброс страницы при смене фильтров
  useEffect(() => {
    setCurrentPage(1)
  }, [dateRange, selectedEmployee])

  // Зведення — с пагинацией
  useEffect(() => {
    if (!dateRange?.from || !dateRange?.to) return

    async function fetchSummary() {
      try {
        setLoadingSummary(true)
        const params: any = {
          pageSize: PAGE_SIZE,
          pageNumber: currentPage,
          fromDate: toLocalDateString(dateRange!.from!),
          toDate: toLocalDateString(dateRange!.to!),
        }
        if (selectedEmployee !== "all") {
          params.userId = Number(selectedEmployee)
        }
        const res = await httpClient.get<any>('/api/timeentries', { params })
        const data = res.data
        setEntries(data?.entries ?? data ?? [])
        setTotalCount(data?.totalCount ?? 0)
        setTotalPages(data?.totalPages ?? 1)
      } catch (err) {
        console.error("Error fetching summary:", err)
      } finally {
        setLoadingSummary(false)
      }
    }

    fetchSummary()
  }, [dateRange, selectedEmployee, currentPage])

  // Детальний — все записи
  useEffect(() => {
    if (!dateRange?.from || !dateRange?.to) return

    async function fetchAllEntries() {
      try {
        setLoadingDetailed(true)
        const params: any = {
          pageSize: 10000,
          pageNumber: 1,
          fromDate: toLocalDateString(dateRange!.from!),
          toDate: toLocalDateString(dateRange!.to!),
        }
        if (selectedEmployee !== "all") {
          params.userId = Number(selectedEmployee)
        }
        const res = await httpClient.get<any>('/api/timeentries', { params })
        const data = res.data
        setAllEntries(data?.entries ?? data ?? [])
      } catch (err) {
        console.error("Error fetching detailed:", err)
      } finally {
        setLoadingDetailed(false)
      }
    }

    fetchAllEntries()
  }, [dateRange, selectedEmployee])

  // Breakdown по клиентам
  const clientSummary: ClientSummary[] = (() => {
    const totalMs = allEntries.reduce((sum, e) => sum + e.hoursMilliseconds, 0)
    const map: Record<string, number> = {}
    allEntries.forEach((e) => {
      const name = e.clientName || "—"
      map[name] = (map[name] || 0) + e.hoursMilliseconds
    })
    return Object.entries(map)
      .map(([clientName, ms]) => ({
        clientName,
        totalHours: msToHours(ms),
        percentage: totalMs > 0 ? Math.round((ms / totalMs) * 100) : 0,
      }))
      .sort((a, b) => b.totalHours - a.totalHours)
  })()

  const totalHoursAll = allEntries.reduce((sum, e) => sum + msToHours(e.hoursMilliseconds), 0)
  const avgHoursPerEntry = allEntries.length > 0 ? totalHoursAll / allEntries.length : 0

  // Экспорт
  const handleDownloadWithColumns = async () => {
    if (!dateRange?.from || !dateRange?.to) return
    setIsDownloading(true)
    try {
      const columnsParam = Object.entries(selectedColumns)
        .filter(([, enabled]) => enabled)
        .map(([key]) => {
          const keyMap: Record<string, string> = {
            company: 'agency',
            fullName: 'fullname',
            date: 'date',
            market: 'market',
            contractingAgency: 'contractingagency',
            client: 'client',
            projectBrand: 'projectbrand',
            media: 'media',
            jobType: 'jobtype',
            hours: 'hours',
            comments: 'comments',
          }
          return keyMap[key] ?? key
        })
        .join(',')

      const fromStr = toLocalDateString(dateRange.from).replace(/-/g, '-')
      const toStr = toLocalDateString(dateRange.to).replace(/-/g, '-')

      let url: string
      let fileName: string

      if (selectedEmployee === "all") {
        url = `/api/reports/export/flat`
        fileName = `AllReports_${fromStr}_${toStr}.xlsx`
      } else {
        const userId = Number(selectedEmployee)
        const emp = employees.find(e => e.id === userId)
        const empName = emp ? emp.name.replace(/\s+/g, '_') : `user_${userId}`
        url = `/api/reports/user/${userId}/export/flat`
        fileName = `Report_${empName}_${fromStr}_${toStr}.xlsx`
      }

      const response = await httpClient.get(url, {
        params: {
          fromDate: toLocalDateString(dateRange.from),
          toDate: toLocalDateString(dateRange.to),
          columns: columnsParam,
          locale: 'uk',
        },
        responseType: 'blob',
      })

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = fileName
      a.click()
      URL.revokeObjectURL(blobUrl)
      setShowDownloadDialog(false)
    } catch (error) {
      console.error("Download error:", error)
      alert(t('admin.reports.errors.excelCreationError'))
    } finally {
      setIsDownloading(false)
    }
  }

  const Pagination = () =>
    totalPages > 1 ? (
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-gray-500">
          {t('admin.reports.pagination.showing', {
            from: (currentPage - 1) * PAGE_SIZE + 1,
            to: Math.min(currentPage * PAGE_SIZE, totalCount),
            total: totalCount,
          })}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1 || loadingSummary}
          >
            ←
          </Button>
          <span className="text-sm">{currentPage} / {totalPages}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || loadingSummary}
          >
            →
          </Button>
        </div>
      </div>
    ) : null

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('admin.reports.title')}</h1>
        </div>
        <Button onClick={() => setShowDownloadDialog(true)} className="gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          {t('admin.reports.exportAllToExcel')}
        </Button>
      </div>

      {/* Фильтры */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.reports.filters.title')}</CardTitle>
          <CardDescription>{t('admin.reports.filters.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{t('admin.reports.filters.employee')}</label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder={t('admin.reports.filters.selectEmployee')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('admin.reports.filters.allEmployees')}</SelectItem>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="text-sm font-medium mb-2 block">{t('admin.reports.filters.period')}</label>
              <DatePickerWithRange date={dateRange} setDate={setDateRange} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('admin.reports.summary.totalHoursTitle')}</CardTitle>
            <CardDescription>{t('admin.reports.summary.period')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalHoursAll.toFixed(1)} {t('calendar.totalPeriodHours')}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('admin.reports.summary.reportsCountTitle')}</CardTitle>
            <CardDescription>{t('admin.reports.summary.period')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Середній час</CardTitle>
            <CardDescription>{t('admin.reports.summary.period')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">
                  {(() => {
                    const uniqueDays = new Set(allEntries.map(e => e.entryDate.split('T')[0])).size
                    return uniqueDays > 0 ? (totalHoursAll / uniqueDays).toFixed(1) : "0"
                  })()}
                </span>
                <span className="text-sm text-muted-foreground">{t('calendar.totalPeriodHours')} / день</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">
                  {avgHoursPerEntry > 0 ? avgHoursPerEntry.toFixed(1) : "0"}
                </span>
                <span className="text-sm text-muted-foreground">{t('calendar.totalPeriodHours')} / запис</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Табы */}
      <Tabs defaultValue="summary">
        <TabsList>
          <TabsTrigger value="summary">{t('admin.reports.tabs.summary')}</TabsTrigger>
          <TabsTrigger value="detailed">{t('admin.reports.tabs.detailed')}</TabsTrigger>
        </TabsList>

        {/* Зведення */}
        <TabsContent value="summary" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.reports.summary.summaryTitle')}</CardTitle>
              <CardDescription>{t('admin.reports.summary.summaryDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSummary && (
                <div className="text-center py-2 text-sm text-gray-400">
                  {t('admin.reports.loadingReports')}
                </div>
              )}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Agency</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Market</TableHead>
                      <TableHead>Contracting Agency / Unit</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Project / brand</TableHead>
                      <TableHead>Media</TableHead>
                      <TableHead>Job type</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Comments</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.length === 0 && !loadingSummary ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center">
                          {t('admin.reports.summary.noReportsAvailable')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      entries.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="whitespace-nowrap">{entry.userName || "—"}</TableCell>
                          <TableCell className="whitespace-nowrap">{entry.agencyName || "—"}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            {new Date(entry.entryDate).toLocaleDateString('uk-UA', {
                              day: '2-digit', month: '2-digit', year: 'numeric',
                            })}
                          </TableCell>
                          <TableCell>{entry.marketName || "—"}</TableCell>
                          <TableCell>{entry.contractingAgencyName || "—"}</TableCell>
                          <TableCell>{entry.clientName || "—"}</TableCell>
                          <TableCell>{entry.projectBrandName || "—"}</TableCell>
                          <TableCell>{entry.mediaName || "—"}</TableCell>
                          <TableCell>{entry.jobTypeName || "—"}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            {msToHours(entry.hoursMilliseconds).toFixed(1)}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate" title={entry.comments ?? ""}>
                            {entry.comments || "—"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <Pagination />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Детальний */}
        <TabsContent value="detailed" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.reports.detailed.title')}</CardTitle>
              <CardDescription>{t('admin.reports.detailed.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingDetailed && (
                <div className="text-center py-2 text-sm text-gray-400">
                  {t('admin.reports.loadingReports')}
                </div>
              )}

              {clientSummary.length > 0 ? (
                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-3">
                    {t('admin.reports.detailed.timeDistribution')}
                  </h3>
                  <div className="space-y-3">
                    {clientSummary.map((client) => (
                      <div key={client.clientName}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{client.clientName}</span>
                          <span className="text-gray-500">
                            {client.totalHours.toFixed(1)}г ({client.percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${client.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Client</TableHead>
                          <TableHead className="text-right">Hours</TableHead>
                          <TableHead className="text-right">%</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clientSummary.map((client) => (
                          <TableRow key={client.clientName}>
                            <TableCell>{client.clientName}</TableCell>
                            <TableCell className="text-right font-medium">
                              {client.totalHours.toFixed(1)}
                            </TableCell>
                            <TableCell className="text-right text-gray-500">
                              {client.percentage}%
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="border-t-2">
                          <TableCell className="font-semibold">Total</TableCell>
                          <TableCell className="text-right font-semibold">
                            {totalHoursAll.toFixed(1)}
                          </TableCell>
                          <TableCell className="text-right font-semibold">100%</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                !loadingDetailed && (
                  <p className="text-center text-gray-500 py-8">
                    {t('admin.reports.summary.noReportsAvailable')}
                  </p>
                )
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Диалог экспорта */}
      <Dialog open={showDownloadDialog} onOpenChange={setShowDownloadDialog}>
        <DialogContent className="max-w-[95vw] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{t('admin.reports.downloadDialog.title')}</DialogTitle>
            <DialogDescription>{t('admin.reports.downloadDialog.description')}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-row flex-wrap gap-4 py-4">
            {(Object.keys(selectedColumns) as Array<keyof typeof selectedColumns>).map((key) => {
              const labelMap: Record<keyof typeof selectedColumns, string> = {
                company: 'Agency',
                fullName: 'Name',
                date: 'Date',
                market: 'Market',
                contractingAgency: 'Contracting Agency / Unit',
                client: 'Client',
                projectBrand: 'Project / brand',
                media: 'Media',
                jobType: 'Job type',
                hours: 'Hours',
                comments: 'Comments',
              }
              return (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`col-${key}`}
                    checked={selectedColumns[key]}
                    onCheckedChange={(checked) =>
                      setSelectedColumns({ ...selectedColumns, [key]: !!checked })
                    }
                  />
                  <label htmlFor={`col-${key}`} className="text-sm font-medium">
                    {labelMap[key]}
                  </label>
                </div>
              )
            })}
          </div>

          {/* Preview таблица */}
          <div>
            <h3 className="text-sm font-medium mb-2">{t('admin.reports.downloadDialog.tablePreview')}</h3>
            <div className="border rounded-md overflow-auto" style={{ maxHeight: "300px" }}>
              <Table>
                <TableHeader>
                  <TableRow>
                    {selectedColumns.company && <TableHead>Agency</TableHead>}
                    {selectedColumns.fullName && <TableHead>Name</TableHead>}
                    {selectedColumns.date && <TableHead>Date</TableHead>}
                    {selectedColumns.market && <TableHead>Market</TableHead>}
                    {selectedColumns.contractingAgency && <TableHead>Contracting Agency / Unit</TableHead>}
                    {selectedColumns.client && <TableHead>Client</TableHead>}
                    {selectedColumns.projectBrand && <TableHead>Project / brand</TableHead>}
                    {selectedColumns.media && <TableHead>Media</TableHead>}
                    {selectedColumns.jobType && <TableHead>Job type</TableHead>}
                    {selectedColumns.hours && <TableHead>Hours</TableHead>}
                    {selectedColumns.comments && <TableHead>Comments</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const previewEntry = allEntries[0] ?? entries[0]
                    if (!previewEntry) {
                      return (
                        <TableRow>
                          <TableCell colSpan={Object.values(selectedColumns).filter(Boolean).length || 1} className="text-center text-gray-400 text-sm">
                            {t('admin.reports.downloadDialog.noDataToExport')}
                          </TableCell>
                        </TableRow>
                      )
                    }
                    return (
                      <TableRow>
                        {selectedColumns.company && <TableCell>{previewEntry.agencyName || '—'}</TableCell>}
                        {selectedColumns.fullName && <TableCell>{previewEntry.userName || '—'}</TableCell>}
                        {selectedColumns.date && (
                          <TableCell>
                            {new Date(previewEntry.entryDate).toLocaleDateString('uk-UA', {
                              day: '2-digit', month: '2-digit', year: 'numeric',
                            })}
                          </TableCell>
                        )}
                        {selectedColumns.market && <TableCell>{previewEntry.marketName || '—'}</TableCell>}
                        {selectedColumns.contractingAgency && <TableCell>{previewEntry.contractingAgencyName || '—'}</TableCell>}
                        {selectedColumns.client && <TableCell>{previewEntry.clientName || '—'}</TableCell>}
                        {selectedColumns.projectBrand && <TableCell>{previewEntry.projectBrandName || '—'}</TableCell>}
                        {selectedColumns.media && <TableCell>{previewEntry.mediaName || '—'}</TableCell>}
                        {selectedColumns.jobType && <TableCell>{previewEntry.jobTypeName || '—'}</TableCell>}
                        {selectedColumns.hours && <TableCell>{msToHours(previewEntry.hoursMilliseconds).toFixed(1)}</TableCell>}
                        {selectedColumns.comments && <TableCell>{previewEntry.comments || '—'}</TableCell>}
                      </TableRow>
                    )
                  })()}
                </TableBody>
              </Table>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDownloadDialog(false)}>
              {t('admin.reports.downloadDialog.cancel')}
            </Button>
            <Button onClick={handleDownloadWithColumns} disabled={isDownloading}>
              {isDownloading ? '...' : t('admin.reports.downloadDialog.download')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}