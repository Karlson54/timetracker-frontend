"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { DatePickerWithRange } from "@/components/date-range-picker"
import { Download, FileSpreadsheet } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { DateRange } from "react-day-picker"
import { ReportExportModal } from "@/components/report-export-modal"
import { useTranslation } from "react-i18next"
import timeEntriesService from "@/lib/api/services/timeEntriesService"
import type { TimeEntryListItem } from "@/lib/api/types"

// Хелпер: миллисекунды → часы с 1 знаком
function msToHours(ms: number): number {
  return Math.round((ms / 3600000) * 10) / 10
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
  const [loading, setLoading] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportData, setExportData] = useState<any[]>([])

  // Загрузка данных при изменении периода
  useEffect(() => {
    if (!dateRange?.from || !dateRange?.to) return

    async function fetchEntries() {
      try {
        setLoading(true)
        const fromStr = dateRange!.from!.toISOString().split("T")[0]
        const toStr = dateRange!.to!.toISOString().split("T")[0]
        const data = await timeEntriesService.getMy(fromStr, toStr)
        setEntries(data)
      } catch (err) {
        console.error("Error fetching time entries:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchEntries()
  }, [dateRange])

  // Подготовка данных для экспорта
  const prepareExportData = (entriesToExport: TimeEntryListItem[]) => {
    return entriesToExport.map((entry) => ({
      date: new Date(entry.entryDate).toLocaleDateString("uk-UA", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      market: entry.marketName || "-",
      agency: "-", // агентство берётся из профиля пользователя, не из entry
      fullName: entry.userName || "-",
      company: entry.contractingAgencyName || "-",
      client: entry.clientName || "-",
      project: entry.projectBrandName || "-",
      projectBrand: entry.projectBrandName || "-",
      media: entry.mediaName || "-",
      jobType: entry.jobTypeName || "-",
      comments: entry.comments || "-",
      hours: msToHours(entry.hoursMilliseconds),
    }))
  }

  const downloadAllReports = () => {
    if (entries.length === 0) {
      alert(t("admin.reports.downloadDialog.noReportsToExport"))
      return
    }
    const data = prepareExportData(entries)
    setExportData(data)
    setShowExportModal(true)
  }

  const downloadSingleEntry = (entry: TimeEntryListItem) => {
    const data = prepareExportData([entry])
    setExportData(data)
    setShowExportModal(true)
  }

  const totalHours = entries.reduce((sum, e) => sum + msToHours(e.hoursMilliseconds), 0)

  if (loading) {
    return <div>{t("admin.reports.loadingReports")}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("calendar.menu.myReports")}</h1>
          <p className="text-gray-500">{t("admin.reports.description")}</p>
        </div>
        <Button onClick={downloadAllReports} className="gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          <span>{t("admin.reports.exportAllToExcel")}</span>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.reports.filters.title")}</CardTitle>
          <CardDescription>{t("admin.reports.filters.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-1 md:col-span-2">
              <label className="text-sm font-medium mb-2 block">{t("admin.reports.filters.period")}</label>
              <DatePickerWithRange date={dateRange} setDate={setDateRange} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("admin.reports.summary.totalHoursTitle")}</CardTitle>
            <CardDescription>{t("admin.reports.summary.period")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalHours.toFixed(1)} {t("calendar.totalPeriodHours")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("admin.reports.summary.reportsCountTitle")}</CardTitle>
            <CardDescription>{t("admin.reports.summary.period")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{entries.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("admin.reports.summary.avgTimePerDay")}</CardTitle>
            <CardDescription>{t("admin.reports.summary.period")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {entries.length
                ? (totalHours / entries.length).toFixed(1)
                : "0"}{" "}
              {t("calendar.totalPeriodHours")}
            </div>
          </CardContent>
        </Card>
      </div>

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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.reports.tableHeaders.date")}</TableHead>
                    <TableHead>{t("admin.reports.tableHeaders.client")}</TableHead>
                    <TableHead>{t("admin.reports.tableHeaders.projectBrand")}</TableHead>
                    <TableHead>{t("admin.reports.tableHeaders.jobType")}</TableHead>
                    <TableHead>{t("admin.reports.tableHeaders.hours")}</TableHead>
                    <TableHead>{t("admin.reports.tableHeaders.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        {t("admin.reports.summary.noReportsAvailable")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          {new Date(entry.entryDate).toLocaleDateString("uk-UA", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell>{entry.clientName || "—"}</TableCell>
                        <TableCell>{entry.projectBrandName || "—"}</TableCell>
                        <TableCell>{entry.jobTypeName || "—"}</TableCell>
                        <TableCell>{msToHours(entry.hoursMilliseconds).toFixed(1)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => downloadSingleEntry(entry)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.reports.tableHeaders.date")}</TableHead>
                    <TableHead>{t("admin.reports.tableHeaders.market")}</TableHead>
                    <TableHead>{t("admin.reports.tableHeaders.contractingAgency")}</TableHead>
                    <TableHead>{t("admin.reports.tableHeaders.client")}</TableHead>
                    <TableHead>{t("admin.reports.tableHeaders.projectBrand")}</TableHead>
                    <TableHead>{t("admin.reports.tableHeaders.media")}</TableHead>
                    <TableHead>{t("admin.reports.tableHeaders.jobType")}</TableHead>
                    <TableHead>{t("admin.reports.tableHeaders.hours")}</TableHead>
                    <TableHead>{t("admin.reports.tableHeaders.comments")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center">
                        {t("admin.reports.summary.noReportsAvailable")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
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
                        <TableCell>{msToHours(entry.hoursMilliseconds).toFixed(1)}</TableCell>
                        <TableCell className="max-w-[200px] truncate" title={entry.comments || ""}>
                          {entry.comments || "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <div className="flex justify-end mt-4">
                <Button onClick={downloadAllReports} className="gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  {t("admin.reports.detailed.exportToExcel")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ReportExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        reportData={exportData}
      />
    </div>
  )
}