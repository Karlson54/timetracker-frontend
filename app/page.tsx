'use client'

export const dynamic = 'force-dynamic'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { hasToken, getUser } from '@/lib/api/tokenStorage'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const token = hasToken()
    const user = getUser()
    
    if (!token || !user) {
      router.replace('/login')
      return
    }
    
    if (user.roles?.includes('Admin')) {
      router.replace('/admin')
    } else {
      router.replace('/dashboard')
    }
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-muted-foreground">Завантаження...</p>
    </div>
  )
}