"use client"

import { useState, useEffect, useCallback } from "react"
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
import { Pencil, Plus, Search, UserCheck, UserX } from "lucide-react"
import { useTranslation } from "react-i18next"
import usersService from "@/lib/api/services/usersService"
import { agenciesService } from "@/lib/api/services/dictionaryService"
import rolesService from "@/lib/api/services/rolesService"
import type { UserListItem, CreateUserRequest, UpdateUserRequest, DictionaryItem, RoleItem } from "@/lib/api/types"
import { ErrorToast } from '@/components/ui/error-toast'
import { useErrorToast } from '@/hooks/use-error-toast'
import departmentsService, { Department } from '@/lib/api/services/departmentsService'

const PAGE_SIZE = 15

function FormRow({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-4 items-center gap-4">
      <Label className="text-right">{label}</Label>
      <div className="col-span-3">{children}</div>
    </div>
  )
}

const EMPTY_CREATE: CreateUserRequest = {
  login: "",
  email: "",
  name: "",
  password: "",
  confirmPassword: "",
  agencyId: 0,
  departmentId: 0,
  roleIds: [],
}

export function EmployeesList() {
  const { t } = useTranslation()

  const [employees, setEmployees] = useState<UserListItem[]>([])
  const [agencies, setAgencies] = useState<DictionaryItem[]>([])
  const [roles, setRoles] = useState<RoleItem[]>([])
  const [loading, setLoading] = useState(true)
  const { error, showError, clearError } = useErrorToast()
  const [searchTerm, setSearchTerm] = useState("")

  // Пагінація
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const [newEmployee, setNewEmployee] = useState<CreateUserRequest>(EMPTY_CREATE)
  const [editingEmployee, setEditingEmployee] = useState<UserListItem | null>(null)
  const [editForm, setEditForm] = useState<UpdateUserRequest>({ email: "", name: "", agencyId: 0 })
  const [employeeToDelete, setEmployeeToDelete] = useState<number | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [passwordError, setPasswordError] = useState("")

  const [departments, setDepartments] = useState<Department[]>([])
  const [editDepartments, setEditDepartments] = useState<Department[]>([])

  // Скидаємо сторінку при зміні пошуку
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  // Завантаження співробітників з пагінацією
  useEffect(() => {
    async function fetchEmployees() {
      try {
        setLoading(true)
        const result = await usersService.getPaged(currentPage, PAGE_SIZE, searchTerm || undefined)
        setEmployees(result.data)
        setTotalCount(result.totalCount)
        setTotalPages(result.totalPages)
      } catch (err: any) {
        showError(err, t('common.errors.saveFailed'))
      } finally {
        setLoading(false)
      }
    }
    fetchEmployees()
  }, [currentPage, searchTerm])

  // Завантаження довідників один раз
  useEffect(() => {
    async function fetchDicts() {
      try {
        const [activeAgencies, activeRoles] = await Promise.all([
          agenciesService.getActive(),
          rolesService.getActive(),
        ])
        setAgencies(activeAgencies)
        setRoles(activeRoles)
      } catch (err: any) {
        showError(err, t('common.errors.saveFailed'))
      }
    }
    fetchDicts()
  }, [])

  const activeSuperAdminCount = employees.filter(
    (e) => e.isActive && e.roles?.includes('SuperAdmin')
  ).length

  const refreshCurrentPage = useCallback(async () => {
    try {
      const result = await usersService.getPaged(currentPage, PAGE_SIZE, searchTerm || undefined)
      setEmployees(result.data)
      setTotalCount(result.totalCount)
      setTotalPages(result.totalPages)
    } catch (err: any) {
      showError(err, t('common.errors.saveFailed'))
    }
  }, [currentPage, searchTerm])

  useEffect(() => {
    if (!newEmployee.agencyId) {
      setDepartments([])
      return
    }
    departmentsService.getActiveByAgency(newEmployee.agencyId)
      .then(setDepartments)
      .catch(err => showError(err))
  }, [newEmployee.agencyId])

  const handleAdd = async () => {
    if (!newEmployee.name || !newEmployee.email || !newEmployee.login || !newEmployee.password || !newEmployee.agencyId || !newEmployee.departmentId || newEmployee.roleIds.length === 0) return

    if (newEmployee.password !== newEmployee.confirmPassword) {
      setPasswordError(t('admin.employees.errors.passwordMismatch'))
      return
    }

    setPasswordError("")
    try {
      setSubmitting(true)
      await usersService.create(newEmployee)
      setNewEmployee(EMPTY_CREATE)
      setIsAddDialogOpen(false)
      await refreshCurrentPage()
    } catch (err: any) {
      showError(err)
    } finally {
      setSubmitting(false)
    }
  }

  const openEdit = (employee: UserListItem) => {
    console.log('employee.roles:', employee.roles)
    console.log('roles state:', roles)

    const currentRoleName = employee.roles?.[0]
    const currentRole = roles.find((r) => r.name === currentRoleName)
    console.log('matched role:', currentRole)

    setEditingEmployee(employee)
    setEditForm({
      email: employee.email,
      name: employee.name,
      agencyId: employee.agencyId,
      login: employee.login,
      newPassword: "",
      roleIds: currentRole ? [currentRole.id] : [],
      departmentId: employee.departmentId,
    })
    departmentsService.getActiveByAgency(employee.agencyId)
      .then(setEditDepartments)
      .catch(err => showError(err))
    setIsEditDialogOpen(true)
  }

  const handleEdit = async () => {
    if (!editingEmployee) return

    if (!editForm.departmentId) {
      showError(null, t('admin.employees.errors.departmentRequired'))
      return
    }
    try {
      setSubmitting(true)
      const payload: UpdateUserRequest = {
        email: editForm.email,
        name: editForm.name,
        agencyId: editForm.agencyId,
        login: editForm.login || undefined,
        newPassword: editForm.newPassword || undefined,
        roleIds: editForm.roleIds?.length ? editForm.roleIds : undefined,
        departmentId: editForm.departmentId || undefined,
      }
      await usersService.update(editingEmployee.id, payload)
      setIsEditDialogOpen(false)
      await refreshCurrentPage()
    } catch (err: any) {
      showError(err)
    } finally {
      setSubmitting(false)
    }
  }

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
      showError(err)
    }
  }

  const confirmDelete = (id: number) => {
    setEmployeeToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!employeeToDelete) return
    try {
      setSubmitting(true)
      await usersService.deactivate(employeeToDelete)
      setIsDeleteDialogOpen(false)
      await refreshCurrentPage()
    } catch (err: any) {
      showError(err)
    } finally {
      setSubmitting(false)
      setEmployeeToDelete(null)
    }
  }

  if (loading && employees.length === 0) {
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
            <FormRow label={t('admin.employees.fields.name')}>
              <Input value={newEmployee.name} onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })} />
            </FormRow>
            <FormRow label={t('admin.employees.fields.login')}>
              <Input value={newEmployee.login} onChange={(e) => setNewEmployee({ ...newEmployee, login: e.target.value })} />
            </FormRow>
            <FormRow label={t('admin.employees.fields.email')}>
              <Input type="email" value={newEmployee.email} onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })} />
            </FormRow>
            <FormRow label={t('admin.employees.fields.password')}>
              <Input type="password" value={newEmployee.password} onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })} />
            </FormRow>
            <FormRow label={t('admin.employees.fields.confirmPassword')}>
              <div>
                <Input
                  type="password"
                  value={newEmployee.confirmPassword}
                  onChange={(e) => {
                    setNewEmployee({ ...newEmployee, confirmPassword: e.target.value })
                    setPasswordError("")
                  }}
                />
                {passwordError && (
                  <p className="text-sm text-destructive mt-1">{passwordError}</p>
                )}
              </div>
            </FormRow>
            <FormRow label={t('admin.employees.fields.agency')}>
              <Select value={String(newEmployee.agencyId || "")} onValueChange={v => setNewEmployee({
                ...newEmployee,
                agencyId: Number(v),
                departmentId: 0
              })}>
                <SelectTrigger>
                  <SelectValue placeholder={t('admin.employees.fields.selectAgency')} />
                </SelectTrigger>
                <SelectContent>
                  {agencies.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormRow>
            <FormRow label={t('admin.employees.fields.department')}>
              <Select
                value={String(newEmployee.departmentId || "")}
                onValueChange={v => setNewEmployee({ ...newEmployee, departmentId: Number(v) })}
                disabled={!newEmployee.agencyId || departments.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    !newEmployee.agencyId
                      ? t('admin.employees.fields.selectAgencyFirst')
                      : t('admin.employees.fields.selectDepartment')
                  } />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(d => (
                    <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormRow>
            <FormRow label={t('admin.employees.fields.role')}>
              <Select
                value={String(newEmployee.roleIds[0] ?? "")}
                onValueChange={(v) => setNewEmployee({ ...newEmployee, roleIds: [Number(v)] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('admin.employees.fields.selectRole')} />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormRow>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddDialogOpen(false)
              setPasswordError("")
              setNewEmployee(EMPTY_CREATE)
            }}>
              {t('common.cancel')}
            </Button>
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
            <FormRow label={t('admin.employees.fields.name')}>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </FormRow>
            <FormRow label={t('admin.employees.fields.email')}>
              <Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
            </FormRow>
            <FormRow label={t('admin.employees.fields.agency')}>
              <Select value={String(editForm.agencyId || "")} onValueChange={async v => {
                const agencyId = Number(v)
                setEditForm({ ...editForm, agencyId, departmentId: 0 })
                try {
                  const deps = await departmentsService.getActiveByAgency(agencyId)
                  setEditDepartments(deps)
                } catch (err) {
                  showError(err)
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder={t('admin.employees.fields.selectAgency')} />
                </SelectTrigger>
                <SelectContent>
                  {agencies.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormRow>
            <FormRow label={t('admin.employees.fields.department')}>
              <Select
                value={String(editForm.departmentId || "")}
                onValueChange={v => setEditForm({ ...editForm, departmentId: Number(v) })}
                disabled={editDepartments.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('admin.employees.fields.selectDepartment')} />
                </SelectTrigger>
                <SelectContent>
                  {editDepartments.map(d => (
                    <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormRow>
            <FormRow label={t('admin.employees.fields.login')}>
              <Input value={editForm.login ?? ""} onChange={(e) => setEditForm({ ...editForm, login: e.target.value })} />
            </FormRow>
            <FormRow label={t('admin.employees.fields.password')}>
              <div>
                <Input
                  type="password"
                  placeholder={t('admin.employees.edit.passwordPlaceholder')}
                  value={editForm.newPassword ?? ""}
                  onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t('admin.employees.edit.passwordNote')}
                </p>
              </div>
            </FormRow>
            <FormRow label={t('admin.employees.fields.role')}>
              <Select
                value={String(editForm.roleIds?.[0] ?? "")}
                onValueChange={(v) => setEditForm({ ...editForm, roleIds: v ? [Number(v)] : [] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('admin.employees.fields.selectRole')} />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormRow>
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
              <CardDescription>{t('admin.employees.list.description', { count: totalCount })}</CardDescription>
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
                <TableHead>{t('admin.employees.tableHeaders.role')}</TableHead>
                <TableHead>{t('admin.employees.tableHeaders.agency')}</TableHead>
                <TableHead>{t('admin.employees.tableHeaders.department')}</TableHead>
                <TableHead>{t('admin.employees.tableHeaders.status')}</TableHead>
                <TableHead className="text-right">{t('admin.employees.tableHeaders.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}><Skeleton className="h-8 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : employees.length > 0 ? (
                employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.name}</TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>{employee.roles?.[0] ?? '-'}</TableCell>
                    <TableCell>{employee.agencyName ?? '-'}</TableCell>
                    <TableCell>{employee.departmentName || '-'}</TableCell>
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
                        {(() => {
                          const isLastSuperAdmin =
                            employee.isActive &&
                            employee.roles?.includes('SuperAdmin') &&
                            activeSuperAdminCount <= 1

                          return (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => !isLastSuperAdmin && handleToggleActive(employee)}
                              disabled={isLastSuperAdmin}
                              title={
                                isLastSuperAdmin
                                  ? t('admin.employees.errors.lastAdmin')
                                  : employee.isActive
                                    ? t('common.deactivate')
                                    : t('common.activate')
                              }
                            >
                              {employee.isActive
                                ? <UserX className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                                : <UserCheck className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                              }
                            </Button>
                          )
                        })()}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                    {t('admin.employees.list.empty')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Пагінація у стилі звітів */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500">
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
      <ErrorToast message={error} onClose={clearError} />
    </>
  )
}