"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { useTranslation } from "react-i18next"
import httpClient from "@/lib/api/httpClient"
import { toLocalDateString } from '@/lib/utils'

interface TopClient {
  clientId: number
  clientName: string
  totalHours: string
  percentage: number
}

interface InactiveUser {
  userId: number
  userName: string
  lastEntryDate: string | null
}

interface MissedDaysUser {
  userId: number
  userName: string
  missedDates: string[]
}

const MONTH_INDEXES = Array.from({ length: 12 }, (_, i) => i)

export function AdminDashboard() {
  const { t } = useTranslation()

  const [topClients, setTopClients] = useState<TopClient[]>([])
  const [inactiveUsers, setInactiveUsers] = useState<InactiveUser[]>([])
  const [missedDaysUsers, setMissedDaysUsers] = useState<MissedDaysUser[]>([])
  const [loadingClients, setLoadingClients] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [loadingMissedDays, setLoadingMissedDays] = useState(true)

  const today = new Date()
  const [selectedMonth, setSelectedMonth] = useState<Date>(
    new Date(today.getFullYear(), today.getMonth(), 1)
  )
  const [pickerYear, setPickerYear] = useState<number>(today.getFullYear())
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false)

  const getMonthShortLabel = (monthIndex: number) => {
    const full = t(`calendar.monthNames.${monthIndex}`)
    return full.slice(0, 3)
  }

  const monthLabel = useMemo(() => {
    const shortName = getMonthShortLabel(selectedMonth.getMonth())
    return `${shortName} ${selectedMonth.getFullYear()}`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, t])

  // Топ 5 клієнтів — залежить від обраного місяця
  useEffect(() => {
    const from = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1)
    const to = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0)

    setLoadingClients(true)
    httpClient
      .get('/api/reports/clients/top', {
        params: {
          fromDate: toLocalDateString(from),
          toDate: toLocalDateString(to),
          top: 5,
        },
      })
      .then((res) => setTopClients(res.data))
      .catch((err) => console.error('top clients error:', err))
      .finally(() => setLoadingClients(false))
  }, [selectedMonth])

  // Інші картки — незалежні від обраного місяця (як і раніше)
  useEffect(() => {
    httpClient
      .get('/api/reports/inactive-users')
      .then((res) => setInactiveUsers(res.data))
      .catch((err) => console.error('inactive users error:', err))
      .finally(() => setLoadingUsers(false))

    httpClient
      .get('/api/reports/missed-days-this-month')
      .then((res) => setMissedDaysUsers(res.data))
      .catch((err) => console.error('missed days error:', err))
      .finally(() => setLoadingMissedDays(false))
  }, [])

  const handleSelectMonth = (monthIndex: number) => {
    setSelectedMonth(new Date(pickerYear, monthIndex, 1))
    setIsMonthPickerOpen(false)
  }

  const handleOpenChange = (open: boolean) => {
    if (open) setPickerYear(selectedMonth.getFullYear())
    setIsMonthPickerOpen(open)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('admin.dashboard.title')}</h1>
        <p className="text-muted-foreground">{t('admin.dashboard.description')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Топ 5 клієнтів */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base">{t('admin.dashboard.topClients')}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">{monthLabel}</p>
            </div>

            <Popover open={isMonthPickerOpen} onOpenChange={handleOpenChange}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  title={t('admin.dashboard.selectMonth')}
                >
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64 p-3">
                <div className="flex items-center justify-between mb-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setPickerYear((y) => y - 1)}
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </Button>
                  <span className="text-sm font-medium text-foreground">{pickerYear}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setPickerYear((y) => y + 1)}
                  >
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {MONTH_INDEXES.map((m) => {
                    const isSelected =
                      selectedMonth.getFullYear() === pickerYear &&
                      selectedMonth.getMonth() === m

                    return (
                      <Button
                        key={m}
                        variant={isSelected ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleSelectMonth(m)}
                      >
                        {getMonthShortLabel(m)}
                      </Button>
                    )
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </CardHeader>
          <CardContent>
            {loadingClients ? (
              <p className="text-sm text-muted-foreground">{t('admin.dashboard.loading')}</p>
            ) : topClients.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('admin.dashboard.noClientsData')}</p>
            ) : (
              <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                {topClients.map((client) => (
                  <div key={client.clientId}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium truncate pr-2">{client.clientName}</span>
                      <span className="text-muted-foreground shrink-0">
                        {client.totalHours} ({client.percentage}%)
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
            )}
          </CardContent>
        </Card>

        {/* Працівники без записів цього тижня */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('admin.dashboard.inactiveUsers')}</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingUsers ? (
              <p className="text-sm text-muted-foreground">{t('admin.dashboard.loading')}</p>
            ) : inactiveUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('admin.dashboard.allUsersActive')}</p>
            ) : (
              <div className="max-h-80 overflow-y-auto pr-1">
                {inactiveUsers.map((user) => (
                  <div
                    key={user.userId}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0 h-12"
                  >
                    <span className="text-sm font-medium text-foreground truncate pr-2">{user.userName}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {user.lastEntryDate
                        ? `${t('admin.dashboard.lastEntry')}: ${new Date(user.lastEntryDate).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
                        : t('admin.dashboard.neverEntered')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Пропущені робочі дні цього місяця */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('admin.dashboard.missedDays')}</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingMissedDays ? (
              <p className="text-sm text-muted-foreground">{t('admin.dashboard.loading')}</p>
            ) : missedDaysUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('admin.dashboard.noMissedDaysData')}</p>
            ) : (
              <div className="max-h-80 overflow-y-auto pr-1">
                {missedDaysUsers.map((user) => (
                  <div
                    key={user.userId}
                    className="py-2 border-b border-border last:border-0 h-12 flex flex-col justify-center"
                  >
                    <span className="text-sm font-medium text-foreground truncate">{user.userName}</span>
                    <span className="text-xs text-muted-foreground truncate">
                      {user.missedDates
                        .map((d) => {
                          const date = new Date(d)
                          return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}`
                        })
                        .join('; ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}