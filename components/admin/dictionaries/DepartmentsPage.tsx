"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Pencil, Plus, Search, Trash, UserCheck, UserX } from "lucide-react"
import { useTranslation } from "react-i18next"
import departmentsService, { Department } from "@/lib/api/services/departmentsService"
import { agenciesService } from "@/lib/api/services/dictionaryService"
import type { DictionaryItem } from "@/lib/api/types"
import { ErrorToast } from "@/components/ui/error-toast"
import { useErrorToast } from "@/hooks/use-error-toast"

export function DepartmentsPage() {
  const { t } = useTranslation()
  const { error, showError, clearError } = useErrorToast()

  const [agencies, setAgencies] = useState<DictionaryItem[]>([])
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>("")
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const [newName, setNewName] = useState("")
  const [editingItem, setEditingItem] = useState<Department | null>(null)
  const [editName, setEditName] = useState("")
  const [deleteId, setDeleteId] = useState<number | null>(null)

  // Завантаження агенцій
  useEffect(() => {
    agenciesService.getActive()
      .then(setAgencies)
      .catch(err => showError(err, t('common.errors.loadFailed')))
  }, [])

  // Завантаження відділів при зміні агенції
  useEffect(() => {
    if (!selectedAgencyId) {
      setDepartments([])
      return
    }
    setLoading(true)
    departmentsService.getByAgency(Number(selectedAgencyId))
      .then(setDepartments)
      .catch(err => showError(err, t('common.errors.loadFailed')))
      .finally(() => setLoading(false))
  }, [selectedAgencyId])

  const filtered = departments.filter(d =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAdd = async () => {
    if (!newName.trim() || !selectedAgencyId) return
    try {
      setSubmitting(true)
      const created = await departmentsService.create({
        name: newName.trim(),
        agencyId: Number(selectedAgencyId),
      })
      setDepartments(prev => [...prev, created])
      setNewName("")
      setIsAddOpen(false)
    } catch (err) {
      showError(err, t('common.errors.saveFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  const openEdit = (item: Department) => {
    setEditingItem(item)
    setEditName(item.name)
    setIsEditOpen(true)
  }

  const handleEdit = async () => {
    if (!editingItem || !editName.trim()) return
    try {
      setSubmitting(true)
      const updated = await departmentsService.update(editingItem.id, { name: editName.trim() })
      setDepartments(prev => prev.map(d => d.id === updated.id ? updated : d))
      setIsEditOpen(false)
    } catch (err) {
      showError(err, t('common.errors.saveFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  const confirmDelete = (id: number) => {
    setDeleteId(id)
    setIsDeleteOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      setSubmitting(true)
      await departmentsService.delete(deleteId)
      setDepartments(prev => prev.filter(d => d.id !== deleteId))
      setIsDeleteOpen(false)
    } catch (err) {
      showError(err, t('common.errors.deleteFailed'))
    } finally {
      setSubmitting(false)
      setDeleteId(null)
    }
  }

  const handleToggleStatus = async (item: Department) => {
    try {
      if (item.isActive) {
        await departmentsService.deactivate(item.id)
      } else {
        await departmentsService.activate(item.id)
      }
      setDepartments(prev =>
        prev.map(d => d.id === item.id ? { ...d, isActive: !d.isActive } : d)
      )
    } catch (err) {
      showError(err, t('common.errors.saveFailed'))
    }
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
            <DialogTitle>{t('dictionaries.departments.add.title')}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label>{t('dictionaries.fields.name')}</Label>
            <Input
              className="mt-2"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
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
            <DialogTitle>{t('dictionaries.departments.edit.title')}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label>{t('dictionaries.fields.name')}</Label>
            <Input
              className="mt-2"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleEdit()}
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
              <CardTitle>{t('dictionaries.departments.title')}</CardTitle>
              <CardDescription>{t('dictionaries.departments.description')}</CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={selectedAgencyId} onValueChange={setSelectedAgencyId}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder={t('admin.employees.fields.selectAgency')} />
                </SelectTrigger>
                <SelectContent>
                  {agencies.map(a => (
                    <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative w-full md:w-48">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder={t('common.search')}
                  className="pl-8"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <Button
                onClick={() => setIsAddOpen(true)}
                size="sm"
                disabled={!selectedAgencyId}
              >
                <Plus className="h-4 w-4 mr-1" />
                {t('common.add')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!selectedAgencyId ? (
            <p className="text-center text-muted-foreground py-8">
              {t('dictionaries.departments.selectAgencyHint')}
            </p>
          ) : loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('dictionaries.tableHeaders.name')}</TableHead>
                  <TableHead>{t('dictionaries.departments.usersCount')}</TableHead>
                  <TableHead>{t('dictionaries.tableHeaders.status')}</TableHead>
                  <TableHead className="text-right">{t('dictionaries.tableHeaders.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length > 0 ? (
                  filtered.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-muted-foreground">{item.usersCount}</TableCell>
                      <TableCell>
                        <Badge variant={item.isActive ? "default" : "secondary"}>
                          {item.isActive ? t('common.active') : t('common.inactive')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
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
                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                      {t('common.noData')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ErrorToast message={error} onClose={clearError} />
    </>
  )
}