'use client'

export const dynamic = 'force-dynamic'

import { EmployeesList } from '@/components/admin/employees-list'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { useSuperAdminProtection } from '@/lib/auth'

export default function EmployeesPage() {
  const isSuperAdmin = useSuperAdminProtection()

  if (!isSuperAdmin) return null

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar isAdmin={true} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <EmployeesList />
        </main>
      </div>
    </div>
  )
}