'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorToast } from '@/components/ui/error-toast'
import { useErrorToast } from '@/hooks/use-error-toast'
import { useAuthContext } from '@/lib/AuthContext'
import profileService from '@/lib/api/services/profileService'

export function ProfilePage() {
  const { t } = useTranslation()
  const { user, isAdmin } = useAuthContext()
  const { error, showError, clearError } = useErrorToast()

  const [loading, setLoading] = useState(true)
  const [profileSubmitting, setProfileSubmitting] = useState(false)
  const [passwordSubmitting, setPasswordSubmitting] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    login: '',
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordError, setPasswordError] = useState('')

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true)
        const data = await profileService.getMe()
        setProfileForm({
          name: data.name ?? '',
          email: data.email ?? '',
          login: data.login ?? '',
        })
      } catch (err) {
        showError(err, t('common.errors.loadFailed'))
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setProfileSubmitting(true)
      setProfileSuccess(false)
      await profileService.updateProfile({
        name: profileForm.name,
        email: profileForm.email,
        login: profileForm.login || undefined,
      })
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
    } catch (err) {
      showError(err, t('common.errors.saveFailed'))
    } finally {
      setProfileSubmitting(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError(t('admin.employees.errors.passwordMismatch'))
      return
    }

    if (!user?.userId) return

    try {
      setPasswordSubmitting(true)
      setPasswordSuccess(false)
      await profileService.changePassword(user.userId, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      })
      setPasswordSuccess(true)
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => setPasswordSuccess(false), 3000)
    } catch (err) {
      showError(err, t('common.errors.saveFailed'))
    } finally {
      setPasswordSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('profile.title')}</h1>
        <p className="text-muted-foreground">{t('profile.description')}</p>
      </div>

      {/* Форма профілю */}
      <Card>
        <CardHeader>
          <CardTitle>{t('profile.personalData.title')}</CardTitle>
          <CardDescription>{t('profile.personalData.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('profile.personalData.fullName')}</Label>
              <Input
                id="name"
                value={profileForm.name}
                onChange={(e) => isAdmin && setProfileForm({ ...profileForm, name: e.target.value })}
                readOnly={!isAdmin}
                disabled={!isAdmin}
                className={!isAdmin ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-60' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('profile.personalData.email')}</Label>
              <Input
                id="email"
                type="email"
                value={profileForm.email}
                onChange={(e) => isAdmin && setProfileForm({ ...profileForm, email: e.target.value })}
                readOnly={!isAdmin}
                disabled={!isAdmin}
                className={!isAdmin ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-60' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login">{t('profile.personalData.login')}</Label>
              <Input
                id="login"
                value={profileForm.login}
                onChange={(e) => setProfileForm({ ...profileForm, login: e.target.value })}
              />
            </div>
            {/* Показываем кнопку сохранения только если хоть что-то доступно для редактирования */}
            {/* Для обычного юзера — только логин редактируемый */}
            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={profileSubmitting}>
                {profileSubmitting ? t('common.saving') : t('common.save')}
              </Button>
              {profileSuccess && (
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  {t('profile.personalData.savedSuccess')}
                </p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Форма зміни пароля */}
      <Card>
        <CardHeader>
          <CardTitle>{t('profile.changePassword.title')}</CardTitle>
          <CardDescription>{t('profile.changePassword.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">{t('profile.changePassword.currentPassword')}</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => {
                  setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                  setPasswordError('')
                }}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">{t('profile.changePassword.newPassword')}</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => {
                  setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                  setPasswordError('')
                }}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('profile.changePassword.confirmPassword')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => {
                  setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                  setPasswordError('')
                }}
                required
              />
              {passwordError && (
                <p className="text-sm text-destructive">{passwordError}</p>
              )}
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={passwordSubmitting}>
                {passwordSubmitting ? t('common.saving') : t('profile.changePassword.submit')}
              </Button>
              {passwordSuccess && (
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  {t('profile.changePassword.savedSuccess')}
                </p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <ErrorToast message={error} onClose={clearError} />
    </div>
  )
}