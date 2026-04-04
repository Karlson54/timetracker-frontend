"use client"

import { useAuthContext } from '@/lib/AuthContext'
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronLeft, ChevronRight, Pencil, Trash, Plus, Copy } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DayEntryForm } from "@/components/day-entry-form"
import { useTranslation } from "react-i18next"
import timeEntriesService from "@/lib/api/services/timeEntriesService"
import type { TimeEntryListItem, CreateTimeEntryRequest } from "@/lib/api/types"

// Хелпер: Date -> "YYYY-MM-DD"
function toISODate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Хелпер: мілісекунди -> години з 1 знаком після коми
function msToHours(ms: number): number {
  return Math.round((ms / 3600000) * 10) / 10
}

export function WeeklyCalendar() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === "uk" ? "uk-UA" : "en-US"

  // --- Стан ---
  const [entries, setEntries] = useState<TimeEntryListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date()
    const day = today.getDay()
    const diff = today.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(today.setDate(diff))
  })
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showEntryForm, setShowEntryForm] = useState(false)
  const [editingEntry, setEditingEntry] = useState<TimeEntryListItem | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Стан для копіювання
  const [copyingId, setCopyingId] = useState<number | null>(null)
  const [copyDates, setCopyDates] = useState<Date[]>([])
  const [showCopyDialog, setShowCopyDialog] = useState(false)
  const [copyMonth, setCopyMonth] = useState(new Date())

  // --- Тиждень ---
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentWeekStart)
    d.setDate(currentWeekStart.getDate() + i)
    return d
  })

  const weekFrom = toISODate(weekDays[0])
  const weekTo = toISODate(weekDays[6])

  const { user } = useAuthContext()

  // --- Завантаження записів за поточний тиждень ---
  useEffect(() => {
    async function fetchEntries() {
      try {
        setLoading(true)
        setError(null)
        const data = await timeEntriesService.getMy(weekFrom, weekTo)
        setEntries(data)
      } catch (err: any) {
        setError(err?.response?.data?.message ?? t('common.errors.loadFailed'))
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
  }

  const goToNextWeek = () => {
    const d = new Date(currentWeekStart)
    d.setDate(d.getDate() + 7)
    setCurrentWeekStart(d)
    setSelectedDate(null)
    setShowEntryForm(false)
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
    entries.some((e) => e.entryDate.startsWith(toISODate(date)))

  // --- Фільтр записів за вибраний день ---
  const filteredEntries = selectedDate
    ? entries.filter((e) => e.entryDate.startsWith(toISODate(selectedDate)))
    : []

  // --- Статистика ---
  const totalHours = filteredEntries.reduce((sum, e) => sum + msToHours(e.hoursMilliseconds), 0)
  const avgHours = filteredEntries.length > 0 ? totalHours / filteredEntries.length : 0

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

  // --- Зберегти (create / update) ---
  const handleSave = async (data: any) => {
    if (!selectedDate) return
    try {
      setSubmitting(true)

      const payload: CreateTimeEntryRequest = {
        entryDate: toISODate(data.date instanceof Date ? data.date : selectedDate),
        hoursMilliseconds: Number(data.hoursMilliseconds),
        userId: user?.userId ?? 0,
        agencyId: user?.agencyId ?? 0,
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
      alert(err?.response?.data?.message ?? t('common.errors.saveFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  // --- Видалити ---
  const handleDelete = async (id: number) => {
    if (!confirm(t('calendar.deleteConfirm') || "Delete this entry?")) return
    try {
      await timeEntriesService.delete(id)
      setEntries((prev) => prev.filter((e) => e.id !== id))
    } catch (err: any) {
      alert(err?.response?.data?.message ?? t('common.errors.deleteFailed'))
    }
  }

  // --- Копіювати ---
  const handleCopyReport = (id: number) => {
    setCopyingId(id)
    setCopyDates([])
    setCopyMonth(new Date())
    setShowCopyDialog(true)
  }

  const executeCopy = async () => {
    if (!copyingId || !copyDates.length) return
    const source = entries.find((e) => e.id === copyingId)
    if (!source) return

    try {
      setSubmitting(true)
      const newEntries: TimeEntryListItem[] = []
      for (const date of copyDates) {
        const created = await timeEntriesService.create({
          userId: user?.userId ?? 0,
          agencyId: user?.agencyId ?? 0,
          entryDate: toISODate(date),
          hoursMilliseconds: source.hoursMilliseconds,
          clientId: source.clientId,
          projectBrand: source.projectBrandName ?? "",
          marketId: source.marketId,
          mediaId: source.mediaId,
          jobTypeId: source.jobTypeId,
          contractingAgencyId: source.contractingAgencyId,
          comments: source.comments,
        })
        newEntries.push(created)
      }
      setEntries((prev) => [...prev, ...newEntries])
    } catch (err: any) {
      alert(err?.response?.data?.message ?? t('common.errors.saveFailed'))
    } finally {
      setSubmitting(false)
      setShowCopyDialog(false)
      setCopyingId(null)
      setCopyDates([])
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
    date ? copyDates.some((d) => isSameDay(d, date)) : false

  const toggleCopyDate = (date: Date | null) => {
    if (!date) return
    if (isDateSelected(date)) {
      setCopyDates((prev) => prev.filter((d) => !isSameDay(d, date)))
    } else {
      setCopyDates((prev) => [...prev, date])
    }
  }

  // --- Рендер ---
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('calendar.title')}</h1>
        <p className="text-gray-500">{t('calendar.description')}</p>
      </div>

      {/* Тижневий навігатор */}
      <Card>
        <CardHeader className="pb-0">
          <div className="flex justify-between items-center">
            <CardTitle>
              {t('calendar.week', {
                from: weekDays[0].toLocaleDateString(locale, { day: 'numeric', month: 'long' }),
                to: weekDays[6].toLocaleDateString(locale, { day: 'numeric', month: 'long' }),
              })}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={goToNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
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
                        ? "bg-primary/10 border-primary"
                        : hasRecords
                          ? "bg-gray-100 hover:bg-gray-200"
                          : "bg-gray-200 hover:bg-gray-300"
                      }`}
                    onClick={() => {
                      setSelectedDate(day)
                      setShowEntryForm(false)
                      setEditingEntry(null)
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
                <div className="text-2xl font-bold">{totalHours.toFixed(1)} {t('calendar.hours')}</div>
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
                  {avgHours > 0 ? `${avgHours.toFixed(1)} ${t('calendar.hours')}` : "—"}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Таблиця */}
          {filteredEntries.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>{t('calendar.summaryInfo')}</CardTitle>
                <CardDescription>
                  {t('calendar.reportsForDate', {
                    date: selectedDate.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }),
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('calendar.market')}</TableHead>
                        <TableHead>{t('calendar.agency')}</TableHead>
                        <TableHead>{t('calendar.client')}</TableHead>
                        <TableHead>{t('calendar.projectBrand')}</TableHead>
                        <TableHead>{t('calendar.media')}</TableHead>
                        <TableHead>{t('calendar.jobType')}</TableHead>
                        <TableHead>{t('calendar.comments')}</TableHead>
                        <TableHead>{t('calendar.hours')}</TableHead>
                        <TableHead>{t('calendar.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEntries.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>{entry.marketName ?? "—"}</TableCell>
                          <TableCell>{entry.contractingAgencyName ?? "—"}</TableCell>
                          <TableCell>{entry.clientName ?? "—"}</TableCell>
                          <TableCell>{entry.projectBrandName ?? "—"}</TableCell>
                          <TableCell>{entry.mediaName ?? "—"}</TableCell>
                          <TableCell>{entry.jobTypeName ?? "—"}</TableCell>
                          <TableCell className="max-w-[200px] truncate" title={entry.comments ?? ""}>
                            {entry.comments ?? "—"}
                          </TableCell>
                          <TableCell>{msToHours(entry.hoursMilliseconds).toFixed(1)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(entry)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(entry.id)}>
                                <Trash className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleCopyReport(entry.id)}>
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
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
                  <p className="text-lg font-medium mb-2">{t('calendar.noEntriesForDate')}</p>
                  <p className="text-gray-500 mb-4">
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
              <span className="font-medium text-sm">
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
                <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>
              ))}
            </div>

            {/* Клітинки */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, i) => (
                <Button
                  key={i}
                  variant={isDateSelected(day) ? "default" : "ghost"}
                  size="sm"
                  className="h-8 w-full text-xs"
                  disabled={!day}
                  onClick={() => toggleCopyDate(day)}
                >
                  {day ? day.getDate() : ""}
                </Button>
              ))}
            </div>

            {copyDates.length > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                {t('calendar.selectedDates', { count: copyDates.length })}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCopyDialog(false)}>{t('calendar.cancel')}</Button>
            <Button onClick={executeCopy} disabled={!copyDates.length || submitting}>
              {t('calendar.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}