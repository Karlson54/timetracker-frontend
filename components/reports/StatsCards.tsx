'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTranslation } from 'react-i18next'
import type { TimeEntryListItem } from '@/lib/api/types'
import { msToHours } from '@/lib/utils'
import type { DateRange } from 'react-day-picker'

interface StatsCardsProps {
  allEntries: TimeEntryListItem[]
  totalCount: number
  dateRange?: DateRange
  showNorm?: boolean
}

function calculateNormHours(dateRange?: DateRange): number {
  if (!dateRange?.from || !dateRange?.to) return 0

  let workDays = 0
  const current = new Date(dateRange.from)
  current.setHours(0, 0, 0, 0)
  const end = new Date(dateRange.to)
  end.setHours(0, 0, 0, 0)

  while (current <= end) {
    const day = current.getDay()
    if (day !== 0 && day !== 6) workDays++
    current.setDate(current.getDate() + 1)
  }

  return workDays * 8
}

export function StatsCards({ allEntries, totalCount, dateRange, showNorm }: StatsCardsProps) {
  const { t } = useTranslation()

  const totalMs = allEntries.reduce((sum, e) => sum + e.hoursMilliseconds, 0)
  const totalHours = msToHours(totalMs)
  const avgHoursPerEntry = allEntries.length > 0 ? totalHours / allEntries.length : 0
  const normHours = showNorm ? calculateNormHours(dateRange) : 0

  const avgHoursPerDay = (() => {
    const uniqueDays = new Set(
      allEntries
        .map(e => e.entryDate.split('T')[0])
        .filter(dateStr => {
          const day = new Date(dateStr).getDay()
          return day >= 1 && day <= 5
        })
    ).size
    return uniqueDays > 0 ? (totalHours / uniqueDays).toFixed(1) : "0"
  })()

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('admin.reports.summary.totalHoursTitle')}</CardTitle>
          <CardDescription>{t('admin.reports.summary.period')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {normHours > 0
              ? `${totalHours.toFixed(1)} / ${normHours.toFixed(1)} ${t('calendar.totalPeriodHours')}`
              : `${totalHours.toFixed(1)} ${t('calendar.totalPeriodHours')}`}
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
          <CardTitle className="text-base">{t('calendar.AverageTime')}</CardTitle>
          <CardDescription>{t('admin.reports.summary.period')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{avgHoursPerDay}</span>
              <span className="text-sm text-muted-foreground">
                {t('calendar.PeriodAverageTimeHours')} / {t('calendar.PeriodAverageTimeDay')}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                {avgHoursPerEntry > 0 ? avgHoursPerEntry.toFixed(1) : "0"}
              </span>
              <span className="text-sm text-muted-foreground">
                {t('calendar.PeriodAverageTimeHours')} / {t('calendar.PeriodAverageTimeRecord')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}