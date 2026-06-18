"use client"

import httpClient from '@/lib/api/httpClient'
import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { DatePickerWithRange } from "@/components/date-range-picker"
import { FileSpreadsheet } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { useTranslation } from "react-i18next"
import type { DateRange } from "react-day-picker"
import type { TimeEntryListItem } from "@/lib/api/types"
import { StatsCards } from '@/components/reports/StatsCards'
import { Pagination } from '@/components/reports/Pagination'
import { EntriesTable } from '@/components/reports/EntriesTable'
import { toLocalDateString, msToHours } from '@/lib/utils'
import { MultiSelect, MultiSelectOption } from '@/components/ui/multi-select'

const PAGE_SIZE = 50

interface ClientSummary {
  clientName: string
  totalHours: number
  percentage: number
}

interface QueryCombo {
  userId?: number
  agencyId?: number
  departmentId?: number
}

export function EmployeeReports() {
  const { t } = useTranslation()

  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const today = new Date()

  // --- Фильтры ---
  const [selectedAgencyIds, setSelectedAgencyIds] = useState<number[]>([])
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<number[]>([])
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([])

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: firstDayOfMonth,
    to: today,
  })

  // --- Все записи за период (для построения фильтров) ---
  const [allEntriesForFilter, setAllEntriesForFilter] = useState<TimeEntryListItem[]>([])
  const [loadingFilter, setLoadingFilter] = useState(false)

  // --- Записи для отображения ---
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
    company: true, department: true, fullName: true, date: true,
    month: true, year: true, market: true, contractingAgency: true,
    client: true, projectBrand: true, media: true, jobType: true,
    hours: true, comments: true,
  })

  const columnLabels: Record<keyof typeof selectedColumns, string> = {
    company: 'Agency', department: 'Department', fullName: 'Name',
    date: 'Date', month: 'Month', year: 'Year', market: 'Market',
    contractingAgency: 'Contracting Agency / Unit', client: 'Client',
    projectBrand: 'Project / brand', media: 'Media', jobType: 'Job type',
    hours: 'Hours', comments: 'Comments',
  }

  // --- Загружаем ВСЕ записи за период для построения списков фильтров ---
  useEffect(() => {
    if (!dateRange?.from || !dateRange?.to) return

    async function fetchEntriesForFilter() {
      try {
        setLoadingFilter(true)
        const res = await httpClient.get<any>('/api/timeentries', {
          params: {
            pageSize: 10000,
            pageNumber: 1,
            fromDate: toLocalDateString(dateRange!.from!),
            toDate: toLocalDateString(dateRange!.to!),
          },
        })
        setAllEntriesForFilter(res.data?.entries ?? [])
      } catch (err) {
        console.error("Error fetching entries for filter:", err)
      } finally {
        setLoadingFilter(false)
      }
    }

    fetchEntriesForFilter()
  }, [dateRange])

  // --- Агенции из записей ---
  const allAgencies = useMemo<MultiSelectOption[]>(() => {
    const seen = new Set<number>()
    const result: MultiSelectOption[] = []
    for (const entry of allEntriesForFilter) {
      if (entry.agencyId != null && !seen.has(entry.agencyId)) {
        seen.add(entry.agencyId)
        result.push({ id: entry.agencyId, name: entry.agencyName ?? String(entry.agencyId) })
      }
    }
    return result.sort((a, b) => a.name.localeCompare(b.name))
  }, [allEntriesForFilter])

  // --- Отделы из записей, фильтруются по выбранным агенциям ---
  const availableDepartments = useMemo<MultiSelectOption[]>(() => {
    let filtered = allEntriesForFilter
    if (selectedAgencyIds.length > 0) {
      filtered = filtered.filter((e) =>
        e.agencyId != null && selectedAgencyIds.includes(e.agencyId)
      )
    }
    const seen = new Set<number>()
    const result: MultiSelectOption[] = []
    for (const entry of filtered) {
      if (entry.departmentId != null && !seen.has(entry.departmentId)) {
        seen.add(entry.departmentId)
        result.push({
          id: entry.departmentId,
          name: entry.departmentName ?? String(entry.departmentId),
        })
      }
    }
    return result.sort((a, b) => a.name.localeCompare(b.name))
  }, [allEntriesForFilter, selectedAgencyIds])

  // --- Сотрудники из записей, фильтруются по агенциям и отделам ---
  const availableEmployees = useMemo<MultiSelectOption[]>(() => {
    let filtered = allEntriesForFilter
    if (selectedAgencyIds.length > 0) {
      filtered = filtered.filter((e) =>
        e.agencyId != null && selectedAgencyIds.includes(e.agencyId)
      )
    }
    if (selectedDepartmentIds.length > 0) {
      filtered = filtered.filter((e) =>
        e.departmentId != null && selectedDepartmentIds.includes(e.departmentId)
      )
    }
    const seen = new Set<number>()
    const result: MultiSelectOption[] = []
    for (const entry of filtered) {
      if (!seen.has(entry.userId)) {
        seen.add(entry.userId)
        result.push({ id: entry.userId, name: entry.userName })
      }
    }
    return result.sort((a, b) => a.name.localeCompare(b.name))
  }, [allEntriesForFilter, selectedAgencyIds, selectedDepartmentIds])

  // --- Сбрасываем невалидные выборы при смене доступных опций ---
  useEffect(() => {
    const validIds = availableDepartments.map((d) => d.id)
    setSelectedDepartmentIds((prev) => prev.filter((id) => validIds.includes(id)))
  }, [availableDepartments])

  useEffect(() => {
    const validIds = availableEmployees.map((e) => e.id)
    setSelectedEmployeeIds((prev) => prev.filter((id) => validIds.includes(id)))
  }, [availableEmployees])

  // --- Комбинации для API запросов ---
  const queryCombosMemo = useMemo<QueryCombo[]>(() => {
    if (selectedEmployeeIds.length > 0) {
      return selectedEmployeeIds.map((uid) => ({ userId: uid }))
    }
    if (selectedAgencyIds.length > 0 && selectedDepartmentIds.length > 0) {
      const combos: QueryCombo[] = []
      for (const agencyId of selectedAgencyIds) {
        for (const departmentId of selectedDepartmentIds) {
          combos.push({ agencyId, departmentId })
        }
      }
      return combos
    }
    if (selectedDepartmentIds.length > 0) {
      return selectedDepartmentIds.map((departmentId) => ({ departmentId }))
    }
    if (selectedAgencyIds.length > 0) {
      return selectedAgencyIds.map((agencyId) => ({ agencyId }))
    }
    return [{}]
  }, [selectedEmployeeIds, selectedAgencyIds, selectedDepartmentIds])

  // --- Сброс страницы ---
  useEffect(() => {
    setCurrentPage(1)
  }, [dateRange, queryCombosMemo])

  // --- Универсальная функция запросов ---
  const fetchByCombo = async (
    combos: QueryCombo[],
    fromDate: string,
    toDate: string,
  ): Promise<TimeEntryListItem[]> => {
    const isSingleNoFilter = combos.length === 1 && Object.keys(combos[0]).length === 0

    if (isSingleNoFilter) {
      const res = await httpClient.get<any>('/api/timeentries', {
        params: { pageSize: 10000, pageNumber: 1, fromDate, toDate },
      })
      return res.data?.entries ?? []
    }

    const results = await Promise.all(
      combos.map((combo) =>
        httpClient.get<any>('/api/timeentries', {
          params: {
            pageSize: 10000,
            pageNumber: 1,
            fromDate,
            toDate,
            ...(combo.userId && { userId: combo.userId }),
            ...(combo.agencyId && { agencyId: combo.agencyId }),
            ...(combo.departmentId && { departmentId: combo.departmentId }),
          },
        }).then((r) => r.data?.entries ?? [])
      )
    )

    const seen = new Set<number>()
    const merged: TimeEntryListItem[] = []
    for (const batch of results) {
      for (const entry of batch) {
        if (!seen.has(entry.id)) {
          seen.add(entry.id)
          merged.push(entry)
        }
      }
    }
    return merged
  }

  // --- Загрузка записей с пагинацией ---
  useEffect(() => {
    if (!dateRange?.from || !dateRange?.to) return

    async function fetchSummary() {
      try {
        setLoadingSummary(true)
        const fromDate = toLocalDateString(dateRange!.from!)
        const toDate = toLocalDateString(dateRange!.to!)
        const isSingleNoFilter =
          queryCombosMemo.length === 1 && Object.keys(queryCombosMemo[0]).length === 0

        if (isSingleNoFilter) {
          const res = await httpClient.get<any>('/api/timeentries', {
            params: { pageSize: PAGE_SIZE, pageNumber: currentPage, fromDate, toDate },
          })
          const data = res.data
          setEntries(data?.entries ?? [])
          setTotalCount(data?.totalCount ?? 0)
          setTotalPages(data?.totalPages ?? 1)
        } else {
          const merged = await fetchByCombo(queryCombosMemo, fromDate, toDate)
          merged.sort((a, b) =>
            new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()
          )
          const start = (currentPage - 1) * PAGE_SIZE
          setEntries(merged.slice(start, start + PAGE_SIZE))
          setTotalCount(merged.length)
          setTotalPages(Math.ceil(merged.length / PAGE_SIZE) || 1)
        }
      } catch (err) {
        console.error("Error fetching summary:", err)
      } finally {
        setLoadingSummary(false)
      }
    }

    fetchSummary()
  }, [dateRange, queryCombosMemo, currentPage])

  // --- Загрузка всех записей для детального отчёта ---
  useEffect(() => {
    if (!dateRange?.from || !dateRange?.to) return

    async function fetchAllEntries() {
      try {
        setLoadingDetailed(true)
        const fromDate = toLocalDateString(dateRange!.from!)
        const toDate = toLocalDateString(dateRange!.to!)
        const merged = await fetchByCombo(queryCombosMemo, fromDate, toDate)
        setAllEntries(merged)
      } catch (err) {
        console.error("Error fetching detailed:", err)
      } finally {
        setLoadingDetailed(false)
      }
    }

    fetchAllEntries()
  }, [dateRange, queryCombosMemo])

  const clientSummary: ClientSummary[] = useMemo(() => {
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
  }, [allEntries])

  const totalHoursAll = useMemo(
    () => msToHours(allEntries.reduce((sum, e) => sum + e.hoursMilliseconds, 0)),
    [allEntries]
  )

  const downloadBlob = (data: BlobPart, filename: string) => {
    const blob = new Blob([data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadWithColumns = async () => {
    if (!dateRange?.from || !dateRange?.to) return
    setIsDownloading(true)
    try {
      const columnsParam = Object.entries(selectedColumns)
        .filter(([, v]) => v)
        .map(([key]) => ({
          company: 'agency', department: 'department', fullName: 'fullname',
          date: 'date', month: 'month', year: 'year', market: 'market',
          contractingAgency: 'contractingagency', client: 'client',
          projectBrand: 'projectbrand', media: 'media', jobType: 'jobtype',
          hours: 'hours', comments: 'comments',
        }[key] ?? key))
        .join(',')

      const fromStr = toLocalDateString(dateRange.from)
      const toStr = toLocalDateString(dateRange.to)

      const isSingleUser =
        selectedEmployeeIds.length === 1 &&
        selectedAgencyIds.length === 0 &&
        selectedDepartmentIds.length === 0

      if (isSingleUser) {
        const res = await httpClient.get(
          `/api/reports/user/${selectedEmployeeIds[0]}/export/flat`,
          { params: { fromDate: fromStr, toDate: toStr, columns: columnsParam }, responseType: 'blob' }
        )
        downloadBlob(res.data, `Report_${fromStr}_${toStr}.xlsx`)
      } else {
        const res = await httpClient.get(
          `/api/reports/export/flat`,
          { params: { fromDate: fromStr, toDate: toStr, columns: columnsParam }, responseType: 'blob' }
        )
        downloadBlob(res.data, `AllReports_${fromStr}_${toStr}.xlsx`)
      }
      setShowDownloadDialog(false)
    } catch (error) {
      console.error("Download error:", error)
      alert(t('admin.reports.errors.excelCreationError'))
    } finally {
      setIsDownloading(false)
    }
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

      <Card>
        <CardHeader>
          <CardTitle>{t('admin.reports.filters.title')}</CardTitle>
          <CardDescription>{t('admin.reports.filters.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Агенція</label>
              <MultiSelect
                options={allAgencies}
                selectedIds={selectedAgencyIds}
                onChange={setSelectedAgencyIds}
                disabled={loadingFilter}
                placeholder="Всі агенції"
                selectAllText="Вибрати всі"
                clearText="Очистити"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Відділ</label>
              <MultiSelect
                options={availableDepartments}
                selectedIds={selectedDepartmentIds}
                onChange={setSelectedDepartmentIds}
                disabled={loadingFilter}
                placeholder="Всі відділи"
                selectAllText="Вибрати всі"
                clearText="Очистити"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Співробітники</label>
              <MultiSelect
                options={availableEmployees}
                selectedIds={selectedEmployeeIds}
                onChange={setSelectedEmployeeIds}
                disabled={loadingFilter}
                placeholder="Всі співробітники"
                selectAllText="Вибрати всіх"
                clearText="Очистити"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                {t('admin.reports.filters.period')}
              </label>
              <DatePickerWithRange date={dateRange} setDate={setDateRange} />
            </div>
          </div>
        </CardContent>
      </Card>

      <StatsCards allEntries={allEntries} totalCount={totalCount} />

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

      {/* Export Dialog */}
      <Dialog open={showDownloadDialog} onOpenChange={setShowDownloadDialog}>
        <DialogContent className="max-w-[90vw] w-full max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{t('admin.reports.downloadDialog.title')}</DialogTitle>
            <DialogDescription>{t('admin.reports.downloadDialog.description')}</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 py-2">
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              {(Object.keys(selectedColumns) as Array<keyof typeof selectedColumns>).map((key) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`col-${key}`}
                    checked={selectedColumns[key]}
                    onCheckedChange={(checked) =>
                      setSelectedColumns({ ...selectedColumns, [key]: !!checked })
                    }
                  />
                  <label htmlFor={`col-${key}`} className="text-sm font-medium cursor-pointer">
                    {columnLabels[key]}
                  </label>
                </div>
              ))}
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">
                {t('admin.reports.downloadDialog.tablePreview')}
              </h3>
              <div className="border rounded-md overflow-auto max-h-[300px]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      {selectedColumns.company && <th className="px-3 py-2 text-left font-medium whitespace-nowrap">Agency</th>}
                      {selectedColumns.department && <th className="px-3 py-2 text-left font-medium whitespace-nowrap">Department</th>}
                      {selectedColumns.fullName && <th className="px-3 py-2 text-left font-medium whitespace-nowrap">Name</th>}
                      {selectedColumns.date && <th className="px-3 py-2 text-left font-medium whitespace-nowrap">Date</th>}
                      {selectedColumns.month && <th className="px-3 py-2 text-left font-medium whitespace-nowrap">Month</th>}
                      {selectedColumns.year && <th className="px-3 py-2 text-left font-medium whitespace-nowrap">Year</th>}
                      {selectedColumns.market && <th className="px-3 py-2 text-left font-medium whitespace-nowrap">Market</th>}
                      {selectedColumns.contractingAgency && <th className="px-3 py-2 text-left font-medium whitespace-nowrap">Contracting Agency / Unit</th>}
                      {selectedColumns.client && <th className="px-3 py-2 text-left font-medium whitespace-nowrap">Client</th>}
                      {selectedColumns.projectBrand && <th className="px-3 py-2 text-left font-medium whitespace-nowrap">Project / brand</th>}
                      {selectedColumns.media && <th className="px-3 py-2 text-left font-medium whitespace-nowrap">Media</th>}
                      {selectedColumns.jobType && <th className="px-3 py-2 text-left font-medium whitespace-nowrap">Job type</th>}
                      {selectedColumns.hours && <th className="px-3 py-2 text-left font-medium whitespace-nowrap">Hours</th>}
                      {selectedColumns.comments && <th className="px-3 py-2 text-left font-medium whitespace-nowrap">Comments</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const preview = allEntries[0] ?? entries[0]
                      if (!preview) {
                        return (
                          <tr>
                            <td
                              colSpan={Object.values(selectedColumns).filter(Boolean).length || 1}
                              className="px-3 py-4 text-center text-muted-foreground text-sm"
                            >
                              {t('admin.reports.downloadDialog.noDataToExport')}
                            </td>
                          </tr>
                        )
                      }
                      return (
                        <tr className="border-b">
                          {selectedColumns.company && <td className="px-3 py-2 whitespace-nowrap">{preview.agencyName || '—'}</td>}
                          {selectedColumns.department && <td className="px-3 py-2 whitespace-nowrap">{preview.departmentName || '—'}</td>}
                          {selectedColumns.fullName && <td className="px-3 py-2 whitespace-nowrap">{preview.userName || '—'}</td>}
                          {selectedColumns.date && (
                            <td className="px-3 py-2 whitespace-nowrap">
                              {new Date(preview.entryDate).toLocaleDateString('uk-UA', {
                                day: '2-digit', month: '2-digit', year: 'numeric',
                              })}
                            </td>
                          )}
                          {selectedColumns.month && (
                            <td className="px-3 py-2 whitespace-nowrap">
                              {new Date(preview.entryDate).toLocaleString('en-US', { month: 'long' })}
                            </td>
                          )}
                          {selectedColumns.year && (
                            <td className="px-3 py-2 whitespace-nowrap">
                              {new Date(preview.entryDate).getFullYear()}
                            </td>
                          )}
                          {selectedColumns.market && <td className="px-3 py-2 whitespace-nowrap">{preview.marketName || '—'}</td>}
                          {selectedColumns.contractingAgency && <td className="px-3 py-2 whitespace-nowrap">{preview.contractingAgencyName || '—'}</td>}
                          {selectedColumns.client && <td className="px-3 py-2 whitespace-nowrap">{preview.clientName || '—'}</td>}
                          {selectedColumns.projectBrand && <td className="px-3 py-2 whitespace-nowrap">{preview.projectBrandName || '—'}</td>}
                          {selectedColumns.media && <td className="px-3 py-2 whitespace-nowrap">{preview.mediaName || '—'}</td>}
                          {selectedColumns.jobType && <td className="px-3 py-2 whitespace-nowrap">{preview.jobTypeName || '—'}</td>}
                          {selectedColumns.hours && (
                            <td className="px-3 py-2 whitespace-nowrap">
                              {msToHours(preview.hoursMilliseconds).toFixed(1)}
                            </td>
                          )}
                          {selectedColumns.comments && <td className="px-3 py-2 whitespace-nowrap">{preview.comments || '—'}</td>}
                        </tr>
                      )
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <DialogFooter className="pt-2">
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