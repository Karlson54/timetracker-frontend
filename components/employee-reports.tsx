"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DatePickerWithRange } from "@/components/date-range-picker"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { DateRange } from "react-day-picker"
import { useTranslation } from "react-i18next"
import timeEntriesService from "@/lib/api/services/timeEntriesService"
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

export function EmployeeReports() {
  const { t } = useTranslation()

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
      .sort((a, b) => b.totalHours - a.totalHours)
  })()

  const totalHoursAll = msToHours(allEntries.reduce((sum, e) => sum + e.hoursMilliseconds, 0))

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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}