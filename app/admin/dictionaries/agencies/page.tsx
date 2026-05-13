'use client'
export const dynamic = 'force-dynamic'

import { DictionaryPage } from '@/components/admin/dictionaries/DictionaryPage'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { useAdminProtection } from '@/lib/auth'
import { agenciesService } from '@/lib/api/services/dictionaryService'
import { useTranslation } from 'react-i18next'

export default function AgenciesPage() {
  const isAdmin = useAdminProtection()
  const { t } = useTranslation()
  if (!isAdmin) return null

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar isAdmin={true} />
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <DictionaryPage
          title={t('dictionaries.agencies.title')}
          description={t('dictionaries.agencies.description')}
          service={agenciesService}
        />
      </main>
    </div>
  )
}