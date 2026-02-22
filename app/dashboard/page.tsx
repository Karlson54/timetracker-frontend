'use client'

import { WeeklyCalendar } from '@/components/weekly-calendar'
import { SimpleSidebar } from '@/components/simple-sidebar'
import { useAuthProtection } from '@/lib/auth'

export default function DashboardPage() {
  const isAuthenticated = useAuthProtection()

  if (!isAuthenticated) return null

  return (
    <div className="flex h-screen bg-gray-50">
      <SimpleSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <WeeklyCalendar />
        </main>
      </div>
    </div>
  )
}