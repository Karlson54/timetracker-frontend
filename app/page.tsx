'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/lib/AuthContext'

export default function Home() {
  const { isAuthenticated, isLoading, isAdmin } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      router.replace('/login')
      return
    }
    if (isAdmin) {
      router.replace('/admin')
    } else {
      router.replace('/dashboard')
    }
  }, [isLoading, isAuthenticated, isAdmin, router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-gray-500">Завантаження...</p>
    </div>
  )
}