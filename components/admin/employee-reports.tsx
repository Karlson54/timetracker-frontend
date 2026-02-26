"use client"

import httpClient from '@/lib/api/httpClient'
import usersService from "@/lib/api/services/usersService"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/date-range-picker"
import { Download, FileSpreadsheet } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useTranslation } from "react-i18next"

interface Employee {
  id: number;
  name: string;
  email: string;
  position: string;
  department: string;
  agency: string;
}

interface Report {
  id: number;
  employee: string;
  employeeId: number;
  period: string;
  totalHours: number;
  projects: number;
  efficiency: number;
  status: string;
  date: string;
  reportDate: Date;
  market: string;
  contractingAgency: string;
  client: string | { id: number; name: string };
  clientName?: string;
  projectBrand: string;
  media: string;
  jobType: string;
  comments: string;
  hours: number;
  company: string;
}

export function EmployeeReports() {
  const { t } = useTranslation()
  const [selectedEmployee, setSelectedEmployee] = useState("all")
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(1)), // First day of current month
    to: new Date(), // Today
  })

  const [showDownloadDialog, setShowDownloadDialog] = useState(false)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [previewReports, setPreviewReports] = useState<Report[]>([])
  const [selectedColumns, setSelectedColumns] = useState({
    market: true,
    contractingAgency: true,
    client: true,
    projectBrand: true,
    media: true,
    jobType: true,
    comments: true,
    hours: true,
    date: true,
    fullName: true,
    company: true,
  })

  const [reports, setReports] = useState<Report[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)

        // Завантажуємо працівників
        const usersRes = await usersService.getAll()
        setEmployees(usersRes.map((u: any) => ({
          id: u.id,
          name: u.name,
          email: u.email ?? '',
          position: u.position ?? '',
          department: u.department ?? '',
          agency: u.agencyName ?? '',
        })))

        const timeEntriesRes = await httpClient.get<any>('/api/timeentries', {
          params: {
            fromDate: new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1).toISOString(),
            toDate: new Date().toISOString(),
            pageSize: 500,
            pageNumber: 1,
          }
        })

        const entries = timeEntriesRes.data?.entries ?? timeEntriesRes.data ?? []

        const mapped = entries.map((rd: any) => {
          const reportDate = new Date(rd.entryDate)
          const formattedDate = reportDate.toLocaleDateString('uk-UA', {
            day: '2-digit', month: '2-digit', year: 'numeric',
          })
          return {
            id: rd.id,
            date: formattedDate,
            reportDate: reportDate,
            totalHours: rd.hoursMilliseconds / 3600000,
            hours: rd.hoursMilliseconds / 3600000,
            employee: rd.userName || 'Unknown',
            companies: [rd.contractingAgencyName, rd.clientName].filter(Boolean).join(', '),
            employeeId: rd.userId,
            employeeName: rd.userName || 'Unknown',
            market: rd.marketName || '-',
            agency: rd.agencyName || '-',
            projectBrand: rd.projectBrandName || '-',
            media: rd.mediaName || '-',
            jobType: rd.jobTypeName || '-',
            comments: rd.comments || '-',
            contractingAgency: rd.contractingAgencyName || '-',
            client: rd.clientName || '-',
            company: rd.agencyName || '-',
            tasks: [{ company: rd.clientName || '', description: rd.jobTypeName || '', hours: rd.hoursMilliseconds / 3600000 }],
          }
        })
        setReports(mapped)
      } catch (error) {
        console.error('Error fetching reports data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Filter reports based on employee and date range
  const filteredReports = reports
    .filter(report => {
      // First filter by employee
      if (selectedEmployee !== "all" && report.employeeId !== Number.parseInt(selectedEmployee)) {
        return false;
      }

      // Then filter by date range if we have a complete date range
      if (dateRange.from && dateRange.to) {
        // Parse the date string to a Date object if we don't have reportDate
        const reportDate = report.reportDate || new Date(report.date.split('.').reverse().join('-'));

        // Set hours to 0 for accurate date comparison (ignore time)
        const fromDate = new Date(dateRange.from);
        fromDate.setHours(0, 0, 0, 0);

        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999); // End of the day

        return reportDate >= fromDate && reportDate <= toDate;
      }

      return true;
    });

  // Функція для завантаження звіту з вибраними стовпцями
  const handleDownloadWithColumns = async () => {
    if (filteredReports.length === 0) {
      alert(t('admin.reports.filters.noReportsToDownload'))
      return
    }

    setIsDownloading(true)
    try {
      const columnsParam = Object.entries(selectedColumns)
        .filter(([, enabled]) => enabled)
        .map(([key]) => {
          const keyMap: Record<string, string> = {
            company: 'agency',
            fullName: 'fullname',
            date: 'date',
            market: 'market',
            contractingAgency: 'contractingagency',
            client: 'client',
            projectBrand: 'projectbrand',
            media: 'media',
            jobType: 'jobtype',
            hours: 'hours',
            comments: 'comments',
          }
          return keyMap[key] ?? key
        })
        .join(',')

      const fromStr = dateRange.from.toLocaleDateString('uk-UA').replace(/\./g, '-')
      const toStr = dateRange.to.toLocaleDateString('uk-UA').replace(/\./g, '-')

      let url: string
      let fileName: string

      if (selectedEmployee === "all") {
        url = `/api/reports/export/flat`
        fileName = `AllReports_${fromStr}_${toStr}.xlsx`
      } else {
        const userId = Number.parseInt(selectedEmployee)
        const emp = employees.find(e => e.id === userId)
        const empName = emp ? emp.name.replace(/\s+/g, '_') : `user_${userId}`
        url = `/api/reports/user/${userId}/export/flat`
        fileName = `Report_${empName}_${fromStr}_${toStr}.xlsx`
      }

      const response = await httpClient.get(url, {
        params: {
          fromDate: dateRange.from.toISOString(),
          toDate: dateRange.to.toISOString(),
          columns: columnsParam,
          locale: 'uk',
        },
        responseType: 'blob',
      })

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = fileName
      a.click()
      URL.revokeObjectURL(blobUrl)

      setShowDownloadDialog(false)
    } catch (error) {
      console.error(t('admin.reports.errors.downloadError'), error)
      alert(t('admin.reports.errors.excelCreationError'))
    } finally {
      setIsDownloading(false)
    }
  }

  // Функция для скачивания всех отчетов в Excel формате
  const downloadAllReports = async () => {
    if (reports.length === 0) {
      alert(t('admin.reports.filters.noReportsToDownload'))
      return
    }
    const firstReport = reports[0]
    setSelectedReport(firstReport)
    setPreviewReports(reports.filter(r => r.id !== firstReport.id))
    setShowDownloadDialog(true)
  }

  // Function to download a report
  const downloadReportFromBackend = async () => {
    if (filteredReports.length === 0) {
      alert(t('admin.reports.filters.noReportsToDownload'))
      return
    }
    const firstReport = filteredReports[0]
    setSelectedReport(firstReport)
    setPreviewReports(filteredReports.filter(r => r.id !== firstReport.id))
    setShowDownloadDialog(true)
  }

  if (loading) {
    return <div>Loading employee reports...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('admin.reports.title')}</h1>
          <p className="text-gray-500">{t('admin.reports.description')}</p>
        </div>
        <Button onClick={downloadAllReports} className="gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          {t('admin.reports.exportAllToExcel')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('admin.reports.filters.title')}</CardTitle>
          <CardDescription>{t('admin.reports.filters.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">{t('admin.reports.filters.employee')}</label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder={t('admin.reports.filters.selectEmployee')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('admin.reports.filters.allEmployees')}</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id.toString()}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="text-sm font-medium mb-2 block">{t('admin.reports.filters.period')}</label>
              <div className="flex gap-2">
                <div className="flex-grow">
                  <DatePickerWithRange
                    date={{
                      from: dateRange.from,
                      to: dateRange.to
                    }}
                    setDate={(value) => {
                      if (value?.from && value?.to) {
                        setDateRange({
                          from: value.from,
                          to: value.to
                        });
                      }
                    }}
                  />
                </div>
                <Button variant="outline" size="sm" className="gap-2 self-end" onClick={downloadReportFromBackend}>
                  <Download className="h-4 w-4" />
                  <span>{t('admin.reports.filters.downloadReport')}</span>
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-4 gap-2">
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="summary">
        <TabsList>
          <TabsTrigger value="summary">{t('admin.reports.tabs.summary')}</TabsTrigger>
          <TabsTrigger value="detailed">{t('admin.reports.tabs.detailed')}</TabsTrigger>
        </TabsList>
        <TabsContent value="summary" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.reports.summary.summaryTitle')}</CardTitle>
              <CardDescription>{t('admin.reports.summary.summaryDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Agency</TableHead>
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
                  {filteredReports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center">
                        {t('admin.reports.summary.noReportsAvailable')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.employee}</TableCell>
                        <TableCell>{report.company}</TableCell>
                        <TableCell>{report.date}</TableCell>
                        <TableCell>{report.market}</TableCell>
                        <TableCell>{report.contractingAgency}</TableCell>
                        <TableCell>{typeof report.client === 'object' ? report.client.name : report.clientName || report.client}</TableCell>
                        <TableCell>{report.projectBrand}</TableCell>
                        <TableCell>{report.media}</TableCell>
                        <TableCell>{report.jobType}</TableCell>
                        <TableCell>{report.hours}</TableCell>
                        <TableCell>{report.comments}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="detailed" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.reports.detailed.title')}</CardTitle>
              <CardDescription>{t('admin.reports.detailed.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                {t('admin.reports.detailed.selectEmployeeMessage')}
              </p>
              {selectedEmployee !== "all" ? (
                <div className="space-y-6">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-2">{t('admin.reports.detailed.timeDistribution')}</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{t('admin.reports.detailed.rebranding')}</span>
                          <span>24h (30%)</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full" style={{ width: "30%" }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{t('admin.reports.detailed.marketingCampaign')}</span>
                          <span>18h (22%)</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full" style={{ width: "22%" }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{t('admin.reports.detailed.websiteDevelopment')}</span>
                          <span>32h (40%)</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full" style={{ width: "40%" }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{t('admin.reports.detailed.otherTasks')}</span>
                          <span>6h (8%)</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full" style={{ width: "8%" }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('admin.reports.detailed.date')}</TableHead>
                        <TableHead>{t('admin.reports.detailed.project')}</TableHead>
                        <TableHead>{t('admin.reports.detailed.task')}</TableHead>
                        <TableHead>{t('admin.reports.detailed.hours')}</TableHead>
                        <TableHead>{t('admin.reports.detailed.comment')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReports.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center">
                            {t('admin.reports.summary.noReportsAvailable')}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredReports.map((report) => (
                          <TableRow key={report.id}>
                            <TableCell>{report.date}</TableCell>
                            <TableCell>{report.projectBrand}</TableCell>
                            <TableCell>{report.jobType}</TableCell>
                            <TableCell>{report.hours}</TableCell>
                            <TableCell>{report.comments}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>

                  <div className="flex justify-end">
                    <Button onClick={downloadReportFromBackend} className="gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      {t('admin.reports.detailed.exportToExcel')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <FileSpreadsheet className="h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium mb-1">{t('admin.reports.detailed.selectEmployeeTitle')}</h3>
                  <p className="text-muted-foreground">
                    {t('admin.reports.detailed.selectEmployeeHint')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog for column selection and preview */}
      <Dialog open={showDownloadDialog} onOpenChange={setShowDownloadDialog}>
        <DialogContent className="sm:max-w-4xl max-h-screen flex flex-col">
          <DialogHeader>
            <DialogTitle>{t('admin.reports.downloadDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('admin.reports.downloadDialog.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-row flex-wrap gap-4 py-4 overflow-y-auto">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="company-checkbox"
                checked={selectedColumns.company}
                onCheckedChange={(checked) =>
                  setSelectedColumns({ ...selectedColumns, company: !!checked })
                }
              />
              <label htmlFor="company-checkbox" className="text-sm font-medium">
                {t('admin.reports.tableHeaders.agency')}
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="fullName-checkbox"
                checked={selectedColumns.fullName}
                onCheckedChange={(checked) =>
                  setSelectedColumns({ ...selectedColumns, fullName: !!checked })
                }
              />
              <label htmlFor="fullName-checkbox" className="text-sm font-medium">
                {t('admin.reports.tableHeaders.name')}
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="date-checkbox"
                checked={selectedColumns.date}
                onCheckedChange={(checked) =>
                  setSelectedColumns({ ...selectedColumns, date: !!checked })
                }
              />
              <label htmlFor="date-checkbox" className="text-sm font-medium">
                {t('admin.reports.tableHeaders.date')}
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="market-checkbox"
                checked={selectedColumns.market}
                onCheckedChange={(checked) =>
                  setSelectedColumns({ ...selectedColumns, market: !!checked })
                }
              />
              <label htmlFor="market-checkbox" className="text-sm font-medium">
                {t('admin.reports.tableHeaders.market')}
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="contractingAgency-checkbox"
                checked={selectedColumns.contractingAgency}
                onCheckedChange={(checked) =>
                  setSelectedColumns({ ...selectedColumns, contractingAgency: !!checked })
                }
              />
              <label htmlFor="contractingAgency-checkbox" className="text-sm font-medium">
                {t('admin.reports.tableHeaders.contractingAgency')}
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="client-checkbox"
                checked={selectedColumns.client}
                onCheckedChange={(checked) =>
                  setSelectedColumns({ ...selectedColumns, client: !!checked })
                }
              />
              <label htmlFor="client-checkbox" className="text-sm font-medium">
                {t('admin.reports.tableHeaders.client')}
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="projectBrand-checkbox"
                checked={selectedColumns.projectBrand}
                onCheckedChange={(checked) =>
                  setSelectedColumns({ ...selectedColumns, projectBrand: !!checked })
                }
              />
              <label htmlFor="projectBrand-checkbox" className="text-sm font-medium">
                {t('admin.reports.tableHeaders.projectBrand')}
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="media-checkbox"
                checked={selectedColumns.media}
                onCheckedChange={(checked) =>
                  setSelectedColumns({ ...selectedColumns, media: !!checked })
                }
              />
              <label htmlFor="media-checkbox" className="text-sm font-medium">
                {t('admin.reports.tableHeaders.media')}
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="jobType-checkbox"
                checked={selectedColumns.jobType}
                onCheckedChange={(checked) =>
                  setSelectedColumns({ ...selectedColumns, jobType: !!checked })
                }
              />
              <label htmlFor="jobType-checkbox" className="text-sm font-medium">
                {t('admin.reports.tableHeaders.jobType')}
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hours-checkbox"
                checked={selectedColumns.hours}
                onCheckedChange={(checked) =>
                  setSelectedColumns({ ...selectedColumns, hours: !!checked })
                }
              />
              <label htmlFor="hours-checkbox" className="text-sm font-medium">
                {t('admin.reports.tableHeaders.hours')}
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="comments-checkbox"
                checked={selectedColumns.comments}
                onCheckedChange={(checked) =>
                  setSelectedColumns({ ...selectedColumns, comments: !!checked })
                }
              />
              <label htmlFor="comments-checkbox" className="text-sm font-medium">
                {t('admin.reports.tableHeaders.comments')}
              </label>
            </div>
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: "350px" }}>
            <h3 className="font-medium mb-2">
              {t('admin.reports.downloadDialog.tablePreview')} ({previewReports.length + (selectedReport ? 1 : 0)} {t('admin.reports.downloadDialog.reports')})
            </h3>
            {selectedReport && (
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    {selectedColumns.company && <TableHead>{t('admin.reports.tableHeaders.agency')}</TableHead>}
                    {selectedColumns.fullName && <TableHead>{t('admin.reports.tableHeaders.name')}</TableHead>}
                    {selectedColumns.date && <TableHead>{t('admin.reports.tableHeaders.date')}</TableHead>}
                    {selectedColumns.market && <TableHead>{t('admin.reports.tableHeaders.market')}</TableHead>}
                    {selectedColumns.contractingAgency && <TableHead>{t('admin.reports.tableHeaders.contractingAgency')}</TableHead>}
                    {selectedColumns.client && <TableHead>{t('admin.reports.tableHeaders.client')}</TableHead>}
                    {selectedColumns.projectBrand && <TableHead>{t('admin.reports.tableHeaders.projectBrand')}</TableHead>}
                    {selectedColumns.media && <TableHead>{t('admin.reports.tableHeaders.media')}</TableHead>}
                    {selectedColumns.jobType && <TableHead>{t('admin.reports.tableHeaders.jobType')}</TableHead>}
                    {selectedColumns.hours && <TableHead>{t('admin.reports.tableHeaders.hours')}</TableHead>}
                    {selectedColumns.comments && <TableHead>{t('admin.reports.tableHeaders.comments')}</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    {selectedColumns.company && <TableCell>{selectedReport.company}</TableCell>}
                    {selectedColumns.fullName && <TableCell>{selectedReport.employee}</TableCell>}
                    {selectedColumns.date && <TableCell>{selectedReport.date}</TableCell>}
                    {selectedColumns.market && <TableCell>{selectedReport.market}</TableCell>}
                    {selectedColumns.contractingAgency && <TableCell>{selectedReport.contractingAgency}</TableCell>}
                    {selectedColumns.client && <TableCell>{typeof selectedReport.client === 'object' ? selectedReport.client.name : selectedReport.clientName || selectedReport.client}</TableCell>}
                    {selectedColumns.projectBrand && <TableCell>{selectedReport.projectBrand}</TableCell>}
                    {selectedColumns.media && <TableCell>{selectedReport.media}</TableCell>}
                    {selectedColumns.jobType && <TableCell>{selectedReport.jobType}</TableCell>}
                    {selectedColumns.hours && <TableCell>{selectedReport.hours}</TableCell>}
                    {selectedColumns.comments && <TableCell>{selectedReport.comments}</TableCell>}
                  </TableRow>
                  {previewReports.map(report => (
                    <TableRow key={`preview-${report.id}`}>
                      {selectedColumns.company && <TableCell>{report.company}</TableCell>}
                      {selectedColumns.fullName && <TableCell>{report.employee}</TableCell>}
                      {selectedColumns.date && <TableCell>{report.date}</TableCell>}
                      {selectedColumns.market && <TableCell>{report.market}</TableCell>}
                      {selectedColumns.contractingAgency && <TableCell>{report.contractingAgency}</TableCell>}
                      {selectedColumns.client && <TableCell>{typeof report.client === 'object' ? report.client.name : report.clientName || report.client}</TableCell>}
                      {selectedColumns.projectBrand && <TableCell>{report.projectBrand}</TableCell>}
                      {selectedColumns.media && <TableCell>{report.media}</TableCell>}
                      {selectedColumns.jobType && <TableCell>{report.jobType}</TableCell>}
                      {selectedColumns.hours && <TableCell>{report.hours}</TableCell>}
                      {selectedColumns.comments && <TableCell>{report.comments}</TableCell>}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <DialogFooter className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowDownloadDialog(false)}>
              {t('admin.reports.downloadDialog.cancel')}
            </Button>
            <Button onClick={handleDownloadWithColumns} disabled={isDownloading}>
              {isDownloading ? '...' : t('admin.reports.downloadDialog.download')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
