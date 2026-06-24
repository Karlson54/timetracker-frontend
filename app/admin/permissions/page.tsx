'use client'
export const dynamic = 'force-dynamic'

import { AdminPermissionsManager } from '@/components/admin/AdminPermissionsManager'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { useSuperAdminProtection } from '@/lib/auth'

export default function AdminPermissionsPage() {
  const isSuperAdmin = useSuperAdminProtection()
  if (!isSuperAdmin) return null

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar isAdmin={true} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <AdminPermissionsManager />
        </main>
      </div>
    </div>
  )
}