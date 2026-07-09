"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DatePickerWithRange } from "@/components/date-range-picker"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { FileSpreadsheet } from "lucide-react"
import type { DateRange } from "react-day-picker"
import { useTranslation } from "react-i18next"
import timeEntriesService from "@/lib/api/services/timeEntriesService"
import type { TimeEntryListItem } from "@/lib/api/types"
import { StatsCards } from '@/components/reports/StatsCards'
import { Pagination } from '@/components/reports/Pagination'
import { EntriesTable } from '@/components/reports/EntriesTable'
import { toLocalDateString, msToHours } from '@/lib/utils'
import { useAuthContext } from '@/lib/AuthContext'
import httpClient from '@/lib/api/httpClient'

const PAGE_SIZE = 50

interface ClientSummary {
  clientName: string
  totalHours: number
  percentage: number
}

export function EmployeeReports() {
  const { t } = useTranslation()
  const { user } = useAuthContext()

  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const today = new Date()

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: firstDayOfMonth,
    to: today,
  })

  const [entries, setEntries] = useState<TimeEntryListItem[]>([])
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const [allEntries, setAllEntries] = useState<TimeEntryListItem[]>([])
  const [loadingDetailed, setLoadingDetailed] = useState(false)

  // Export dialog state
  const [showDownloadDialog, setShowDownloadDialog] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [selectedColumns, setSelectedColumns] = useState({
    company: true,
    department: true,
    fullName: true,
    date: true,
    month: true,
    year: true,
    market: true,
    contractingAgency: true,
    client: true,
    projectBrand: true,
    media: true,
    jobType: true,
    hours: true,
    comments: true,
  })

  const columnLabels: Record<keyof typeof selectedColumns, string> = {
    company: 'Agency',
    department: 'Department',
    fullName: 'Name',
    date: 'Date',
    month: 'Month',
    year: 'Year',
    market: 'Market',
    contractingAgency: 'Contracting Agency / Unit',
    client: 'Client',
    projectBrand: 'Project / brand',
    media: 'Media',
    jobType: 'Job type',
    hours: 'Hours',
    comments: 'Comments',
  }

  useEffect(() => {
    setCurrentPage(1)
  }, [dateRange])

  useEffect(() => {
    if (!dateRange?.from || !dateRange?.to) return
    async function fetchSummaryEntries() {
      try {
        setLoadingSummary(true)
        const result = await timeEntriesService.getMy(
          toLocalDateString(dateRange!.from!),
          toLocalDateString(dateRange!.to!),
          currentPage,
          PAGE_SIZE
        )
        setEntries(result.entries)
        setTotalCount(result.totalCount)
        setTotalPages(result.totalPages)
      } catch (err) {
        console.error("Error fetching time entries:", err)
      } finally {
        setLoadingSummary(false)
      }
    }
    fetchSummaryEntries()
  }, [dateRange, currentPage])

  useEffect(() => {
    if (!dateRange?.from || !dateRange?.to) return
    async function fetchAllEntries() {
      try {
        setLoadingDetailed(true)
        const result = await timeEntriesService.getMy(
          toLocalDateString(dateRange!.from!),
          toLocalDateString(dateRange!.to!),
          1,
          10000
        )
        setAllEntries(result.entries)
      } catch (err) {
        console.error("Error fetching all time entries:", err)
      } finally {
        setLoadingDetailed(false)
      }
    }
    fetchAllEntries()
  }, [dateRange])

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
      .filter((c) => c.percentage >= 1)
      .sort((a, b) => b.totalHours - a.totalHours)
  })()

  const totalHoursAll = msToHours(allEntries.reduce((sum, e) => sum + e.hoursMilliseconds, 0))

  const handleDownloadWithColumns = async () => {
    if (!dateRange?.from || !dateRange?.to || !user?.userId) return
    setIsDownloading(true)
    try {
      const columnsParam = Object.entries(selectedColumns)
        .filter(([, enabled]) => enabled)
        .map(([key]) => {
          const keyMap: Record<string, string> = {
            company: 'agency',
            department: 'department',
            fullName: 'fullname',
            date: 'date',
            month: 'month',
            year: 'year',
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

      const response = await httpClient.get(
        `/api/reports/user/${user.userId}/export/flat`,
        {
          params: {
            fromDate: fromStr,
            toDate: toStr,
            columns: columnsParam,
          },
          responseType: 'blob',
        }
      )

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `MyReport_${fromStr}_${toStr}.xlsx`
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">{t("calendar.menu.myReports")}</h1>
        <Button onClick={() => setShowDownloadDialog(true)} className="gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          {t('admin.reports.exportAllToExcel')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.reports.filters.title")}</CardTitle>
          <CardDescription>{t("admin.reports.filters.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <label className="text-sm font-medium mb-2 block">{t("admin.reports.filters.period")}</label>
            <DatePickerWithRange date={dateRange} setDate={setDateRange} />
          </div>
        </CardContent>
      </Card>

      <StatsCards allEntries={allEntries} totalCount={totalCount} />

      <Tabs defaultValue="summary">
        <TabsList>
          <TabsTrigger value="summary">{t("admin.reports.summary.summaryTitle")}</TabsTrigger>
          <TabsTrigger value="detailed">{t("admin.reports.detailed.title")}</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.reports.summary.summaryTitle")}</CardTitle>
              <CardDescription>{t("admin.reports.summary.summaryDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <EntriesTable
                entries={entries}
                loading={loadingSummary}
                emptyText={t("admin.reports.summary.noReportsAvailable")}
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
              <CardTitle>{t("admin.reports.detailed.title")}</CardTitle>
              <CardDescription>{t("admin.reports.detailed.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingDetailed && (
                <div className="text-center py-2 text-sm text-muted-foreground">
                  {t("admin.reports.loadingReports")}
                </div>
              )}
              {clientSummary.length > 0 ? (
                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-3">
                    {t("admin.reports.detailed.timeDistribution")}
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
                    {t("admin.reports.summary.noReportsAvailable")}
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
              <h3 className="text-sm font-medium mb-2">{t('admin.reports.downloadDialog.tablePreview')}</h3>
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
                              {preview.entryDate ? new Date(preview.entryDate).toLocaleString('en-US', { month: 'long' }) : '—'}
                            </td>
                          )}
                          {selectedColumns.year && (
                            <td className="px-3 py-2 whitespace-nowrap">
                              {preview.entryDate ? new Date(preview.entryDate).getFullYear() : '—'}
                            </td>
                          )}
                          {selectedColumns.market && <td className="px-3 py-2 whitespace-nowrap">{preview.marketName || '—'}</td>}
                          {selectedColumns.contractingAgency && <td className="px-3 py-2 whitespace-nowrap">{preview.contractingAgencyName || '—'}</td>}
                          {selectedColumns.client && <td className="px-3 py-2 whitespace-nowrap">{preview.clientName || '—'}</td>}
                          {selectedColumns.projectBrand && <td className="px-3 py-2 whitespace-nowrap">{preview.projectBrandName || '—'}</td>}
                          {selectedColumns.media && <td className="px-3 py-2 whitespace-nowrap">{preview.mediaName || '—'}</td>}
                          {selectedColumns.jobType && <td className="px-3 py-2 whitespace-nowrap">{preview.jobTypeName || '—'}</td>}
                          {selectedColumns.hours && (
                            <td className="px-3 py-2 whitespace-nowrap">{msToHours(preview.hoursMilliseconds).toFixed(1)}</td>
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