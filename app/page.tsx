'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/lib/AuthContext'
import { useTranslation } from 'react-i18next'

export default function Home() {
  const { isAuthenticated, isLoading, isAdmin } = useAuthContext()
  const router = useRouter()
  const { t } = useTranslation()

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
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-muted-foreground">{t('loading')}</p>
    </div>
  )
}