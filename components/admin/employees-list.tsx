"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import usersService from "@/lib/api/services/usersService"
import { agenciesService } from "@/lib/api/services/dictionaryService"
import rolesService from "@/lib/api/services/rolesService"
import type { UserListItem, CreateUserRequest, UpdateUserRequest, DictionaryItem, RoleItem } from "@/lib/api/types"

const EMPTY_CREATE: CreateUserRequest = {
  login: "",
  email: "",
  name: "",
  password: "",
  agencyId: 0,
  roleIds: [],
}

export function EmployeesList() {
  const { t } = useTranslation()

  const [employees, setEmployees] = useState<UserListItem[]>([])
  const [agencies, setAgencies] = useState<DictionaryItem[]>([])
  const [roles, setRoles] = useState<RoleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const [newEmployee, setNewEmployee] = useState<CreateUserRequest>(EMPTY_CREATE)
  const [editingEmployee, setEditingEmployee] = useState<UserListItem | null>(null)
  const [editForm, setEditForm] = useState<UpdateUserRequest>({ email: "", name: "", agencyId: 0 })
  const [employeeToDelete, setEmployeeToDelete] = useState<number | null>(null)

  const [submitting, setSubmitting] = useState(false)

  // --- Завантаження даних ---
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)
        const [users, activeAgencies, activeRoles] = await Promise.all([
          usersService.getAll(),
          agenciesService.getActive(),
          rolesService.getActive(),
        ])
        setEmployees(users)
        setAgencies(activeAgencies)
        setRoles(activeRoles)
      } catch (err: any) {
        setError(err?.response?.data?.message ?? t('common.errors.loadFailed'))
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // --- Фільтрація ---
  const filtered = employees.filter((e) =>
    [e.name, e.email, e.login, e.agencyName].some((field) =>
      field?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  // --- Додати ---
  const handleAdd = async () => {
    if (!newEmployee.name || !newEmployee.email || !newEmployee.login || !newEmployee.password || !newEmployee.agencyId || newEmployee.roleIds.length === 0) return
    try {
      setSubmitting(true)
      const created = await usersService.create(newEmployee)
      setEmployees((prev) => [...prev, created])
      setNewEmployee(EMPTY_CREATE)
      setIsAddDialogOpen(false)
    } catch (err: any) {
      alert(err?.response?.data?.message ?? t('common.errors.saveFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  // --- Редагувати ---
  const openEdit = (employee: UserListItem) => {
    setEditingEmployee(employee)
    setEditForm({ email: employee.email, name: employee.name, agencyId: employee.agencyId })
    setIsEditDialogOpen(true)
  }

  const handleEdit = async () => {
    if (!editingEmployee) return
    try {
      setSubmitting(true)
      const updated = await usersService.update(editingEmployee.id, editForm)
      setEmployees((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
      setIsEditDialogOpen(false)
    } catch (err: any) {
      alert(err?.response?.data?.message ?? t('common.errors.saveFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  // --- Активація / Деактивація ---
  const handleToggleActive = async (employee: UserListItem) => {
    try {
      if (employee.isActive) {
        await usersService.deactivate(employee.id)
      } else {
        await usersService.activate(employee.id)
      }
      setEmployees((prev) =>
        prev.map((e) => (e.id === employee.id ? { ...e, isActive: !e.isActive } : e))
      )
    } catch (err: any) {
      alert(err?.response?.data?.message ?? t('common.errors.saveFailed'))
    }
  }

  // --- Видалити ---
  const confirmDelete = (id: number) => {
    setEmployeeToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!employeeToDelete) return
    try {
      setSubmitting(true)
      await usersService.deactivate(employeeToDelete) // soft delete через деактивацію
      setEmployees((prev) => prev.filter((e) => e.id !== employeeToDelete))
      setIsDeleteDialogOpen(false)
    } catch (err: any) {
      alert(err?.response?.data?.message ?? t('common.errors.deleteFailed'))
    } finally {
      setSubmitting(false)
      setEmployeeToDelete(null)
    }
  }

  // --- Рендер ---
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-red-500">{error}</CardContent>
      </Card>
    )
  }

  return (
    <>
      {/* Діалог видалення */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.employees.delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('admin.employees.delete.description')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('admin.employees.delete.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={submitting}>
              {t('admin.employees.delete.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Діалог додавання */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.employees.add.title')}</DialogTitle>
            <DialogDescription>{t('admin.employees.add.description')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">{t('admin.employees.fields.name')}</Label>
              <Input className="col-span-3" value={newEmployee.name} onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">{t('admin.employees.fields.login')}</Label>
              <Input className="col-span-3" value={newEmployee.login} onChange={(e) => setNewEmployee({ ...newEmployee, login: e.target.value })} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">{t('admin.employees.fields.email')}</Label>
              <Input className="col-span-3" type="email" value={newEmployee.email} onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">{t('admin.employees.fields.password')}</Label>
              <Input className="col-span-3" type="password" value={newEmployee.password} onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">{t('admin.employees.fields.agency')}</Label>
              <Select value={String(newEmployee.agencyId || "")} onValueChange={(v) => setNewEmployee({ ...newEmployee, agencyId: Number(v) })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={t('admin.employees.fields.selectAgency')} />
                </SelectTrigger>
                <SelectContent>
                  {agencies.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">{t('admin.employees.fields.role')}</Label>
              <Select
                value={String(newEmployee.roleIds[0] ?? "")}
                onValueChange={(v) => setNewEmployee({ ...newEmployee, roleIds: [Number(v)] })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={t('admin.employees.fields.selectRole')} />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleAdd} disabled={submitting}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Діалог редагування */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.employees.edit.title')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">{t('admin.employees.fields.name')}</Label>
              <Input className="col-span-3" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">{t('admin.employees.fields.email')}</Label>
              <Input className="col-span-3" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">{t('admin.employees.fields.agency')}</Label>
              <Select value={String(editForm.agencyId || "")} onValueChange={(v) => setEditForm({ ...editForm, agencyId: Number(v) })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={t('admin.employees.fields.selectAgency')} />
                </SelectTrigger>
                <SelectContent>
                  {agencies.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleEdit} disabled={submitting}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Основна картка */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <CardTitle>{t('admin.employees.list.title')}</CardTitle>
              <CardDescription>{t('admin.employees.list.description', { count: employees.length })}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder={t('admin.employees.list.searchPlaceholder')}
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                {t('admin.employees.add.button')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin.employees.tableHeaders.employee')}</TableHead>
                <TableHead>{t('admin.employees.tableHeaders.email')}</TableHead>
                <TableHead>{t('admin.employees.tableHeaders.login')}</TableHead>
                <TableHead>{t('admin.employees.tableHeaders.agency')}</TableHead>
                <TableHead>{t('admin.employees.tableHeaders.status')}</TableHead>
                <TableHead className="text-right">{t('admin.employees.tableHeaders.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length > 0 ? (
                filtered.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.name}</TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>{employee.login}</TableCell>
                    <TableCell>{employee.agencyName ?? '-'}</TableCell>
                    <TableCell>
                      <Badge variant={employee.isActive ? "default" : "secondary"}>
                        {employee.isActive ? t('admin.employees.status.active') : t('admin.employees.status.inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(employee)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleToggleActive(employee)}>
                          {employee.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                    {t('admin.employees.list.empty')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}