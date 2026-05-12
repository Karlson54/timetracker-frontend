'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Menu, X, FileText, LogOut, BarChart3, Users, Building, FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn, formatEmployeeName } from '@/lib/utils'
import { useMobile } from '@/hooks/use-mobile'
import { useAuthContext } from '@/lib/AuthContext'
import { LanguageSwitcher } from './language-switcher'
import { useTranslation } from 'react-i18next'
import { getAgencyLogo } from '@/lib/utils/getAgencyLogo'
import { ThemeToggle } from './theme-toggle'

export function SimpleSidebar() {
  const isMobile = useMobile()
  const [isOpen, setIsOpen] = useState(!isMobile)
  const pathname = usePathname()
  const { user, logout, isAdmin } = useAuthContext()
  const { t } = useTranslation()

  const formattedName = user?.name ? formatEmployeeName(user.name) : null

  return (
    <>
      {isMobile && (
        <Button variant="outline" size="icon" className="fixed top-4 left-4 z-50" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      )}
      <div className={cn(
        'bg-white border-r w-64 flex flex-col transition-all duration-300 z-40',
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
          {user && (
            <>
              <p className="text-sm font-medium mt-2">
                {formattedName?.firstName} {formattedName?.lastName}
              </p>
              <p className="text-xs text-gray-500">
                {isAdmin ? t('roles.admin') : t('roles.user')}
              </p>
            </>
          )}
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            <li>
              <Link href="/dashboard" className={cn('flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-gray-50', pathname === '/dashboard' ? 'bg-gray-100 font-medium' : 'text-gray-500')}>
                <Calendar className="h-4 w-4" />{t('nav.calendar')}
              </Link>
            </li>
            <li>
              <Link href="/reports" className={cn('flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-gray-50', pathname === '/reports' ? 'bg-gray-100 font-medium' : 'text-gray-500')}>
                <FileText className="h-4 w-4" />{t('nav.reports')}
              </Link>
            </li>
            {isAdmin && (
              <li>
                <Link href="/admin" className={cn('flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-gray-50', pathname.startsWith('/admin') ? 'bg-gray-100 font-medium' : 'text-gray-500')}>
                  <BarChart3 className="h-4 w-4" />{t('nav.admin')}
                </Link>
              </li>
            )}
          </ul>
        </nav>
        <div className="p-4 border-t space-y-2">
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
          <Button variant="ghost" className="w-full justify-start gap-3 text-sm" onClick={logout}>
            <LogOut className="h-4 w-4" />{t('nav.logout')}
          </Button>
        </div>
      </div>
    </>
  )
}