"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { DatePickerWithRange } from "@/components/date-range-picker"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { DateRange } from "react-day-picker"
import { useTranslation } from "react-i18next"
import timeEntriesService from "@/lib/api/services/timeEntriesService"
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

export function EmployeeReports() {
  const { t } = useTranslation()

  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const today = new Date()

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: firstDayOfMonth,
    to: today,
  })

  // Данные для вкладки "Зведення" — с пагинацией
  const [entries, setEntries] = useState<TimeEntryListItem[]>([])
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Данные для вкладки "Детальний" — все записи за период
  const [allEntries, setAllEntries] = useState<TimeEntryListItem[]>([])
  const [loadingDetailed, setLoadingDetailed] = useState(false)

  // Сброс страницы при смене дат
  useEffect(() => {
    setCurrentPage(1)
  }, [dateRange])

  // Загрузка данных для "Зведення" (с пагинацией)
  useEffect(() => {
    if (!dateRange?.from || !dateRange?.to) return

    async function fetchSummaryEntries() {
      try {
        setLoadingSummary(true)
        const fromStr = toLocalDateString(dateRange!.from!)
        const toStr = toLocalDateString(dateRange!.to!)
        const result = await timeEntriesService.getMy(fromStr, toStr, currentPage, PAGE_SIZE)
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

  // Загрузка ВСЕХ данных для "Детальний" (без пагинации — большой pageSize)
  useEffect(() => {
    if (!dateRange?.from || !dateRange?.to) return

    async function fetchAllEntries() {
      try {
        setLoadingDetailed(true)
        const fromStr = toLocalDateString(dateRange!.from!)
        const toStr = toLocalDateString(dateRange!.to!)
        // Берём все записи за период (достаточно большой лимит)
        const result = await timeEntriesService.getMy(fromStr, toStr, 1, 10000)
        setAllEntries(result.entries)
      } catch (err) {
        console.error("Error fetching all time entries:", err)
      } finally {
        setLoadingDetailed(false)
      }
    }

    fetchAllEntries()
  }, [dateRange])

  // Breakdown по клиентам — считаем по ВСЕМ записям за период
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

  const totalMs = allEntries.reduce((sum, e) => sum + e.hoursMilliseconds, 0)
  const totalHoursAll = msToHours(totalMs)

  // Статистика в карточках тоже по всем записям
  const totalEntriesCount = totalCount // общий count с бэка
  const avgHoursPerEntry = allEntries.length > 0 ? totalHoursAll / allEntries.length : 0

  const SummaryPagination = () =>
    totalPages > 1 ? (
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-gray-500">
          {t("admin.reports.pagination.showing", {
            from: (currentPage - 1) * PAGE_SIZE + 1,
            to: Math.min(currentPage * PAGE_SIZE, totalCount),
            total: totalCount,
          })}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1 || loadingSummary}
          >
            ←
          </Button>
          <span className="text-sm">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || loadingSummary}
          >
            →
          </Button>
        </div>
      </div>
    ) : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("calendar.menu.myReports")}</h1>
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

      {/* Карточки статистики — по всем записям за период */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("admin.reports.summary.totalHoursTitle")}</CardTitle>
            <CardDescription>{t("admin.reports.summary.period")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalHoursAll.toFixed(1)} {t("calendar.totalPeriodHours")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("admin.reports.summary.reportsCountTitle")}</CardTitle>
            <CardDescription>{t("admin.reports.summary.period")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEntriesCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('calendar.AverageTime')}</CardTitle>
            <CardDescription>{t("admin.reports.summary.period")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">
                  {(() => {
                    const uniqueDays = new Set(
                      allEntries
                        .map(e => e.entryDate.split('T')[0])
                        .filter(dateStr => {
                          const day = new Date(dateStr).getDay() // 0=вс, 1=пн, ..., 6=сб
                          return day >= 1 && day <= 5
                        })
                    ).size
                    return uniqueDays > 0 ? (totalHoursAll / uniqueDays).toFixed(1) : "0"
                  })()}
                </span>
                <span className="text-sm text-muted-foreground">{t("calendar.totalPeriodHours")} / {t('calendar.PeriodAverageTimeDay')}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">
                  {avgHoursPerEntry > 0 ? avgHoursPerEntry.toFixed(1) : "0"}
                </span>
                <span className="text-sm text-muted-foreground">{t("calendar.totalPeriodHours")} / {t('calendar.PeriodAverageTimeRecord')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="summary">
        <TabsList>
          <TabsTrigger value="summary">{t("admin.reports.summary.summaryTitle")}</TabsTrigger>
          <TabsTrigger value="detailed">{t("admin.reports.detailed.title")}</TabsTrigger>
        </TabsList>

        {/* ===== ЗВЕДЕННЯ — с пагинацией ===== */}
        <TabsContent value="summary" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.reports.summary.summaryTitle")}</CardTitle>
              <CardDescription>{t("admin.reports.summary.summaryDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSummary && (
                <div className="text-center py-2 text-sm text-gray-400">
                  {t("admin.reports.loadingReports")}
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
                      <TableHead>Project / Brand</TableHead>
                      <TableHead>Media</TableHead>
                      <TableHead>Job Type</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Comments</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.length === 0 && !loadingSummary ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center">
                          {t("admin.reports.summary.noReportsAvailable")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      entries.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="whitespace-nowrap">{entry.userName || "—"}</TableCell>
                          <TableCell className="whitespace-nowrap">{entry.agencyName || "—"}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            {new Date(entry.entryDate).toLocaleDateString("uk-UA", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
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
              <SummaryPagination />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== ДЕТАЛЬНИЙ — без пагинации, все данные за период ===== */}
        <TabsContent value="detailed" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.reports.detailed.title")}</CardTitle>
              <CardDescription>{t("admin.reports.detailed.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingDetailed && (
                <div className="text-center py-2 text-sm text-gray-400">
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
                    {t("admin.reports.summary.noReportsAvailable")}
                  </p>
                )
              )}
              {/* Пагинации нет — намеренно */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}