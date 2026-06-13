'use client'
export const dynamic = 'force-dynamic'

import { DepartmentsPage } from '@/components/admin/dictionaries/DepartmentsPage'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { useAdminProtection } from '@/lib/auth'

export default function DepartmentsPageRoute() {
  const isAdmin = useAdminProtection()
  if (!isAdmin) return null

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar isAdmin={true} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <DepartmentsPage />
        </main>
      </div>
    </div>
  )
}