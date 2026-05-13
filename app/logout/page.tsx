'use client'

export const dynamic = 'force-dynamic'

import { useEffect } from 'react'
import { useAuthContext } from '@/lib/AuthContext'
import { useTranslation } from 'react-i18next'

export default function LogoutPage() {
  const { logout } = useAuthContext()
  const { t } = useTranslation()

  useEffect(() => {
    logout()
  }, [logout])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <h1 className="text-2xl font-bold mb-4 text-foreground">{t('logout.title')}</h1>
      <p className="text-muted-foreground">{t('logout.description')}</p>
    </div>
  )
}