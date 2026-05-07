'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTranslation } from 'react-i18next'
import type { TimeEntryListItem } from '@/lib/api/types'

function msToHours(ms: number): number {
  return Math.round((ms / 3600000) * 10) / 10
}

interface StatsCardsProps {
  allEntries: TimeEntryListItem[]
  totalCount: number
}

export function StatsCards({ allEntries, totalCount }: StatsCardsProps) {
  const { t } = useTranslation()

  const totalMs = allEntries.reduce((sum, e) => sum + e.hoursMilliseconds, 0)
  const totalHours = msToHours(totalMs)
  const avgHoursPerEntry = allEntries.length > 0 ? totalHours / allEntries.length : 0

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
            {totalHours.toFixed(1)} {t('calendar.totalPeriodHours')}
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