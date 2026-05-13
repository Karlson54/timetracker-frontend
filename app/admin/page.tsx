"use client"

import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { useAdminProtection } from "@/lib/auth"

export default function AdminPage() {
  const isAdmin = useAdminProtection()

  if (!isAdmin) return null

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar isAdmin={true} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <AdminDashboard />
        </main>
      </div>
    </div>
  )
}