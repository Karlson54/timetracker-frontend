'use client'

export const dynamic = 'force-dynamic'

import { ProfilePage } from '@/components/profile-page'
import { SimpleSidebar } from '@/components/simple-sidebar'
import { useAuthProtection } from '@/lib/auth'

export default function Profile() {
  const isAuthenticated = useAuthProtection()
  if (!isAuthenticated) return null

  return (
    <div className="flex h-screen bg-background">
      <SimpleSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <ProfilePage />
        </main>
      </div>
    </div>
  )
}