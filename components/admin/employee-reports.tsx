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
import { StatsCards } from '@/components/reports/StatsCards'
import { Pagination } from '@/components/reports/Pagination'
import { EntriesTable } from '@/components/reports/EntriesTable'
import { toLocalDateString, msToHours } from '@/lib/utils'

const PAGE_SIZE = 50

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

  const [entries, setEntries] = useState<TimeEntryListItem[]>([])
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const [allEntries, setAllEntries] = useState<TimeEntryListItem[]>([])
  const [loadingDetailed, setLoadingDetailed] = useState(false)

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

  useEffect(() => {
    setCurrentPage(1)
  }, [dateRange, selectedEmployee])

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
        if (selectedEmployee !== "all") params.userId = Number(selectedEmployee)
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
        if (selectedEmployee !== "all") params.userId = Number(selectedEmployee)
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

  const totalHoursAll = msToHours(allEntries.reduce((sum, e) => sum + e.hoursMilliseconds, 0))

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

      const fromStr = toLocalDateString(dateRange.from)
      const toStr = toLocalDateString(dateRange.to)

      const url = selectedEmployee === "all"
        ? `/api/reports/export/flat`
        : `/api/reports/user/${selectedEmployee}/export/flat`

      const empName = selectedEmployee === "all"
        ? "AllReports"
        : employees.find(e => String(e.id) === selectedEmployee)?.name.replace(/\s+/g, '_') ?? `user_${selectedEmployee}`

      const response = await httpClient.get(url, {
        params: {
          fromDate: fromStr,
          toDate: toStr,
          columns: columnsParam,
          locale: 'en',
        },
        responseType: 'blob',
      })

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `${empName}_${fromStr}_${toStr}.xlsx`
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

  const columnLabels: Record<keyof typeof selectedColumns, string> = {
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">{t('admin.reports.title')}</h1>
        <Button onClick={() => setShowDownloadDialog(true)} className="gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          {t('admin.reports.exportAllToExcel')}
        </Button>
      </div>

      {/* Фільтри */}
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

      <StatsCards allEntries={allEntries} totalCount={totalCount} />

      {/* Табы */}
      <Tabs defaultValue="summary">
        <TabsList>
          <TabsTrigger value="summary">{t('admin.reports.tabs.summary')}</TabsTrigger>
          <TabsTrigger value="detailed">{t('admin.reports.tabs.detailed')}</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.reports.summary.summaryTitle')}</CardTitle>
              <CardDescription>{t('admin.reports.summary.summaryDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <EntriesTable
                entries={entries}
                loading={loadingSummary}
                emptyText={t('admin.reports.summary.noReportsAvailable')}
              />
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalCount={totalCount}
                pageSize={PAGE_SIZE}
                loading={loadingSummary}
                onPageChange={setCurrentPage}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.reports.detailed.title')}</CardTitle>
              <CardDescription>{t('admin.reports.detailed.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingDetailed && (
                <div className="text-center py-2 text-sm text-muted-foreground">
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
                          <span className="text-muted-foreground">
                            {client.totalHours.toFixed(1)}г ({client.percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
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
                            <TableCell className="text-right text-muted-foreground">
                              {client.percentage}%
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="border-t-2 border-border">
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

      {/* Діалог експорту */}
      <Dialog open={showDownloadDialog} onOpenChange={setShowDownloadDialog}>
        <DialogContent className="max-w-[95vw] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{t('admin.reports.downloadDialog.title')}</DialogTitle>
            <DialogDescription>{t('admin.reports.downloadDialog.description')}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-row flex-wrap gap-4 py-4">
            {(Object.keys(selectedColumns) as Array<keyof typeof selectedColumns>).map((key) => (
              <div key={key} className="flex items-center space-x-2">
                <Checkbox
                  id={`col-${key}`}
                  checked={selectedColumns[key]}
                  onCheckedChange={(checked) =>
                    setSelectedColumns({ ...selectedColumns, [key]: !!checked })
                  }
                />
                <label htmlFor={`col-${key}`} className="text-sm font-medium">
                  {columnLabels[key]}
                </label>
              </div>
            ))}
          </div>

          {/* Preview таблица в диалоге */}
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
                    const preview = allEntries[0] ?? entries[0]
                    if (!preview) {
                      return (
                        <TableRow>
                          <TableCell
                            colSpan={Object.values(selectedColumns).filter(Boolean).length || 1}
                            className="text-center text-gray-400 text-sm"
                          >
                            {t('admin.reports.downloadDialog.noDataToExport')}
                          </TableCell>
                        </TableRow>
                      )
                    }
                    return (
                      <TableRow>
                        {selectedColumns.company && <TableCell>{preview.agencyName || '—'}</TableCell>}
                        {selectedColumns.fullName && <TableCell>{preview.userName || '—'}</TableCell>}
                        {selectedColumns.date && (
                          <TableCell>
                            {new Date(preview.entryDate).toLocaleDateString('uk-UA', {
                              day: '2-digit', month: '2-digit', year: 'numeric',
                            })}
                          </TableCell>
                        )}
                        {selectedColumns.market && <TableCell>{preview.marketName || '—'}</TableCell>}
                        {selectedColumns.contractingAgency && <TableCell>{preview.contractingAgencyName || '—'}</TableCell>}
                        {selectedColumns.client && <TableCell>{preview.clientName || '—'}</TableCell>}
                        {selectedColumns.projectBrand && <TableCell>{preview.projectBrandName || '—'}</TableCell>}
                        {selectedColumns.media && <TableCell>{preview.mediaName || '—'}</TableCell>}
                        {selectedColumns.jobType && <TableCell>{preview.jobTypeName || '—'}</TableCell>}
                        {selectedColumns.hours && (
                          <TableCell>{msToHours(preview.hoursMilliseconds).toFixed(1)}</TableCell>
                        )}
                        {selectedColumns.comments && <TableCell>{preview.comments || '—'}</TableCell>}
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