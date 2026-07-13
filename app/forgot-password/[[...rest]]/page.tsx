'use client'

export const dynamic = 'force-dynamic'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'

export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="flex min-h-screen bg-background flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-12 w-auto">
            <img
              src={resolvedTheme === 'dark' ? '/images/logos/dark/groupm.png' : '/images/logos/light/groupm.png'}
              alt="GroupM"
              className="h-full"
            />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-foreground">
          {t('forgotPassword.title')}
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {t('forgotPassword.description')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-border">
          <form className="space-y-6" action="#" method="POST">
            <div>
              <Label htmlFor="email">{t('forgotPassword.email')}</Label>
              <div className="mt-1">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="your.email@example.com"
                />
              </div>
            </div>
            <div>
              <Button type="submit" className="w-full">
                {t('forgotPassword.submit')}
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-card px-2 text-muted-foreground">
                  {t('forgotPassword.or')}
                </span>
              </div>
            </div>
            <div className="mt-6 text-center">
              <Link href="/login" className="font-medium text-primary hover:text-primary/80">
                {t('forgotPassword.backToLogin')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}