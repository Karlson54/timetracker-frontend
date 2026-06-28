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
    const { t } = useTranslation()
    const { error, showError, clearError } = useErrorToast()

    const [admins, setAdmins] = useState<UserListItem[]>([])
    const [agencies, setAgencies] = useState<DictionaryItem[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const [selectedAdminId, setSelectedAdminId] = useState<string>('')
    const [permissions, setPermissions] = useState<AdminPermissionItem[]>([])
    const [loadingPermissions, setLoadingPermissions] = useState(false)

    const [newAgencyId, setNewAgencyId] = useState<string>('')
    const [newDepartmentId, setNewDepartmentId] = useState<string>('')
    const [newDepartments, setNewDepartments] = useState<Department[]>([])
    const [saveSuccess, setSaveSuccess] = useState(false)

    useEffect(() => {
        async function fetchInitialData() {
            try {
                setLoading(true)
                const [allUsers, allAgencies] = await Promise.all([
                    usersService.getAll(),
                    agenciesService.getActive(),
                ])
                const adminUsers = allUsers.filter(u =>
                    u.roles?.includes('Admin') && u.isActive
                )
                setAdmins(adminUsers)
                setAgencies(allAgencies)
            } catch (err) {
                showError(err, t('adminPermissions.errors.loadFailed'))
            } finally {
                setLoading(false)
            }
        }
        fetchInitialData()
    }, [])

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
                showError(err, t('adminPermissions.errors.permissionsFailed'))
            } finally {
                setLoadingPermissions(false)
            }
        }
        fetchPermissions()
    }, [selectedAdminId])

    useEffect(() => {
        if (!newAgencyId) {
            setNewDepartments([])
            setNewDepartmentId('')
            return
        }
        departmentsService.getActiveByAgency(Number(newAgencyId))
            .then(setNewDepartments)
            .catch(err => showError(err, t('adminPermissions.errors.departmentsFailed')))
    }, [newAgencyId])

    const handleAddPermission = () => {
        if (!newAgencyId || !newDepartmentId) return

        const agencyId = Number(newAgencyId)
        const departmentId = Number(newDepartmentId)

        const alreadyExists = permissions.some(
            p => p.agencyId === agencyId && p.departmentId === departmentId
        )
        if (alreadyExists) {
            showError(null, t('adminPermissions.addPermission.duplicate'))
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
            setSaveSuccess(false)
            await adminPermissionsService.setPermissions(Number(selectedAdminId), {
                permissions: permissions.map(p => ({
                    agencyId: p.agencyId,
                    departmentId: p.departmentId,
                })),
            })
            setSaveSuccess(true)
            setTimeout(() => setSaveSuccess(false), 3000)
        } catch (err) {
            showError(err, t('adminPermissions.errors.saveFailed'))
        } finally {
            setSaving(false)
        }
    }

    const handleClearAll = async () => {
        if (!selectedAdminId) return
        if (!confirm(t('adminPermissions.currentPermissions.confirmClear'))) return
        try {
            setSaving(true)
            await adminPermissionsService.clearPermissions(Number(selectedAdminId))
            setPermissions([])
        } catch (err) {
            showError(err, t('adminPermissions.errors.clearFailed'))
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

    const selectedAdmin = admins.find(a => String(a.id) === selectedAdminId)

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{t('adminPermissions.title')}</h1>
                <p className="text-muted-foreground">{t('adminPermissions.description')}</p>
            </div>

            {/* Вибір адміністратора */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('adminPermissions.selectAdmin.title')}</CardTitle>
                    <CardDescription>{t('adminPermissions.selectAdmin.description')}</CardDescription>
                </CardHeader>
                <CardContent>
                    {admins.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                            {t('adminPermissions.selectAdmin.noAdmins')}
                        </p>
                    ) : (
                        <Select value={selectedAdminId} onValueChange={setSelectedAdminId}>
                            <SelectTrigger className="w-full md:w-80">
                                <SelectValue placeholder={t('adminPermissions.selectAdmin.placeholder')} />
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

            {/* Управління дозволами */}
            {selectedAdminId && (
                <>
                    {/* Поточні дозволи */}
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <ShieldCheck className="h-5 w-5 text-primary" />
                                        {t('adminPermissions.currentPermissions.title')}
                                    </CardTitle>
                                    <CardDescription>
                                        {t('adminPermissions.currentPermissions.description', {
                                            name: selectedAdmin?.name ?? ''
                                        })}
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
                                        {t('adminPermissions.currentPermissions.clearAll')}
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
                                    {t('adminPermissions.currentPermissions.noPermissions')}
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

                    {/* Форма додавання */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('adminPermissions.addPermission.title')}</CardTitle>
                            <CardDescription>{t('adminPermissions.addPermission.description')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Select
                                    value={newAgencyId}
                                    onValueChange={v => { setNewAgencyId(v); setNewDepartmentId('') }}
                                >
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder={t('adminPermissions.addPermission.selectAgency')} />
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
                                                ? t('adminPermissions.addPermission.selectAgencyFirst')
                                                : newDepartments.length === 0
                                                    ? t('adminPermissions.addPermission.noDepartments')
                                                    : t('adminPermissions.addPermission.selectDepartment')
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
                                    {t('adminPermissions.addPermission.add')}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Кнопка збереження */}
                    <div className="flex justify-end items-center gap-3">
                        {saveSuccess && (
                            <p className="text-sm text-emerald-600 dark:text-emerald-400">
                                {t('adminPermissions.saveSuccess')}
                            </p>
                        )}
                        <Button onClick={handleSave} disabled={saving} size="lg">
                            {saving ? t('adminPermissions.saving') : t('adminPermissions.save')}
                        </Button>
                    </div>
                </>
            )}

            <ErrorToast message={error} onClose={clearError} />
        </div>
    )
}