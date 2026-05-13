"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

export function AdminDashboard() {
  const { t } = useTranslation()
  const [topClients, setTopClients] = useState<TopClient[]>([])
  const [inactiveUsers, setInactiveUsers] = useState<InactiveUser[]>([])
  const [loadingClients, setLoadingClients] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(true)

  useEffect(() => {
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const today = new Date()

    httpClient
      .get('/api/reports/clients/top', {
        params: {
          fromDate: toLocalDateString(firstDayOfMonth),
          toDate: toLocalDateString(today),
          top: 5,
        },
      })
      .then((res) => setTopClients(res.data))
      .catch((err) => console.error('top clients error:', err))
      .finally(() => setLoadingClients(false))

    httpClient
      .get('/api/reports/inactive-users')
      .then((res) => setInactiveUsers(res.data))
      .catch((err) => console.error('inactive users error:', err))
      .finally(() => setLoadingUsers(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('admin.dashboard.title')}</h1>
        <p className="text-muted-foreground">{t('admin.dashboard.description')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Топ 5 клієнтів */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('admin.dashboard.topClients')}</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingClients ? (
              <p className="text-sm text-muted-foreground">{t('admin.dashboard.loading')}</p>
            ) : topClients.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('admin.dashboard.noClientsData')}</p>
            ) : (
              <div className="space-y-4">
                {topClients.map((client) => (
                  <div key={client.clientId}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{client.clientName}</span>
                      <span className="text-muted-foreground">
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
              <div className="space-y-2">
                {inactiveUsers.map((user) => (
                  <div key={user.userId} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="text-sm font-medium text-foreground">{user.userName}</span>
                    <span className="text-xs text-muted-foreground">
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
      </div>
    </div>
  )
}