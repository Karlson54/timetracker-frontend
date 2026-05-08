"use client"

import httpClient from '@/lib/api/httpClient'
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/date-range-picker"
import { FileSpreadsheet } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { DateRange } from "react-day-picker"
import type { DictionaryItem } from "@/lib/api/types"
import { clientsService } from "@/lib/api/services/dictionaryService"
import { toLocalDateString } from "@/lib/utils"
import { ErrorToast } from "@/components/ui/error-toast"
import { useErrorToast } from "@/hooks/use-error-toast"
import { msToHours } from '@/lib/utils'

interface UserContribution {
  userId: number
  userName: string
  agencyName: string
  totalHoursMs: number
  totalHours: string
  entriesCount: number
  contributionPercentage: number
}

interface ClientReport {
  clientId: number
  clientName: string
  clientEmail?: string
  clientPhone?: string
  fromDate: string
  toDate: string
  totalHoursMs: number
  totalHours: string
  totalEntries: number
  uniqueUsers: number
  uniqueProjects: number
  userContributions: UserContribution[]
}

export function ClientReports() {
  const { t } = useTranslation()
  const { error, showError, clearError } = useErrorToast()

  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const today = new Date()

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: firstDayOfMonth,
    to: today,
  })

  const [clients, setClients] = useState<DictionaryItem[]>([])
  const [loadingClients, setLoadingClients] = useState(true)
  const [selectedClientId, setSelectedClientId] = useState<string>("")

  const [report, setReport] = useState<ClientReport | null>(null)
  const [loadingReport, setLoadingReport] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  // Загрузка клиентов из справочника
  useEffect(() => {
    async function fetchClients() {
      try {
        const data = await clientsService.getAll()
        setClients(data)
      } catch (err) {
        showError(err, "Помилка завантаження клієнтів")
      } finally {
        setLoadingClients(false)
      }
    }
    fetchClients()
  }, [])

  // Загрузка отчёта при смене фильтров
  useEffect(() => {
    if (!selectedClientId || !dateRange?.from || !dateRange?.to) {
      setReport(null)
      return
    }

    async function fetchReport() {
      try {
        setLoadingReport(true)
        const res = await httpClient.get<ClientReport>(
          `/api/reports/client/${selectedClientId}`,
          {
            params: {
              fromDate: toLocalDateString(dateRange!.from!),
              toDate: toLocalDateString(dateRange!.to!),
            },
          }
        )
        setReport(res.data)
      } catch (err) {
        showError(err, "Помилка завантаження звіту")
        setReport(null)
      } finally {
        setLoadingReport(false)
      }
    }

    fetchReport()
  }, [selectedClientId, dateRange])

  const handleExport = async () => {
    if (!selectedClientId || !dateRange?.from || !dateRange?.to) return
    setIsDownloading(true)
    try {
      const fromStr = toLocalDateString(dateRange.from)
      const toStr = toLocalDateString(dateRange.to)
      const clientName = clients.find(c => String(c.id) === selectedClientId)?.name ?? `client_${selectedClientId}`

      const response = await httpClient.get(
        `/api/reports/client/${selectedClientId}/export/excel`,
        {
          params: { fromDate: fromStr, toDate: toStr, locale: 'uk' },
          responseType: 'blob',
        }
      )

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ClientReport_${clientName}_${fromStr}_${toStr}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      showError(err, "Помилка експорту")
    } finally {
      setIsDownloading(false)
    }
  }

  const totalHoursAll = report ? msToHours(report.totalHoursMs) : 0

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Звіти по клієнтах</h1>
        </div>
        <Button
          onClick={handleExport}
          disabled={!selectedClientId || !report || isDownloading}
          className="gap-2"
        >
          <FileSpreadsheet className="h-4 w-4" />
          {isDownloading ? "Завантаження..." : "Експорт в Excel"}
        </Button>
      </div>

      {/* Фільтри */}
      <Card>
        <CardHeader>
          <CardTitle>Фільтри</CardTitle>
          <CardDescription>Оберіть клієнта та період</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Клієнт</label>
              <Select
                value={selectedClientId}
                onValueChange={setSelectedClientId}
                disabled={loadingClients}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Оберіть клієнта" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="text-sm font-medium mb-2 block">Період</label>
              <DatePickerWithRange date={dateRange} setDate={setDateRange} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Якщо клієнт не обраний */}
      {!selectedClientId && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-lg font-medium text-gray-500 mb-2">Оберіть клієнта</p>
            <p className="text-sm text-gray-400">
              Виберіть клієнта у фільтрі вище щоб побачити звіт
            </p>
          </CardContent>
        </Card>
      )}

      {/* Завантаження */}
      {selectedClientId && loadingReport && (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <p className="text-gray-400">Завантаження звіту...</p>
          </CardContent>
        </Card>
      )}

      {/* Звіт */}
      {selectedClientId && !loadingReport && report && (
        <>
          {/* Карточки статистики */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Всього годин</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalHoursAll.toFixed(1)} год
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Кількість записів</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.totalEntries}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Співробітників</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.uniqueUsers}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Проєктів / брендів</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{report.uniqueProjects}</div>
              </CardContent>
            </Card>
          </div>

          {/* Графік вкладу співробітників */}
          {report.userContributions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Розподіл часу по співробітниках</CardTitle>
                <CardDescription>
                  Скільки годин кожен співробітник витратив на клієнта {report.clientName}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-6">
                  {report.userContributions.map((user) => (
                    <div key={user.userId}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{user.userName}</span>
                        <span className="text-gray-500">
                          {msToHours(user.totalHoursMs).toFixed(1)}г ({Math.round(user.contributionPercentage)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${user.contributionPercentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Таблиця */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Співробітник</TableHead>
                      <TableHead>Агентство</TableHead>
                      <TableHead className="text-right">Годин</TableHead>
                      <TableHead className="text-right">Записів</TableHead>
                      <TableHead className="text-right">%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.userContributions.map((user) => (
                      <TableRow key={user.userId}>
                        <TableCell className="font-medium">{user.userName}</TableCell>
                        <TableCell className="text-gray-500">{user.agencyName}</TableCell>
                        <TableCell className="text-right font-medium">
                          {msToHours(user.totalHoursMs).toFixed(1)}
                        </TableCell>
                        <TableCell className="text-right text-gray-500">
                          {user.entriesCount}
                        </TableCell>
                        <TableCell className="text-right text-gray-500">
                          {Math.round(user.contributionPercentage)}%
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="border-t-2">
                      <TableCell className="font-semibold" colSpan={2}>Всього</TableCell>
                      <TableCell className="text-right font-semibold">
                        {totalHoursAll.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {report.totalEntries}
                      </TableCell>
                      <TableCell className="text-right font-semibold">100%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Якщо немає записів */}
          {report.userContributions.length === 0 && (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-gray-400">
                  Немає записів для клієнта {report.clientName} за обраний період
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <ErrorToast message={error} onClose={clearError} />
    </div>
  )
}