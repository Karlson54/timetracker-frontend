'use client'

export const dynamic = 'force-dynamic'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { clearAuth } from '@/lib/api/tokenStorage'

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    clearAuth()
    router.replace('/login')
  }, [router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <p className="text-muted-foreground">Вихід із системи...</p>
    </div>
  )
}