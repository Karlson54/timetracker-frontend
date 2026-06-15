'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { TimeEntryListItem } from '@/lib/api/types'
import { msToHours } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

interface EntriesTableProps {
  entries: TimeEntryListItem[]
  loading?: boolean
  emptyText?: string
}

export function EntriesTable({ entries, loading, emptyText }: EntriesTableProps) {
  const { t } = useTranslation()

  return (
    <div className="overflow-x-auto">
      {loading && (
        <div className="text-center py-2 text-sm text-muted-foreground">
          {t('loading')}
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Agency</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Market</TableHead>
            <TableHead>Contracting Agency / Unit</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Project / brand</TableHead>
            <TableHead>Media</TableHead>
            <TableHead>Job type</TableHead>
            <TableHead>Hours</TableHead>
            <TableHead>Comments</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.length === 0 && !loading ? (
            <TableRow>
              <TableCell colSpan={12} className="text-center text-muted-foreground">
                {emptyText ?? t('common.noData')}
              </TableCell>
            </TableRow>
          ) : (
            entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="whitespace-nowrap">{entry.agencyName || "—"}</TableCell>
                <TableCell className="whitespace-nowrap">{entry.departmentName || "—"}</TableCell>
                <TableCell className="whitespace-nowrap">{entry.userName || "—"}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {new Date(entry.entryDate).toLocaleDateString('uk-UA', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                  })}
                </TableCell>
                <TableCell>{entry.marketName || "—"}</TableCell>
                <TableCell>{entry.contractingAgencyName || "—"}</TableCell>
                <TableCell>{entry.clientName || "—"}</TableCell>
                <TableCell>{entry.projectBrandName || "—"}</TableCell>
                <TableCell>{entry.mediaName || "—"}</TableCell>
                <TableCell>{entry.jobTypeName || "—"}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {msToHours(entry.hoursMilliseconds).toFixed(1)}
                </TableCell>
                <TableCell className="max-w-[200px] truncate" title={entry.comments ?? ""}>
                  {entry.comments || "—"}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}