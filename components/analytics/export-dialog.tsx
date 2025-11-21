'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { DateRangePicker } from './date-range-picker'
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface ExportDialogProps {
  trigger?: React.ReactNode
}

interface ExportFilters {
  bloodType?: string
  area?: string
  urgencyLevel?: string
  status?: string
  isVerified?: boolean
}

export function ExportDialog({ trigger }: ExportDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportType, setExportType] = useState<'donors' | 'requests' | 'matches' | 'analytics'>('donors')
  const [exportFormat, setExportFormat] = useState<'excel' | 'pdf'>('excel')
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    end: new Date()
  })
  const [filters, setFilters] = useState<ExportFilters>({})
  const [includeFilters, setIncludeFilters] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    
    try {
      const exportData = {
        type: exportType,
        format: exportFormat,
        startDate: format(dateRange.start, 'yyyy-MM-dd'),
        endDate: format(dateRange.end, 'yyyy-MM-dd'),
        filters: includeFilters ? filters : undefined
      }

      const response = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportData)
      })

      if (!response.ok) {
        throw new Error('Export failed')
      }

      // Create download link
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      const filename = `${exportType}-report-${format(new Date(), 'yyyy-MM-dd')}.${exportFormat === 'excel' ? 'xlsx' : 'pdf'}`
      a.download = filename
      
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast.success('Report exported successfully!')
      setIsOpen(false)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export report. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const exportTypeOptions = [
    { value: 'donors', label: 'Donor Database', description: 'Complete donor information and statistics' },
    { value: 'requests', label: 'Blood Requests', description: 'All blood requests and their status' },
    { value: 'matches', label: 'Donor Matches', description: 'Donor-request matches and outcomes' },
    { value: 'analytics', label: 'Analytics Summary', description: 'Key metrics and performance data' }
  ]

  const bloodTypes = ['A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE']
  const urgencyLevels = ['CRITICAL', 'URGENT', 'NORMAL']
  const statuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Export Report</DialogTitle>
          <DialogDescription>
            Generate and download reports in Excel or PDF format
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Type */}
          <div className="space-y-2">
            <Label>Report Type</Label>
            <Select value={exportType} onValueChange={(value: any) => setExportType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {exportTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-gray-500">{option.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Export Format */}
          <div className="space-y-2">
            <Label>Format</Label>
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="excel"
                  name="format"
                  value="excel"
                  checked={exportFormat === 'excel'}
                  onChange={(e) => setExportFormat(e.target.value as 'excel')}
                  className="text-red-600"
                />
                <Label htmlFor="excel" className="flex items-center gap-2 cursor-pointer">
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel (.xlsx)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="pdf"
                  name="format"
                  value="pdf"
                  checked={exportFormat === 'pdf'}
                  onChange={(e) => setExportFormat(e.target.value as 'pdf')}
                  className="text-red-600"
                />
                <Label htmlFor="pdf" className="flex items-center gap-2 cursor-pointer">
                  <FileText className="h-4 w-4" />
                  PDF (.pdf)
                </Label>
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <Label>Date Range</Label>
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
            />
          </div>

          {/* Filters */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeFilters"
                checked={includeFilters}
                onCheckedChange={(checked) => setIncludeFilters(checked as boolean)}
              />
              <Label htmlFor="includeFilters">Apply additional filters</Label>
            </div>

            {includeFilters && (
              <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-gray-50">
                {/* Blood Type Filter */}
                {(exportType === 'donors' || exportType === 'requests') && (
                  <div className="space-y-2">
                    <Label>Blood Type</Label>
                    <Select value={filters.bloodType || ''} onValueChange={(value) => setFilters({ ...filters, bloodType: value || undefined })}>
                      <SelectTrigger>
                        <SelectValue placeholder="All blood types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All blood types</SelectItem>
                        {bloodTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.replace('_', '')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Urgency Level Filter */}
                {exportType === 'requests' && (
                  <div className="space-y-2">
                    <Label>Urgency Level</Label>
                    <Select value={filters.urgencyLevel || ''} onValueChange={(value) => setFilters({ ...filters, urgencyLevel: value || undefined })}>
                      <SelectTrigger>
                        <SelectValue placeholder="All urgency levels" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All urgency levels</SelectItem>
                        {urgencyLevels.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level.charAt(0) + level.slice(1).toLowerCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Status Filter */}
                {(exportType === 'requests' || exportType === 'matches') && (
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={filters.status || ''} onValueChange={(value) => setFilters({ ...filters, status: value || undefined })}>
                      <SelectTrigger>
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All statuses</SelectItem>
                        {statuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Verification Status */}
                {exportType === 'donors' && (
                  <div className="space-y-2">
                    <Label>Verification Status</Label>
                    <Select 
                      value={filters.isVerified === undefined ? '' : filters.isVerified.toString()} 
                      onValueChange={(value) => setFilters({ 
                        ...filters, 
                        isVerified: value === '' ? undefined : value === 'true' 
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All donors" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All donors</SelectItem>
                        <SelectItem value="true">Verified only</SelectItem>
                        <SelectItem value="false">Unverified only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}