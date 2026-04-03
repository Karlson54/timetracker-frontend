"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import {
  marketsService,
  contractingAgenciesService,
  clientsService,
  mediaService,
  jobTypesService,
} from "@/lib/api/services/dictionaryService"
import type { DictionaryItem } from "@/lib/api/types"

interface DayEntryFormProps {
  date: Date
  fields?: {
    market?: boolean
    contractingAgency?: boolean
    client?: boolean
    projectBrand?: boolean
    media?: boolean
    jobType?: boolean
    comments?: boolean
    hours?: boolean
  }
  compact?: boolean
  initialValues?: any
  filterStartsWith?: boolean
  showInputInField?: boolean
  onClose: () => void
  onSave: (data: any) => void
}

// Вспомогательная функция: найти имя по id
function getNameById(id: string | number | undefined, items: DictionaryItem[]): string {
  if (!id) return ""
  const found = items.find((i) => String(i.id) === String(id))
  return found ? found.name : String(id)
}

export function DayEntryForm({
  date,
  fields = {},
  compact = false,
  initialValues,
  filterStartsWith = false,
  showInputInField = false,
  onClose,
  onSave,
}: DayEntryFormProps) {
  const { t } = useTranslation()

  // --- Данные справочников из API ---
  const [markets, setMarkets] = useState<DictionaryItem[]>([])
  const [contractingAgencies, setContractingAgencies] = useState<DictionaryItem[]>([])
  const [clients, setClients] = useState<DictionaryItem[]>([])
  const [mediaTypes, setMediaTypes] = useState<DictionaryItem[]>([])
  const [jobTypes, setJobTypes] = useState<DictionaryItem[]>([])
  const [loadingDicts, setLoadingDicts] = useState(true)

  useEffect(() => {
    async function fetchDicts() {
      try {
        const [m, ca, cl, mt, jt] = await Promise.all([
          marketsService.getActive(),
          contractingAgenciesService.getActive(),
          clientsService.getActive(),
          mediaService.getActive(),
          jobTypesService.getActive(),
        ])
        setMarkets(m)
        setContractingAgencies(ca)
        setClients(cl)
        setMediaTypes(mt)
        setJobTypes(jt)
      } catch (err) {
        console.error("Failed to load dictionaries", err)
      } finally {
        setLoadingDicts(false)
      }
    }
    fetchDicts()
  }, [])

  // --- Режим редагування ---
  const isEditMode = initialValues != null

  // --- Стан форми (зберігаємо id) ---
  const [formData, setFormData] = useState({
    market: isEditMode ? String(initialValues?.marketId ?? initialValues?.market ?? "") : "",
    contractingAgency: isEditMode ? String(initialValues?.contractingAgencyId ?? initialValues?.contractingAgency ?? "") : "",
    client: isEditMode ? String(initialValues?.clientId ?? initialValues?.client ?? "") : "",
    projectBrand: isEditMode ? (initialValues?.projectBrandName ?? initialValues?.projectBrand ?? "") : "",
    media: isEditMode ? String(initialValues?.mediaId ?? initialValues?.media ?? "") : "",
    jobType: isEditMode ? String(initialValues?.jobTypeId ?? initialValues?.jobType ?? "") : "",
    comments: isEditMode ? (initialValues?.comments ?? "") : "",
    hours: isEditMode ? String(initialValues?.hoursMilliseconds ? Math.round(initialValues.hoursMilliseconds / 60000) : (initialValues?.hours ? Math.round(Number(initialValues.hours) * 60) : 60)) : "60",
  })

  // --- Текстові значення для інпутів-селектів ---
  const [marketInput, setMarketInput] = useState("")
  const [agencyInput, setAgencyInput] = useState("")
  const [clientInput, setClientInput] = useState("")
  const [mediaInput, setMediaInput] = useState("")
  const [jobTypeInput, setJobTypeInput] = useState("")

  // Після завантаження справочників — ініціалізуємо текстові поля для edit-режиму
  useEffect(() => {
    if (!isEditMode || loadingDicts) return
    setMarketInput(getNameById(formData.market, markets))
    setAgencyInput(getNameById(formData.contractingAgency, contractingAgencies))
    setClientInput(getNameById(formData.client, clients))
    setMediaInput(getNameById(formData.media, mediaTypes))
    setJobTypeInput(getNameById(formData.jobType, jobTypes))
  }, [loadingDicts])

  // --- Стани відкриття дропдаунів ---
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  // Закрити дропдаун при кліку зовні
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target instanceof Element)) return
      if (!e.target.closest("[data-dropdown]")) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // --- Сабміт ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      date,
      marketId: formData.market ? Number(formData.market) : null,
      contractingAgencyId: formData.contractingAgency ? Number(formData.contractingAgency) : null,
      clientId: formData.client ? Number(formData.client) : null,
      projectBrand: formData.projectBrand || null,
      mediaId: formData.media ? Number(formData.media) : null,
      jobTypeId: formData.jobType ? Number(formData.jobType) : null,
      comments: formData.comments || null,
      // hoursMilliseconds — для timeEntriesService
      hoursMilliseconds: Number(formData.hours) * 60 * 1000,
    })
  }

  // --- Хелпер рендерингу поля ---
  const renderField = (id: string, label: string, component: React.ReactNode) => (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-xs">{label}</Label>
      {component}
    </div>
  )

  // --- Хелпер: комбо-інпут з дропдауном ---
  const renderCombo = (
    key: string,
    inputValue: string,
    setInputValue: (v: string) => void,
    items: DictionaryItem[],
    selectedId: string,
    onSelect: (item: DictionaryItem) => void,
    placeholder: string,
    notFoundText: string,
    compact: boolean,
  ) => {
    const isOpen = openDropdown === key
    const filtered = items.filter((item) =>
      filterStartsWith
        ? item.name.toLowerCase().startsWith(inputValue.toLowerCase())
        : item.name.toLowerCase().includes(inputValue.toLowerCase())
    )

    return (
      <div className="relative w-full" data-dropdown>
        <Input
          className={compact ? "h-8 text-sm" : "w-full"}
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => { setInputValue(e.target.value); setOpenDropdown(key) }}
          onFocus={() => setOpenDropdown(key)}
        />
        {isOpen && (
          <div className="absolute w-full z-50 mt-1 bg-white border rounded-md shadow-lg">
            <Command>
              <CommandEmpty>{notFoundText}</CommandEmpty>
              <CommandGroup>
                <CommandList className="max-h-[200px] overflow-y-auto">
                  {filtered.map((item) => (
                    <CommandItem
                      key={item.id}
                      value={item.name}
                      onSelect={() => {
                        onSelect(item)
                        setOpenDropdown(null)
                      }}
                    >
                      {item.name}
                      <Check className={cn("ml-auto h-4 w-4", selectedId === String(item.id) ? "opacity-100" : "opacity-0")} />
                    </CommandItem>
                  ))}
                </CommandList>
              </CommandGroup>
            </Command>
          </div>
        )}
      </div>
    )
  }

  if (loadingDicts) {
    return <div className="py-8 text-center text-sm text-gray-400">{t('calendar.loading')}</div>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {compact ? (
        <>
          {/* Рядок 1: Market, ContractingAgency, Client */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {fields.market && renderField("market", t('calendar.market'),
              renderCombo("market", marketInput, setMarketInput, markets, formData.market,
                (item) => { setFormData({ ...formData, market: String(item.id) }); setMarketInput(item.name) },
                t('calendar.selectMarket'), t('calendar.marketNotFound'), true)
            )}
            {fields.contractingAgency && renderField("contractingAgency", t('calendar.agency'),
              renderCombo("agency", agencyInput, setAgencyInput, contractingAgencies, formData.contractingAgency,
                (item) => { setFormData({ ...formData, contractingAgency: String(item.id) }); setAgencyInput(item.name) },
                t('calendar.selectAgency'), t('calendar.agencyNotFound'), true)
            )}
            {fields.client && renderField("client", t('calendar.client'),
              renderCombo("client", clientInput, setClientInput, clients, formData.client,
                (item) => { setFormData({ ...formData, client: String(item.id) }); setClientInput(item.name) },
                t('calendar.selectClient'), t('calendar.clientNotFound'), true)
            )}
          </div>

          {/* Рядок 2: ProjectBrand, Media, JobType */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {fields.projectBrand && renderField("projectBrand", t('calendar.projectBrand'),
              <Input
                className="h-8 text-sm"
                placeholder={t('calendar.projectBrandPlaceholder')}
                value={formData.projectBrand}
                onChange={(e) => setFormData({ ...formData, projectBrand: e.target.value })}
              />
            )}
            {fields.media && renderField("media", t('calendar.media'),
              renderCombo("media", mediaInput, setMediaInput, mediaTypes, formData.media,
                (item) => { setFormData({ ...formData, media: String(item.id) }); setMediaInput(item.name) },
                t('calendar.selectMedia'), t('calendar.mediaNotFound'), true)
            )}
            {fields.jobType && renderField("jobType", t('calendar.jobType'),
              renderCombo("jobType", jobTypeInput, setJobTypeInput, jobTypes, formData.jobType,
                (item) => { setFormData({ ...formData, jobType: String(item.id) }); setJobTypeInput(item.name) },
                t('calendar.selectJobType'), t('calendar.jobTypeNotFound'), true)
            )}
          </div>

          {/* Рядок 3: Comments + Hours */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {fields.comments && renderField("comments", t('calendar.comments'),
              <Textarea
                id="comments"
                className="text-sm"
                rows={2}
                placeholder={t('calendar.commentsPlaceholder')}
                value={formData.comments}
                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
              />
            )}
            {fields.hours && renderField("hours", t('calendar.spentTime'),
              <>
                <Input
                  id="hours"
                  className="h-8 text-sm"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="60"
                  value={formData.hours}
                  onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">{t('calendar.minutesHint')}</p>
              </>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Розгорнута форма */}
          {fields.market && (
            <div className="space-y-2">
              <Label>{t('calendar.market')}</Label>
              {renderCombo("market", marketInput, setMarketInput, markets, formData.market,
                (item) => { setFormData({ ...formData, market: String(item.id) }); setMarketInput(item.name) },
                t('calendar.selectMarket'), t('calendar.marketNotFound'), false)}
            </div>
          )}
          {fields.contractingAgency && (
            <div className="space-y-2">
              <Label>{t('calendar.agency')}</Label>
              {renderCombo("agency", agencyInput, setAgencyInput, contractingAgencies, formData.contractingAgency,
                (item) => { setFormData({ ...formData, contractingAgency: String(item.id) }); setAgencyInput(item.name) },
                t('calendar.selectAgency'), t('calendar.agencyNotFound'), false)}
            </div>
          )}
          {fields.client && (
            <div className="space-y-2">
              <Label>{t('calendar.client')}</Label>
              {renderCombo("client", clientInput, setClientInput, clients, formData.client,
                (item) => { setFormData({ ...formData, client: String(item.id) }); setClientInput(item.name) },
                t('calendar.selectClient'), t('calendar.clientNotFound'), false)}
            </div>
          )}
          {fields.projectBrand && (
            <div className="space-y-2">
              <Label>{t('calendar.projectBrand')}</Label>
              <Input
                placeholder={t('calendar.projectBrandPlaceholder')}
                value={formData.projectBrand}
                onChange={(e) => setFormData({ ...formData, projectBrand: e.target.value })}
              />
            </div>
          )}
          {fields.media && (
            <div className="space-y-2">
              <Label>{t('calendar.media')}</Label>
              {renderCombo("media", mediaInput, setMediaInput, mediaTypes, formData.media,
                (item) => { setFormData({ ...formData, media: String(item.id) }); setMediaInput(item.name) },
                t('calendar.selectMedia'), t('calendar.mediaNotFound'), false)}
            </div>
          )}
          {fields.jobType && (
            <div className="space-y-2">
              <Label>{t('calendar.jobType')}</Label>
              {renderCombo("jobType", jobTypeInput, setJobTypeInput, jobTypes, formData.jobType,
                (item) => { setFormData({ ...formData, jobType: String(item.id) }); setJobTypeInput(item.name) },
                t('calendar.selectJobType'), t('calendar.jobTypeNotFound'), false)}
            </div>
          )}
          {fields.comments && (
            <div className="space-y-2">
              <Label>{t('calendar.comments')}</Label>
              <Textarea
                rows={3}
                placeholder={t('calendar.commentsPlaceholder')}
                value={formData.comments}
                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
              />
            </div>
          )}
          {fields.hours && (
            <div className="space-y-2">
              <Label>{t('calendar.spentTime')}</Label>
              <Input
                type="number"
                min="1"
                step="1"
                placeholder="60"
                value={formData.hours}
                onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">{t('calendar.minutesHint')}</p>
            </div>
          )}
        </>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" type="button" onClick={onClose}>{t('calendar.cancel')}</Button>
        <Button type="submit">{t('calendar.save')}</Button>
      </div>
    </form>
  )
}