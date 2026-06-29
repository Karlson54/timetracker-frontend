"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Pencil, Plus, Search, Trash, UserCheck, UserX } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { DictionaryItem, CreateDictionaryItemRequest } from "@/lib/api/types"

const PAGE_SIZE = 15

interface DictionaryService {
  getAll: () => Promise<DictionaryItem[]>
  getPaged?: (
    pageNumber: number,
    pageSize: number,
    searchTerm?: string
  ) => Promise<{ data: DictionaryItem[]; totalCount: number; totalPages: number }>
  create: (data: CreateDictionaryItemRequest) => Promise<DictionaryItem>
  update: (id: number, data: CreateDictionaryItemRequest) => Promise<DictionaryItem>
  delete: (id: number) => Promise<void>
  activate?: (id: number) => Promise<void>
  deactivate?: (id: number) => Promise<void>
}

interface DictionaryPageProps {
  title: string
  description?: string
  service: DictionaryService
}

export function DictionaryPage({ title, description, service }: DictionaryPageProps) {
  const { t } = useTranslation()

  const [items, setItems] = useState<DictionaryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Пагінація
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const [newName, setNewName] = useState("")
  const [editingItem, setEditingItem] = useState<DictionaryItem | null>(null)
  const [editName, setEditName] = useState("")
  const [deleteId, setDeleteId] = useState<number | null>(null)

  // Скидаємо сторінку при зміні пошуку
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      if (service.getPaged) {
        const result = await service.getPaged(currentPage, PAGE_SIZE, searchTerm || undefined)
        setItems(result.data)
        setTotalCount(result.totalCount)
        setTotalPages(result.totalPages)
      } else {
        // fallback: getAll + client-side filter
        const data = await service.getAll()
        const filtered = searchTerm
          ? data.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()))
          : data
        setItems(filtered)
        setTotalCount(filtered.length)
        setTotalPages(Math.ceil(filtered.length / PAGE_SIZE) || 1)
      }
    } catch (err: any) {
      setError(err?.response?.data?.message ?? t('common.errors.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchTerm, service])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  // --- Додати ---
  const handleAdd = async () => {
    if (!newName.trim()) return
    try {
      setSubmitting(true)
      await service.create({ name: newName.trim() })
      setNewName("")
      setIsAddOpen(false)
      // після додавання — на першу сторінку
      setCurrentPage(1)
      await fetchItems()
    } catch (err: any) {
      alert(err?.response?.data?.message ?? t('common.errors.saveFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  // --- Редагувати ---
  const openEdit = (item: DictionaryItem) => {
    setEditingItem(item)
    setEditName(item.name)
    setIsEditOpen(true)
  }

  const handleEdit = async () => {
    if (!editingItem || !editName.trim()) return
    try {
      setSubmitting(true)
      const updated = await service.update(editingItem.id, { name: editName.trim() })
      setItems(prev => prev.map(i => i.id === updated.id ? updated : i))
      setIsEditOpen(false)
    } catch (err: any) {
      alert(err?.response?.data?.message ?? t('common.errors.saveFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  // --- Видалити ---
  const confirmDelete = (id: number) => {
    setDeleteId(id)
    setIsDeleteOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      setSubmitting(true)
      await service.delete(deleteId)
      setIsDeleteOpen(false)
      await fetchItems()
    } catch (err: any) {
      alert(err?.response?.data?.message ?? t('common.errors.deleteFailed'))
    } finally {
      setSubmitting(false)
      setDeleteId(null)
    }
  }

  // --- Активація / Деактивація ---
  const handleToggleStatus = async (item: DictionaryItem) => {
    try {
      if (item.isActive) {
        if (!service.deactivate) return
        await service.deactivate(item.id)
      } else {
        if (!service.activate) return
        await service.activate(item.id)
      }
      setItems(prev =>
        prev.map(i => i.id === item.id ? { ...i, isActive: !i.isActive } : i)
      )
    } catch (err: any) {
      alert(err?.response?.data?.message ?? t('common.errors.saveFailed'))
    }
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-destructive">{error}</CardContent>
      </Card>
    )
  }

  return (
    <>
      {/* Діалог видалення */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dictionaries.delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('dictionaries.delete.description')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={submitting}>
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Діалог додавання */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('dictionaries.add.title', { name: title })}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label>{t('dictionaries.fields.name')}</Label>
            <Input
              className="mt-2"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder={t('dictionaries.fields.namePlaceholder')}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleAdd} disabled={submitting || !newName.trim()}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Діалог редагування */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('dictionaries.edit.title', { name: title })}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label>{t('dictionaries.fields.name')}</Label>
            <Input
              className="mt-2"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleEdit} disabled={submitting || !editName.trim()}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Основна картка */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <CardTitle>{title}</CardTitle>
              {description && <CardDescription>{description}</CardDescription>}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder={t('common.search')}
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button onClick={() => setIsAddOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                {t('common.add')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('dictionaries.tableHeaders.name')}</TableHead>
                <TableHead>{t('dictionaries.tableHeaders.status')}</TableHead>
                <TableHead className="text-right">{t('dictionaries.tableHeaders.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={3}><Skeleton className="h-8 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : items.length > 0 ? (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <Badge variant={item.isActive ? "default" : "secondary"}>
                        {item.isActive ? t('common.active') : t('common.inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {(service.activate || service.deactivate) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleStatus(item)}
                            title={item.isActive ? t('common.deactivate') : t('common.activate')}
                          >
                            {item.isActive
                              ? <UserX className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                              : <UserCheck className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                            }
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => confirmDelete(item.id)}>
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                    {t('common.noData')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Пагінація */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                {t('admin.reports.pagination.showing', {
                  from: (currentPage - 1) * PAGE_SIZE + 1,
                  to: Math.min(currentPage * PAGE_SIZE, totalCount),
                  total: totalCount,
                })}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || loading}
                >
                  ←
                </Button>
                <span className="text-sm">{currentPage} / {totalPages}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || loading}
                >
                  →
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}