'use client'

export const dynamic = 'force-dynamic'

import { LoginForm } from '@/components/login-form'
import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'

export default function LoginPage() {
  const { t } = useTranslation()
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 p-8 bg-card rounded-lg shadow border border-border">
        <div className="flex flex-col items-center">
          <img
            src={resolvedTheme === 'dark' ? '/images/logos/dark/groupm.png' : '/images/logos/light/groupm.png'}
            alt="GroupM"
            className="h-12 object-contain mb-4"
          />
          <h2 className="text-center text-3xl font-bold text-foreground">
            {t('login.title')}
          </h2>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}