"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { useTranslation } from "react-i18next"

interface Employee {
  id: number;
  name: string;
  email: string;
  position: string;
  department: string;
  status: string;
}

export function EmployeeOverview() {
  const { t } = useTranslation()
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRanges, setDateRanges] = useState<Record<number, { start: string, end: string }>>({});

  // Get today's date and one month ago for default date range
  const today = new Date();
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  useEffect(() => {
    setLoading(false)
  }, [])

  const handleDateChange = (employeeId: number, field: 'start' | 'end', value: string) => {
    setDateRanges(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [field]: value
      }
    }));
  };

  if (loading) {
    return <div>{t('admin.employees.overview.loading')}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('admin.employees.overview.title')}</CardTitle>
        <CardDescription>{t('admin.employees.overview.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('admin.employees.overview.employee')}</TableHead>
              <TableHead>{t('admin.employees.overview.reportPeriod')}</TableHead>
              <TableHead>{t('admin.employees.overview.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center">{t('admin.employees.overview.noEmployees')}</TableCell>
              </TableRow>
            ) : (
              employees.map((employee) => (
                <TableRow key={employee.id} data-employee-id={employee.id}>
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={dateRanges[employee.id]?.start || formatDate(oneMonthAgo)}
                        onChange={(e) => handleDateChange(employee.id, 'start', e.target.value)}
                        className="border rounded px-2 py-1 text-sm"
                      />
                      <span>—</span>
                      <input
                        type="date"
                        value={dateRanges[employee.id]?.end || formatDate(today)}
                        onChange={(e) => handleDateChange(employee.id, 'end', e.target.value)}
                        className="border rounded px-2 py-1 text-sm"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => downloadEmployeeReport(
                        employee.id,
                        dateRanges[employee.id]?.start || formatDate(oneMonthAgo),
                        dateRanges[employee.id]?.end || formatDate(today)
                      )}
                    >
                      <Download className="h-4 w-4" />
                      <span>{t('admin.employees.overview.excel')}</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

// Function to download an employee report in Excel format
function downloadEmployeeReport(employeeId: number, startDate: string, endDate: string) {
  // In a real app this would be code to generate and download an Excel file
  console.log(`Downloading report for employee ID: ${employeeId} for the period ${startDate} - ${endDate}`)
  alert(`Report for employee ID: ${employeeId} for the period ${startDate} - ${endDate} is downloading...`)
}
