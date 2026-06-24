import { useState, useEffect, useMemo } from 'react'
import { useAuthContext } from '@/lib/AuthContext'
import adminPermissionsService, { AdminPermissionItem } from '@/lib/api/services/adminPermissionsService'

export interface AdminScope {
    isRestricted: boolean
    allowedAgencyIds: number[]
    allowedDepartmentIds: number[]
    permissions: AdminPermissionItem[]
    loading: boolean
}

export function useAdminScope(): AdminScope {
    const { user } = useAuthContext()
    const isSuperAdmin = user?.roles?.includes('SuperAdmin') ?? false
    const isAdmin = user?.roles?.includes('Admin') ?? false

    const [permissions, setPermissions] = useState<AdminPermissionItem[]>([])
    const [loading, setLoading] = useState(false)
    // Флаг чтобы не загружать повторно
    const [fetched, setFetched] = useState(false)

    useEffect(() => {
        if (isSuperAdmin || !isAdmin || fetched) return

        let cancelled = false

        async function fetchMyPermissions() {
            try {
                setLoading(true)
                const data = await adminPermissionsService.getMyPermissions()
                if (!cancelled) {
                    setPermissions(data.permissions)
                    setFetched(true)
                }
            } catch (err) {
                console.error('Failed to load admin permissions', err)
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        fetchMyPermissions()

        return () => { cancelled = true }
    }, [isSuperAdmin, isAdmin, fetched])

    const allowedAgencyIds = useMemo(
        () => [...new Set(permissions.map(p => p.agencyId))],
        [permissions]
    )

    const allowedDepartmentIds = useMemo(
        () => [...new Set(permissions.map(p => p.departmentId))],
        [permissions]
    )

    if (isSuperAdmin) {
        return {
            isRestricted: false,
            allowedAgencyIds: [],
            allowedDepartmentIds: [],
            permissions: [],
            loading: false,
        }
    }

    return {
        isRestricted: isAdmin,
        allowedAgencyIds,
        allowedDepartmentIds,
        permissions,
        loading,
    }
}