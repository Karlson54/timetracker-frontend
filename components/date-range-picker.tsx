"use client"
import { useState } from "react"
import { format } from "date-fns"
import { CalendarIcon, ChevronLeft, ChevronRight, Check } from "lucide-react"
import type { DateRange } from "react-day-picker"
import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DatePickerWithRangeProps {
  date: DateRange | undefined
  setDate: (date: DateRange | undefined) => void
}

export function DatePickerWithRange({ date, setDate }: DatePickerWithRangeProps) {
  const { t, i18n } = useTranslation()
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [localDateRange, setLocalDateRange] = useState<DateRange | undefined>(date)
  const [isOpen, setIsOpen] = useState(false)

  const locale = i18n.language === 'uk' ? 'uk-UA' : 'en-US'
  const rawMonthName = currentMonth.toLocaleDateString(locale, { month: 'long', year: 'numeric' })
  const monthName = rawMonthName.charAt(0).toLowerCase() + rawMonthName.slice(1)

  const getDaysInMonth = (year: number, month: number) =>
    new Date(year, month + 1, 0).getDate()

  const getFirstDayOfMonth = (year: number, month: number) => {
    const d = new Date(year, month, 1).getDay()
    return d === 0 ? 6 : d - 1
  }

  const generateCalendarDays = (year: number, month: number) => {
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)

    const daysFromPrevMonth = firstDay
    const prevMonth = month === 0 ? 11 : month - 1
    const prevMonthYear = month === 0 ? year - 1 : year
    const daysInPrevMonth = getDaysInMonth(prevMonthYear, prevMonth)

    const prevMonthDays = []
    for (let i = daysInPrevMonth - daysFromPrevMonth + 1; i <= daysInPrevMonth; i++) {
      prevMonthDays.push({ day: i, month: prevMonth, year: prevMonthYear, isCurrentMonth: false })
    }

    const currentMonthDays = []
    for (let i = 1; i <= daysInMonth; i++) {
      currentMonthDays.push({ day: i, month, year, isCurrentMonth: true })
    }

    const totalDaysShown = Math.ceil((daysFromPrevMonth + daysInMonth) / 7) * 7
    const daysFromNextMonth = totalDaysShown - (daysFromPrevMonth + daysInMonth)
    const nextMonth = month === 11 ? 0 : month + 1
    const nextMonthYear = month === 11 ? year + 1 : year

    const nextMonthDays = []
    for (let i = 1; i <= daysFromNextMonth; i++) {
      nextMonthDays.push({ day: i, month: nextMonth, year: nextMonthYear, isCurrentMonth: false })
    }

    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays]
  }

  const isDateSelected = (day: number, month: number, year: number) => {
    if (!localDateRange) return false
    const currentDate = new Date(year, month, day)
    const from = localDateRange.from
    const to = localDateRange.to || localDateRange.from
    return !!(from && to && currentDate >= from && currentDate <= to)
  }

  const isStartDate = (day: number, month: number, year: number) => {
    if (!localDateRange?.from) return false
    const currentDate = new Date(year, month, day)
    const from = localDateRange.from
    return (
      currentDate.getDate() === from.getDate() &&
      currentDate.getMonth() === from.getMonth() &&
      currentDate.getFullYear() === from.getFullYear()
    )
  }

  const isEndDate = (day: number, month: number, year: number) => {
    if (!localDateRange?.to) return false
    const currentDate = new Date(year, month, day)
    const to = localDateRange.to
    return (
      currentDate.getDate() === to.getDate() &&
      currentDate.getMonth() === to.getMonth() &&
      currentDate.getFullYear() === to.getFullYear()
    )
  }

  const handleDateSelection = (day: number, month: number, year: number) => {
    const selectedDate = new Date(year, month, day)
    if (!localDateRange || !localDateRange.from || localDateRange.to) {
      setLocalDateRange({ from: selectedDate, to: undefined })
    } else {
      const from = localDateRange.from
      if (selectedDate < from) {
        setLocalDateRange({ from: selectedDate, to: from })
      } else {
        setLocalDateRange({ from, to: selectedDate })
      }
    }
  }

  const goToPreviousMonth = () => {
    const d = new Date(currentMonth)
    d.setMonth(d.getMonth() - 1)
    setCurrentMonth(d)
  }

  const goToNextMonth = () => {
    const d = new Date(currentMonth)
    d.setMonth(d.getMonth() + 1)
    setCurrentMonth(d)
  }

  const applyDateRange = () => {
    setDate(localDateRange)
    setIsOpen(false)
  }

  const clearSelection = () => {
    setLocalDateRange(undefined)
  }

  const handleOpenChange = (open: boolean) => {
    if (open) setLocalDateRange(date)
    setIsOpen(open)
  }

  const calendarDays = generateCalendarDays(
    currentMonth.getFullYear(),
    currentMonth.getMonth()
  )

  const weekDayLabels = [1, 2, 3, 4, 5, 6, 0]

  return (
    <div className="grid gap-2">
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
            <span className="truncate">
              {date?.from ? (
                date.to ? (
                  `${format(date.from, "dd.MM.yyyy")} - ${format(date.to, "dd.MM.yyyy")}`
                ) : (
                  format(date.from, "dd.MM.yyyy")
                )
              ) : (
                t('dateRangePicker.placeholder')
              )}
            </span>
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-[min(calc(100vw-2rem),420px)] p-3 sm:p-4"
          align="start"
          sideOffset={4}
        >
          <div className="space-y-3">
            {/* Навигация по месяцам */}
            <div className="flex justify-between items-center">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="font-medium text-sm text-foreground">
                {monthName}
              </div>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Дни недели */}
            <div className="grid grid-cols-7 gap-0.5">
              {weekDayLabels.map((dayIndex) => (
                <div
                  key={dayIndex}
                  className="text-center text-xs font-medium py-1 text-muted-foreground"
                >
                  {t(`calendar.weekdayShort.${dayIndex}`)}
                </div>
              ))}
            </div>

            {/* Дни */}
            <div className="grid grid-cols-7 gap-0.5">
              {calendarDays.map((day, i) => {
                const isStart = isStartDate(day.day, day.month, day.year)
                const isEnd = isEndDate(day.day, day.month, day.year)
                const isSelected = isDateSelected(day.day, day.month, day.year)

                return (
                  <button
                    key={i}
                    onClick={() => handleDateSelection(day.day, day.month, day.year)}
                    className={cn(
                      "relative h-8 w-full rounded-md text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring",
                      !day.isCurrentMonth && "text-muted-foreground/40",
                      day.isCurrentMonth && !isSelected && "text-foreground hover:bg-accent",
                      isSelected && !isStart && !isEnd && "bg-accent text-accent-foreground rounded-none",
                      (isStart || isEnd) && "bg-primary text-primary-foreground font-medium",
                      isStart && "rounded-l-md rounded-r-none",
                      isEnd && "rounded-r-md rounded-l-none",
                      isStart && isEnd && "rounded-md",
                    )}
                  >
                    {day.day}
                  </button>
                )
              })}
            </div>

            {/* Выбранный период */}
            {localDateRange?.from && (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  {t('dateRangePicker.selectedPeriod')}
                </span>{" "}
                {format(localDateRange.from, "dd.MM.yyyy")}
                {localDateRange.to
                  ? ` - ${format(localDateRange.to, "dd.MM.yyyy")}`
                  : ` ${t('dateRangePicker.selectEndDate')}`
                }
              </p>
            )}

            {/* Кнопки */}
            <div className="flex justify-between pt-1">
              <Button variant="outline" size="sm" onClick={clearSelection}>
                {t('dateRangePicker.clear')}
              </Button>
              <Button
                size="sm"
                onClick={applyDateRange}
                disabled={!localDateRange?.from || !localDateRange?.to}
              >
                <Check className="h-4 w-4 mr-1" />
                {t('dateRangePicker.apply')}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}