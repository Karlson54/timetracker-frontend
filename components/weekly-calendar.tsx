"use client"

import { useAuthContext } from '@/lib/AuthContext'
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronLeft, ChevronRight, Pencil, Trash, Plus, Copy, Calendar as CalendarIcon } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { DayEntryForm } from "@/components/day-entry-form"
import { useTranslation } from "react-i18next"
import timeEntriesService from "@/lib/api/services/timeEntriesService"
import type { TimeEntryListItem, CreateTimeEntryRequest } from "@/lib/api/types"
import { ErrorToast } from '@/components/ui/error-toast'
import { useErrorToast } from '@/hooks/use-error-toast'
import { parseApiError, toLocalDateString, msToHours } from '@/lib/utils'

export function WeeklyCalendar() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === "uk" ? "uk-UA" : "en-US"

  const [showWeekPicker, setShowWeekPicker] = useState(false)
  const [pickerMonth, setPickerMonth] = useState(new Date())

  // --- Стан ---
  const [entries, setEntries] = useState<TimeEntryListItem[]>([])
  const [loading, setLoading] = useState(true)
  const { error, showError, clearError } = useErrorToast()
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date()
    const day = today.getDay()
    const diff = today.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(today.setDate(diff))
  })
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [showEntryForm, setShowEntryForm] = useState(false)
  const [editingEntry, setEditingEntry] = useState<TimeEntryListItem | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Стан для копіювання
  const [copyDate, setCopyDate] = useState<Date | null>(null)
  const [showCopyDialog, setShowCopyDialog] = useState(false)
  const [copyMonth, setCopyMonth] = useState(new Date())

  // --- Тиждень ---
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentWeekStart)
    d.setDate(currentWeekStart.getDate() + i)
    return d
  })

  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)

  // --- Вибір тижня з календаря ---
  const handlePickWeek = (date: Date) => {
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(date)
    monday.setDate(diff)
    setCurrentWeekStart(monday)
    setSelectedDate(null)
    setShowEntryForm(false)
    setShowWeekPicker(false)
    setSelectedIds([])
  }

  // --- Календар для вибору тижня ---
  const pickerDays = (() => {
    const y = pickerMonth.getFullYear()
    const m = pickerMonth.getMonth()
    const daysInMonth = new Date(y, m + 1, 0).getDate()
    const firstDay = (() => {
      const d = new Date(y, m, 1).getDay()
      return d === 0 ? 6 : d - 1
    })()
    const total = Math.ceil((firstDay + daysInMonth) / 7) * 7
    return Array.from({ length: total }, (_, i) => {
      const dayNum = i - firstDay + 1
      if (dayNum < 1 || dayNum > daysInMonth) return null
      return new Date(y, m, dayNum)
    })
  })()

  const isInCurrentWeek = (date: Date | null) => {
    if (!date) return false
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(date)
    monday.setDate(diff)
    return monday.toDateString() === currentWeekStart.toDateString()
  }

  const weekFrom = toLocalDateString(weekDays[0])
  const weekTo = toLocalDateString(weekDays[6])

  const { user } = useAuthContext()

  // --- Завантаження записів за поточний тиждень ---
  useEffect(() => {
    async function fetchEntries() {
      try {
        setLoading(true)
        const result = await timeEntriesService.getMy(weekFrom, weekTo, 1, 200)
        setEntries(result.entries)
      } catch (err: any) {
        showError(err, t('common.errors.saveFailed'))
      } finally {
        setLoading(false)
      }
    }
    fetchEntries()
  }, [weekFrom, weekTo])

  // --- Навігація тижнями ---
  const goToPreviousWeek = () => {
    const d = new Date(currentWeekStart)
    d.setDate(d.getDate() - 7)
    setCurrentWeekStart(d)
    setSelectedDate(null)
    setShowEntryForm(false)
    setSelectedIds([])
  }

  const goToNextWeek = () => {
    const d = new Date(currentWeekStart)
    d.setDate(d.getDate() + 7)
    setCurrentWeekStart(d)
    setSelectedDate(null)
    setShowEntryForm(false)
    setSelectedIds([])
  }

  // --- Хелпери дат ---
  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

  const hasDayRecords = (date: Date) =>
    entries.some((e) => e.entryDate.startsWith(toLocalDateString(date)))

  // --- Фільтр записів за вибраний день ---
  const filteredEntries = selectedDate
    ? entries.filter((e) => e.entryDate.startsWith(toLocalDateString(selectedDate)))
    : []

  // --- Статистика ---
  const totalHours = filteredEntries.reduce((sum, e) => sum + msToHours(e.hoursMilliseconds), 0)
  const avgHours = filteredEntries.length > 0 ? totalHours / filteredEntries.length : 0

  const toggleSelectEntry = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const isAllSelected =
    filteredEntries.length > 0 && selectedIds.length === filteredEntries.length

  const toggleSelectAll = () => {
    setSelectedIds(isAllSelected ? [] : filteredEntries.map((e) => e.id))
  }

  // --- Додати новий запис ---
  const handleAddNewEntry = () => {
    setEditingEntry(null)
    setShowEntryForm(true)
  }

  // --- Редагувати ---
  const handleEdit = (entry: TimeEntryListItem) => {
    setEditingEntry(entry)
    setShowEntryForm(true)
  }

  const handleHeaderEdit = () => {
    if (selectedIds.length !== 1) return
    const entry = filteredEntries.find((e) => e.id === selectedIds[0])
    if (entry) handleEdit(entry)
  }

  // --- Зберегти (create / update) ---
  const handleSave = async (data: any) => {
    if (!selectedDate) return
    try {
      setSubmitting(true)

      const payload: CreateTimeEntryRequest = {
        entryDate: toLocalDateString(data.date instanceof Date ? data.date : selectedDate),
        hoursMilliseconds: Number(data.hoursMilliseconds),
        userId: user?.userId ?? 0,
        clientId: data.clientId ?? null,
        projectBrand: data.projectBrand || "",
        marketId: data.marketId ?? null,
        mediaId: data.mediaId ?? null,
        jobTypeId: data.jobTypeId ?? null,
        contractingAgencyId: data.contractingAgencyId ?? null,
        comments: data.comments ?? null,
      }

      if (editingEntry) {
        const updated = await timeEntriesService.update(editingEntry.id, payload)
        setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
      } else {
        const created = await timeEntriesService.create(payload)
        setEntries((prev) => [...prev, created])
      }

      setShowEntryForm(false)
      setEditingEntry(null)
    } catch (err: any) {
      showError(err, t('common.errors.saveFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  // --- Видалити ---
  const executeBulkDelete = async () => {
    if (selectedIds.length === 0) return
    try {
      setSubmitting(true)
      await timeEntriesService.deleteBulk(selectedIds)
      setEntries((prev) => prev.filter((e) => !selectedIds.includes(e.id)))
      setSelectedIds([])
    } catch (err: any) {
      showError(err, t('common.errors.deleteFailed'))
    } finally {
      setSubmitting(false)
      setShowBulkDeleteConfirm(false)
    }
  }

  // --- Копіювати ---
  const handleHeaderCopy = () => {
    if (selectedIds.length === 0) return
    setCopyDate(null)
    setCopyMonth(new Date())
    setShowCopyDialog(true)
  }

  const executeCopy = async () => {
    if (selectedIds.length === 0 || !copyDate) return
    try {
      setSubmitting(true)
      const created = await timeEntriesService.copySelected(
        selectedIds,
        toLocalDateString(copyDate)
      )
      setEntries((prev) => [...prev, ...created])
      setSelectedIds([])
    } catch (err: any) {
      showError(err, t('common.errors.saveFailed'))
    } finally {
      setSubmitting(false)
      setShowCopyDialog(false)
      setCopyDate(null)
    }
  }

  // --- Календар для copy-діалогу ---
  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate()
  const getFirstDay = (y: number, m: number) => {
    const d = new Date(y, m, 1).getDay()
    return d === 0 ? 6 : d - 1 // Пн = 0
  }

  const calendarDays = (() => {
    const y = copyMonth.getFullYear()
    const m = copyMonth.getMonth()
    const daysInMonth = getDaysInMonth(y, m)
    const firstDay = getFirstDay(y, m)
    const total = Math.ceil((firstDay + daysInMonth) / 7) * 7
    return Array.from({ length: total }, (_, i) => {
      const dayNum = i - firstDay + 1
      if (dayNum < 1 || dayNum > daysInMonth) return null
      return new Date(y, m, dayNum)
    })
  })()

  const isDateSelected = (date: Date | null) =>
    date ? (copyDate ? isSameDay(date, copyDate) : false) : false

  const toggleCopyDate = (date: Date | null) => {
    if (!date) return
    setCopyDate(copyDate && isSameDay(date, copyDate) ? null : date)
  }

  // --- Рендер ---
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('calendar.title')}</h1>
        <p className="text-muted-foreground">{t('calendar.description')}</p>
      </div>

      {/* Тижневий навігатор */}
      <Card>
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2 relative">
              <CardTitle className="text-center">
                {t('calendar.week', {
                  from: weekDays[0].toLocaleDateString(locale, { day: 'numeric', month: 'long' }),
                  to: weekDays[6].toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }),
                })}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setPickerMonth(new Date(currentWeekStart))
                  setShowWeekPicker(!showWeekPicker)
                }}
                title="Вибрати тиждень"
              >
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              </Button>

              {/* Попап-календарь */}
              {showWeekPicker && (
                <>
                  {/* Оверлей для закрытия */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowWeekPicker(false)}
                  />
                  <div className="absolute top-10 left-1/2 -translate-x-1/2 z-50 bg-popover border border-border rounded-lg shadow-xl p-4 w-72">
                    {/* Навигация по месяцам */}
                    <div className="flex items-center justify-between mb-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => {
                          const d = new Date(pickerMonth)
                          d.setMonth(d.getMonth() - 1)
                          setPickerMonth(d)
                        }}
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-medium text-foreground">
                        {pickerMonth.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => {
                          const d = new Date(pickerMonth)
                          d.setMonth(d.getMonth() + 1)
                          setPickerMonth(d)
                        }}
                      >
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Дни недели */}
                    <div className="grid grid-cols-7 gap-0.5 mb-1">
                      {[1, 2, 3, 4, 5, 6, 0].map(dayIndex => (
                        <div key={dayIndex} className="text-center text-[10px] text-muted-foreground font-medium py-1">
                          {t(`calendar.weekdayShort.${dayIndex}`)}
                        </div>
                      ))}
                    </div>

                    {/* Дни месяца */}
                    <div className="grid grid-cols-7 gap-0.5">
                      {pickerDays.map((day, i) => {
                        const inCurrentWeek = isInCurrentWeek(day)
                        const todayFlag = day ? isToday(day) : false
                        return (
                          <button
                            key={i}
                            disabled={!day}
                            onClick={() => day && handlePickWeek(day)}
                            className={`
                      h-8 w-full rounded text-xs transition-colors
                      ${!day ? 'invisible' : ''}
                      ${inCurrentWeek
                                ? 'bg-primary text-primary-foreground font-semibold'
                                : todayFlag
                                  ? 'bg-[rgb(15,40,84)] text-white'
                                  : 'text-foreground hover:bg-accent cursor-pointer'
                              }
                    `}
                          >
                            {day ? day.getDate() : ''}
                          </button>
                        )
                      })}
                    </div>

                    {/* Кнопка "Сегодня" */}
                    <div className="mt-3 pt-3 border-t border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => handlePickWeek(new Date())}
                      >
                        {t('calendar.currentWeek')}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <Button variant="outline" size="icon" onClick={goToNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-7 gap-1 mt-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1 mt-4">
              {weekDays.map((day, index) => {
                const isSelected = selectedDate && isSameDay(day, selectedDate)
                const hasRecords = hasDayRecords(day)
                const weekdayKeyMap = [1, 2, 3, 4, 5, 6, 0]
                return (
                  <Button
                    key={index}
                    variant="outline"
                    className={`h-auto flex flex-col py-2 ${isToday(day)
                      ? "border-primary bg-[rgb(15,40,84)] text-white hover:bg-[rgb(15,40,84)] hover:text-white"
                      : isSelected
                        ? "bg-primary/10 border-primary text-foreground"
                        : hasRecords
                          ? "bg-gray-300 hover:bg-gray-400 dark:bg-muted dark:hover:bg-muted/80 text-foreground"
                          : "bg-gray-50 hover:bg-gray-100 dark:bg-background dark:hover:bg-accent/50 text-foreground"
                      }`}
                    onClick={() => {
                      setSelectedDate(day)
                      setShowEntryForm(false)
                      setEditingEntry(null)
                      setSelectedIds([])
                    }}
                  >
                    <span className="text-xs font-medium">{t(`calendar.weekdayShort.${weekdayKeyMap[index]}`)}</span>
                    <span className="text-lg font-bold">{day.getDate()}</span>
                    <span className="text-xs">{day.toLocaleDateString(locale, { month: 'short' })}</span>
                  </Button>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Заголовок вибраного дня + кнопка Add */}
      {selectedDate && (
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">
            {t('calendar.entriesForDate', {
              date: selectedDate.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }),
            })}
          </h2>
          <Button onClick={handleAddNewEntry} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('calendar.addEntry')}
          </Button>
        </div>
      )}

      {/* Форма додавання / редагування */}
      {showEntryForm && selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingEntry ? t('calendar.editEntry') : t('calendar.newEntry')}{" "}
              {t('calendar.onDate', { date: selectedDate.toLocaleDateString(locale, { day: 'numeric', month: 'long' }) })}
            </CardTitle>
            <CardDescription>{t('calendar.specifyDetails')}</CardDescription>
          </CardHeader>
          <CardContent>
            <DayEntryForm
              key={editingEntry ? `edit-${editingEntry.id}` : "new"}
              date={selectedDate}
              fields={{ market: true, contractingAgency: true, client: true, projectBrand: true, media: true, jobType: true, comments: true, hours: true }}
              compact={true}
              initialValues={editingEntry}
              filterStartsWith={true}
              showInputInField={true}
              onClose={() => { setShowEntryForm(false); setEditingEntry(null) }}
              onSave={handleSave}
            />
          </CardContent>
        </Card>
      )}

      {/* Статистика та таблиця записів */}
      {selectedDate && (
        <>
          {/* Статистика */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t('calendar.totalHours')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalHours.toFixed(1)} {t('calendar.totalPeriodHours')}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t('calendar.entriesCount')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredEntries.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t('calendar.avgTimePerEntry')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {avgHours > 0 ? `${avgHours.toFixed(1)} ${t('calendar.totalPeriodHours')}` : "—"}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Таблиця */}
          {filteredEntries.length > 0 ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle>{t('calendar.summaryInfo')}</CardTitle>
                    <CardDescription>
                      {t('calendar.reportsForDate', {
                        date: selectedDate.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }),
                      })}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleHeaderEdit}
                      disabled={selectedIds.length !== 1}
                      title={t('calendar.edit')}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowBulkDeleteConfirm(true)}
                      disabled={selectedIds.length === 0}
                      title={t('calendar.delete')}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleHeaderCopy}
                      disabled={selectedIds.length === 0}
                      title={t('calendar.copy')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <Checkbox
                            checked={isAllSelected}
                            onCheckedChange={toggleSelectAll}
                          />
                        </TableHead>
                        <TableHead>{t('calendar.market')}</TableHead>
                        <TableHead>{t('calendar.agency')}</TableHead>
                        <TableHead>{t('calendar.client')}</TableHead>
                        <TableHead>{t('calendar.projectBrand')}</TableHead>
                        <TableHead>{t('calendar.media')}</TableHead>
                        <TableHead>{t('calendar.jobType')}</TableHead>
                        <TableHead>{t('calendar.comments')}</TableHead>
                        <TableHead>{t('calendar.hours')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEntries.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.includes(entry.id)}
                              onCheckedChange={() => toggleSelectEntry(entry.id)}
                            />
                          </TableCell>
                          <TableCell>{entry.marketName || "—"}</TableCell>
                          <TableCell>{entry.contractingAgencyName || "—"}</TableCell>
                          <TableCell>{entry.clientName || "—"}</TableCell>
                          <TableCell>{entry.projectBrandName || "—"}</TableCell>
                          <TableCell>{entry.mediaName || "—"}</TableCell>
                          <TableCell>{entry.jobTypeName || "—"}</TableCell>
                          <TableCell className="max-w-[200px] truncate" title={entry.comments ?? ""}>
                            {entry.comments ?? "—"}
                          </TableCell>
                          <TableCell>{msToHours(entry.hoursMilliseconds).toFixed(1)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            !showEntryForm && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <p className="text-lg font-medium mb-2 text-foreground">{t('calendar.noEntriesForDate')}</p>
                  <p className="text-muted-foreground mb-4">
                    {t('calendar.noEntriesForDateDesc', {
                      date: selectedDate.toLocaleDateString(locale, { day: 'numeric', month: 'long' }),
                    })}
                  </p>
                  <Button onClick={handleAddNewEntry} className="gap-2">
                    <Plus className="h-4 w-4" />
                    {t('calendar.addFirstEntry')}
                  </Button>
                </CardContent>
              </Card>
            )
          )}
        </>
      )}

      <AlertDialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('calendar.deleteConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedIds.length === 1
                ? t('calendar.deleteConfirmSingle')
                : t('calendar.deleteConfirmMultiple', { count: selectedIds.length })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('calendar.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={executeBulkDelete} disabled={submitting}>
              {t('calendar.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Діалог копіювання */}
      <Dialog open={showCopyDialog} onOpenChange={setShowCopyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('calendar.selectDatesToCopy')}</DialogTitle>
            <DialogDescription>{t('calendar.selectDatesToCopyHint')}</DialogDescription>
          </DialogHeader>

          <div className="py-2">
            {/* Навігація по місяцях */}
            <div className="flex justify-between items-center mb-3">
              <Button variant="ghost" size="icon" onClick={() => {
                const d = new Date(copyMonth); d.setMonth(d.getMonth() - 1); setCopyMonth(d)
              }}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-medium text-sm text-foreground">
                {copyMonth.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
              </span>
              <Button variant="ghost" size="icon" onClick={() => {
                const d = new Date(copyMonth); d.setMonth(d.getMonth() + 1); setCopyMonth(d)
              }}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Дні тижня */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"].map((d) => (
                <div key={d} className="text-center text-xs text-muted-foreground font-medium py-1">{d}</div>
              ))}
            </div>

            {/* Клітинки */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, i) => {
                const todayFlag = day ? isToday(day) : false
                const selected = isDateSelected(day)
                return (
                  <Button
                    key={i}
                    variant={selected ? "default" : "ghost"}
                    size="sm"
                    className={`h-8 w-full text-xs ${selected
                      ? ""
                      : todayFlag
                        ? "bg-[rgb(15,40,84)] text-white hover:bg-[rgb(15,40,84)] hover:text-white"
                        : "text-foreground hover:bg-accent/50"
                      }`}
                    disabled={!day}
                    onClick={() => toggleCopyDate(day)}
                  >
                    {day ? day.getDate() : ""}
                  </Button>
                )
              })}
            </div>

            {copyDate && (
              <p className="text-xs text-muted-foreground mt-2">
                {copyDate.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCopyDialog(false)}>{t('calendar.cancel')}</Button>
            <Button onClick={executeCopy} disabled={!copyDate || submitting}>
              {t('calendar.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ErrorToast message={error} onClose={clearError} />
    </div>
  )
}