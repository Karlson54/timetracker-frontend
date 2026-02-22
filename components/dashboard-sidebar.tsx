'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { BarChart3, Clock, Users, FileText, Menu, X, Building, FileSpreadsheet, LogOut, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn, formatEmployeeName } from '@/lib/utils'
import { useMobile } from '@/hooks/use-mobile'
import { useAuthContext } from '@/lib/AuthContext'
import { LanguageSwitcher } from '@/components/language-switcher'
import { useTranslation } from 'react-i18next'

interface DashboardSidebarProps {
  isAdmin?: boolean
}

export function DashboardSidebar({ isAdmin = false }: DashboardSidebarProps) {
  const isMobile = useMobile()
  const [isOpen, setIsOpen] = useState(!isMobile)
  const pathname = usePathname()
  const { user, logout } = useAuthContext()
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
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%D0%91%D0%B5%D0%B7%20%D0%B7%D0%B0%D0%B3%D0%BE%D0%BB%D0%BE%D0%B2%D0%BA%D0%B0-fUH90pbu2g9blr3Tk2CoJfZWlS4CiP.png"
              alt="Mediacom"
              className="h-full"
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {isAdmin ? t('admin.dashboard.title') : t('calendar.title')}
          </p>
          {user && (
            <p className="text-sm font-medium mt-1">
              {formattedName?.firstName} {formattedName?.lastName}
            </p>
          )}
        </div>
        <nav className="flex-1 p-4">
          {isAdmin ? (
            <ul className="space-y-1">
              <li>
                <Link href="/admin" className={cn('flex items-center gap-3 px-3 py-2 rounded-md text-sm', pathname === '/admin' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50')}>
                  <BarChart3 className="h-4 w-4" />{t('admin.nav.dashboard')}
                </Link>
              </li>
              <li>
                <Link href="/admin/employees" className={cn('flex items-center gap-3 px-3 py-2 rounded-md text-sm', pathname === '/admin/employees' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50')}>
                  <Users className="h-4 w-4" />{t('admin.nav.employees')}
                </Link>
              </li>
              <li>
                <Link href="/admin/companies" className={cn('flex items-center gap-3 px-3 py-2 rounded-md text-sm', pathname === '/admin/companies' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50')}>
                  <Building className="h-4 w-4" />{t('admin.nav.companies')}
                </Link>
              </li>
              <li>
                <Link href="/admin/reports" className={cn('flex items-center gap-3 px-3 py-2 rounded-md text-sm', pathname === '/admin/reports' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50')}>
                  <FileSpreadsheet className="h-4 w-4" />{t('admin.nav.reports')}
                </Link>
              </li>
            </ul>
          ) : (
            <ul className="space-y-1">
              <li>
                <Link href="/dashboard" className={cn('flex items-center gap-3 px-3 py-2 rounded-md text-sm', pathname === '/dashboard' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50')}>
                  <Calendar className="h-4 w-4" />{t('nav.calendar')}
                </Link>
              </li>
              <li>
                <Link href="/reports" className={cn('flex items-center gap-3 px-3 py-2 rounded-md text-sm', pathname === '/reports' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50')}>
                  <FileText className="h-4 w-4" />{t('nav.reports')}
                </Link>
              </li>
            </ul>
          )}
        </nav>
        <div className="p-4 border-t space-y-2">
          <LanguageSwitcher />
          <Button variant="ghost" className="w-full justify-start gap-3 text-sm" onClick={logout}>
            <LogOut className="h-4 w-4" />{t('nav.logout')}
          </Button>
        </div>
      </div>
    </>
  )
}