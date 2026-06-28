'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  BarChart3, Clock, Users, FileText, Menu, X, Building,
  FileSpreadsheet, LogOut, Calendar, BookOpen, ChevronDown, ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn, formatEmployeeName } from '@/lib/utils'
import { useMobile } from '@/hooks/use-mobile'
import { useAuthContext } from '@/lib/AuthContext'
import { LanguageSwitcher } from '@/components/language-switcher'
import { useTranslation } from 'react-i18next'
import { getAgencyLogo } from '@/lib/utils/getAgencyLogo'
import { ThemeToggle } from '@/components/theme-toggle'
import { ShieldCheck } from 'lucide-react'

interface DashboardSidebarProps {
  isAdmin?: boolean
}

export function DashboardSidebar({ isAdmin = false }: DashboardSidebarProps) {
  const isMobile = useMobile()
  const [isOpen, setIsOpen] = useState(!isMobile)
  const pathname = usePathname()
  const { user, logout } = useAuthContext()
  const { t } = useTranslation()
  const [isDictionariesOpen, setIsDictionariesOpen] = useState(false)
  const isDictionaryActive = pathname.startsWith('/admin/dictionaries')
  const [isReportsOpen, setIsReportsOpen] = useState(false)
  const isReportsActive = pathname.startsWith('/admin/reports')

  useEffect(() => {
    if (isDictionaryActive) setIsDictionariesOpen(true)
    if (isReportsActive) setIsReportsOpen(true)
  }, [isDictionaryActive, isReportsActive])

  const formattedName = user?.name ? formatEmployeeName(user.name) : null

  return (
    <>
      {isMobile && (
        <Button variant="outline" size="icon" className="fixed top-4 left-4 z-50" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      )}
      <div className={cn(
        'bg-background border-r w-64 flex flex-col transition-all duration-300 z-40',
        isMobile && 'fixed h-full',
        isMobile && !isOpen && '-translate-x-full',
      )}>
        <div className="p-4 border-b">
          <div className="h-8">
            <img
              src={getAgencyLogo(user?.agencyId ?? 0)}
              alt={user?.agencyName ?? 'Agency'}
              className="h-full object-contain"
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {isAdmin ? t('admin.dashboard.title') : t('calendar.title')}
          </p>
          {user && (
            <p className="text-sm font-medium mt-1 text-foreground">
              {formattedName?.firstName} {formattedName?.lastName}
            </p>
          )}
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          {isAdmin ? (
            <ul className="space-y-1">
              <li>
                <Link href="/admin" className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                  pathname === '/admin'
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-foreground hover:bg-accent/50'
                )}>
                  <BarChart3 className="h-4 w-4" />{t('admin.nav.dashboard')}
                </Link>
              </li>
              {user?.roles?.includes('SuperAdmin') && (
                <li>
                  <Link href="/admin/employees" className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                    pathname === '/admin/employees'
                      ? 'bg-accent text-accent-foreground font-medium'
                      : 'text-foreground hover:bg-accent/50'
                  )}>
                    <Users className="h-4 w-4" />{t('admin.nav.employees')}
                  </Link>
                </li>
              )}
              {user?.roles?.includes('SuperAdmin') && (
                <li>
                  <Link href="/admin/permissions" className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                    pathname === '/admin/permissions'
                      ? 'bg-accent text-accent-foreground font-medium'
                      : 'text-foreground hover:bg-accent/50'
                  )}>
                    <Users className="h-4 w-4" />{t('admin.nav.manage_access')}
                  </Link>
                </li>
              )}
              {user?.roles?.includes('SuperAdmin') && (
                <li>
                  <Link href="/admin/dictionaries/clients" className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                    pathname === '/admin/companies'
                      ? 'bg-accent text-accent-foreground font-medium'
                      : 'text-foreground hover:bg-accent/50'
                  )}>
                    <Building className="h-4 w-4" />{t('admin.nav.companies')}
                  </Link>
                </li>
              )}
              <li>
                <button
                  onClick={() => setIsReportsOpen(!isReportsOpen)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                    isReportsActive
                      ? 'bg-accent text-accent-foreground font-medium'
                      : 'text-foreground hover:bg-accent/50'
                  )}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span className="flex-1 text-left">{t('admin.nav.reports')}</span>
                  {isReportsOpen
                    ? <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    : <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  }
                </button>

                {isReportsOpen && (
                  <ul className="mt-1 ml-4 space-y-1 border-l border-border pl-3">
                    <li>
                      <Link
                        href="/admin/reports/employees"
                        className={cn(
                          'flex items-center px-2 py-1.5 rounded-md text-sm transition-colors',
                          pathname === '/admin/reports/employees'
                            ? 'bg-accent text-accent-foreground font-medium'
                            : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                        )}
                      >
                        {t('admin.nav.reports_employees')}
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/admin/reports/clients"
                        className={cn(
                          'flex items-center px-2 py-1.5 rounded-md text-sm transition-colors',
                          pathname === '/admin/reports/clients'
                            ? 'bg-accent text-accent-foreground font-medium'
                            : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                        )}
                      >
                        {t('admin.nav.reports_clients')}
                      </Link>
                    </li>
                  </ul>
                )}
              </li>
              <li>
                <Link href="/dashboard" className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                  pathname === '/dashboard'
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-foreground hover:bg-accent/50'
                )}>
                  <Clock className="h-4 w-4" />{t('nav.calendar')}
                </Link>
              </li>

              {user?.roles?.includes('SuperAdmin') && (
                <li>
                  <button
                    onClick={() => setIsDictionariesOpen(!isDictionariesOpen)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                      isDictionaryActive
                        ? 'bg-accent text-accent-foreground font-medium'
                        : 'text-foreground hover:bg-accent/50'
                    )}
                  >
                    <BookOpen className="h-4 w-4" />
                    <span className="flex-1 text-left">{t('admin.nav.dictionaries')}</span>
                    {isDictionariesOpen
                      ? <ChevronDown className="h-3 w-3 text-muted-foreground" />
                      : <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    }
                  </button>

                  {isDictionariesOpen && (
                    <ul className="mt-1 ml-4 space-y-1 border-l border-border pl-3">
                      {[
                        { href: '/admin/dictionaries/agencies', label: t('admin.nav.dict.agencies') },
                        { href: '/admin/dictionaries/departments', label: t('admin.nav.dict.departments') },
                        { href: '/admin/dictionaries/markets', label: t('admin.nav.dict.markets') },
                        { href: '/admin/dictionaries/clients', label: t('admin.nav.dict.clients') },
                        { href: '/admin/dictionaries/media', label: t('admin.nav.dict.media') },
                        { href: '/admin/dictionaries/job-types', label: t('admin.nav.dict.jobTypes') },
                        { href: '/admin/dictionaries/contracting-agencies', label: t('admin.nav.dict.contractingAgencies') },
                      ].map(({ href, label }) => (
                        <li key={href}>
                          <Link
                            href={href}
                            className={cn(
                              'flex items-center px-2 py-1.5 rounded-md text-sm transition-colors',
                              pathname === href
                                ? 'bg-accent text-accent-foreground font-medium'
                                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                            )}
                          >
                            {label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )}
            </ul>
          ) : (
            <ul className="space-y-1">
              <li>
                <Link href="/dashboard" className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                  pathname === '/dashboard'
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-foreground hover:bg-accent/50'
                )}>
                  <Calendar className="h-4 w-4" />{t('nav.calendar')}
                </Link>
              </li>
              <li>
                <Link href="/reports" className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                  pathname === '/reports'
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-foreground hover:bg-accent/50'
                )}>
                  <FileText className="h-4 w-4" />{t('nav.reports')}
                </Link>
              </li>
            </ul>
          )}
        </nav>

        <div className="p-4 border-t space-y-2">
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
          <Button variant="ghost" className="w-full justify-start gap-3 text-sm text-foreground" onClick={logout}>
            <LogOut className="h-4 w-4" />{t('nav.logout')}
          </Button>
        </div>
      </div>
    </>
  )
}