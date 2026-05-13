'use client'
export const dynamic = 'force-dynamic'

import { DictionaryPage } from '@/components/admin/dictionaries/DictionaryPage'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { useAdminProtection } from '@/lib/auth'
import { clientsService } from '@/lib/api/services/dictionaryService'
import { useTranslation } from 'react-i18next'

export default function ClientsPage() {
  const isAdmin = useAdminProtection()
  const { t } = useTranslation()
  if (!isAdmin) return null

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar isAdmin={true} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <DictionaryPage
            title={t('dictionaries.clients.title')}
            description={t('dictionaries.clients.description')}
            service={clientsService}
          />
        </main>
      </div>
    </div>
  )
}