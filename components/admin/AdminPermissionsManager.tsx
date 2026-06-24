'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Trash, Plus, ShieldCheck } from 'lucide-react'
import { ErrorToast } from '@/components/ui/error-toast'
import { useErrorToast } from '@/hooks/use-error-toast'
import usersService from '@/lib/api/services/usersService'
import { agenciesService } from '@/lib/api/services/dictionaryService'
import departmentsService, { Department } from '@/lib/api/services/departmentsService'
import adminPermissionsService, { AdminPermissionItem } from '@/lib/api/services/adminPermissionsService'
import type { UserListItem, DictionaryItem } from '@/lib/api/types'

export function AdminPermissionsManager() {
    const { error, showError, clearError } = useErrorToast()

    // Списки для выбора
    const [admins, setAdmins] = useState<UserListItem[]>([])
    const [agencies, setAgencies] = useState<DictionaryItem[]>([])
    const [departments, setDepartments] = useState<Department[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Выбранный Admin
    const [selectedAdminId, setSelectedAdminId] = useState<string>('')

    // Текущие разрешения выбранного Admin-а
    const [permissions, setPermissions] = useState<AdminPermissionItem[]>([])
    const [loadingPermissions, setLoadingPermissions] = useState(false)

    // Форма добавления нового разрешения
    const [newAgencyId, setNewAgencyId] = useState<string>('')
    const [newDepartmentId, setNewDepartmentId] = useState<string>('')
    const [newDepartments, setNewDepartments] = useState<Department[]>([])

    // Загружаем всех Admin-ов и агенции
    useEffect(() => {
        async function fetchInitialData() {
            try {
                setLoading(true)
                const [allUsers, allAgencies] = await Promise.all([
                    usersService.getAll(),
                    agenciesService.getActive(),
                ])
                // Фильтруем только пользователей с ролью Admin (не SuperAdmin)
                const adminUsers = allUsers.filter(u =>
                    u.roles?.includes('Admin') && u.isActive
                )
                setAdmins(adminUsers)
                setAgencies(allAgencies)
            } catch (err) {
                showError(err, 'Помилка завантаження даних')
            } finally {
                setLoading(false)
            }
        }
        fetchInitialData()
    }, [])

    // Загружаем разрешения когда выбран Admin
    useEffect(() => {
        if (!selectedAdminId) {
            setPermissions([])
            return
        }
        async function fetchPermissions() {
            try {
                setLoadingPermissions(true)
                const data = await adminPermissionsService.getByUser(Number(selectedAdminId))
                setPermissions(data.permissions)
            } catch (err) {
                showError(err, 'Помилка завантаження дозволів')
            } finally {
                setLoadingPermissions(false)
            }
        }
        fetchPermissions()
    }, [selectedAdminId])

    // Загружаем отделы при выборе агенции в форме
    useEffect(() => {
        if (!newAgencyId) {
            setNewDepartments([])
            setNewDepartmentId('')
            return
        }
        departmentsService.getActiveByAgency(Number(newAgencyId))
            .then(setNewDepartments)
            .catch(err => showError(err, 'Помилка завантаження відділів'))
    }, [newAgencyId])

    const handleAddPermission = () => {
        if (!newAgencyId || !newDepartmentId) return

        const agencyId = Number(newAgencyId)
        const departmentId = Number(newDepartmentId)

        // Проверяем дубли
        const alreadyExists = permissions.some(
            p => p.agencyId === agencyId && p.departmentId === departmentId
        )
        if (alreadyExists) {
            showError(null, 'Цей дозвіл вже додано')
            return
        }

        const agency = agencies.find(a => a.id === agencyId)
        const department = newDepartments.find(d => d.id === departmentId)
        if (!agency || !department) return

        setPermissions(prev => [...prev, {
            agencyId,
            agencyName: agency.name,
            departmentId,
            departmentName: department.name,
        }])

        // Сбрасываем форму
        setNewAgencyId('')
        setNewDepartmentId('')
        setNewDepartments([])
    }

    const handleRemovePermission = (agencyId: number, departmentId: number) => {
        setPermissions(prev =>
            prev.filter(p => !(p.agencyId === agencyId && p.departmentId === departmentId))
        )
    }

    const handleSave = async () => {
        if (!selectedAdminId) return
        try {
            setSaving(true)
            await adminPermissionsService.setPermissions(Number(selectedAdminId), {
                permissions: permissions.map(p => ({
                    agencyId: p.agencyId,
                    departmentId: p.departmentId,
                })),
            })
            // Показываем успех через временный state
            showError(null, '')
            alert('Дозволи збережено успішно') // заменим на toast в следующем шаге
        } catch (err) {
            showError(err, 'Помилка збереження дозволів')
        } finally {
            setSaving(false)
        }
    }

    const handleClearAll = async () => {
        if (!selectedAdminId) return
        if (!confirm('Ви впевнені що хочете видалити всі дозволи цього адміністратора?')) return
        try {
            setSaving(true)
            await adminPermissionsService.clearPermissions(Number(selectedAdminId))
            setPermissions([])
        } catch (err) {
            showError(err, 'Помилка очищення дозволів')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <Card>
                <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
                <CardContent className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                    ))}
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Права доступу адміністраторів</h1>
                <p className="text-muted-foreground">
                    Призначте адміністраторам доступ до звітів конкретних агенцій та відділів
                </p>
            </div>

            {/* Выбор Admin-а */}
            <Card>
                <CardHeader>
                    <CardTitle>Оберіть адміністратора</CardTitle>
                    <CardDescription>
                        Відображаються тільки активні користувачі з роллю Admin
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {admins.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                            Немає адміністраторів. Спочатку призначте роль Admin користувачу.
                        </p>
                    ) : (
                        <Select value={selectedAdminId} onValueChange={setSelectedAdminId}>
                            <SelectTrigger className="w-full md:w-80">
                                <SelectValue placeholder="Оберіть адміністратора..." />
                            </SelectTrigger>
                            <SelectContent>
                                {admins.map(admin => (
                                    <SelectItem key={admin.id} value={String(admin.id)}>
                                        {admin.name} — {admin.agencyName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </CardContent>
            </Card>

            {/* Управление разрешениями */}
            {selectedAdminId && (
                <>
                    {/* Текущие разрешения */}
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <ShieldCheck className="h-5 w-5 text-primary" />
                                        Поточні дозволи
                                    </CardTitle>
                                    <CardDescription>
                                        {admins.find(a => String(a.id) === selectedAdminId)?.name} має доступ до:
                                    </CardDescription>
                                </div>
                                {permissions.length > 0 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleClearAll}
                                        disabled={saving}
                                        className="text-destructive hover:text-destructive"
                                    >
                                        Очистити всі
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loadingPermissions ? (
                                <div className="space-y-2">
                                    {Array.from({ length: 2 }).map((_, i) => (
                                        <Skeleton key={i} className="h-10 w-full" />
                                    ))}
                                </div>
                            ) : permissions.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-4 text-center">
                                    Немає дозволів. Адміністратор не має доступу до жодного звіту.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {permissions.map(p => (
                                        <div
                                            key={`${p.agencyId}-${p.departmentId}`}
                                            className="flex items-center justify-between p-3 rounded-md border bg-muted/30"
                                        >
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Badge variant="outline">{p.agencyName}</Badge>
                                                <span className="text-muted-foreground text-sm">→</span>
                                                <Badge>{p.departmentName}</Badge>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleRemovePermission(p.agencyId, p.departmentId)}
                                                className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                                            >
                                                <Trash className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Форма добавления */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Додати дозвіл</CardTitle>
                            <CardDescription>Оберіть агенцію та відділ</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Select
                                    value={newAgencyId}
                                    onValueChange={v => { setNewAgencyId(v); setNewDepartmentId('') }}
                                >
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder="Оберіть агенцію..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {agencies.map(a => (
                                            <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select
                                    value={newDepartmentId}
                                    onValueChange={setNewDepartmentId}
                                    disabled={!newAgencyId || newDepartments.length === 0}
                                >
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder={
                                            !newAgencyId
                                                ? 'Спочатку оберіть агенцію'
                                                : newDepartments.length === 0
                                                    ? 'Немає відділів'
                                                    : 'Оберіть відділ...'
                                        } />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {newDepartments.map(d => (
                                            <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Button
                                    onClick={handleAddPermission}
                                    disabled={!newAgencyId || !newDepartmentId}
                                    className="gap-2 shrink-0"
                                >
                                    <Plus className="h-4 w-4" />
                                    Додати
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Кнопка сохранения */}
                    <div className="flex justify-end">
                        <Button onClick={handleSave} disabled={saving} size="lg">
                            {saving ? 'Збереження...' : 'Зберегти дозволи'}
                        </Button>
                    </div>
                </>
            )}

            <ErrorToast message={error} onClose={clearError} />
        </div>
    )
}