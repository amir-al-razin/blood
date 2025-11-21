'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useMobile } from '@/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronDown, ChevronRight, MoreVertical } from 'lucide-react'

interface Column {
  key: string
  label: string
  sortable?: boolean
  width?: string
  render?: (value: any, row: any) => React.ReactNode
}

interface MobileTableProps {
  columns: Column[]
  data: any[]
  keyField?: string
  className?: string
  onRowClick?: (row: any) => void
  loading?: boolean
  emptyMessage?: string
  mobileCardRender?: (row: any, index: number) => React.ReactNode
}

export function MobileTable({
  columns,
  data,
  keyField = 'id',
  className,
  onRowClick,
  loading = false,
  emptyMessage = 'No data available',
  mobileCardRender
}: MobileTableProps) {
  const { isMobile } = useMobile()
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(columnKey)
      setSortDirection('asc')
    }
  }

  const toggleRowExpansion = (rowKey: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(rowKey)) {
      newExpanded.delete(rowKey)
    } else {
      newExpanded.add(rowKey)
    }
    setExpandedRows(newExpanded)
  }

  const sortedData = [...data].sort((a, b) => {
    if (!sortColumn) return 0
    
    const aValue = a[sortColumn]
    const bValue = b[sortColumn]
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">{emptyMessage}</p>
        </CardContent>
      </Card>
    )
  }

  // Mobile Card View
  if (isMobile) {
    return (
      <div className={cn('space-y-4', className)}>
        {sortedData.map((row, index) => {
          const rowKey = row[keyField]?.toString() || index.toString()
          const isExpanded = expandedRows.has(rowKey)
          
          if (mobileCardRender) {
            return (
              <Card 
                key={rowKey} 
                className="touch-target cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onRowClick?.(row)}
              >
                {mobileCardRender(row, index)}
              </Card>
            )
          }

          // Default mobile card layout
          const primaryColumn = columns[0]
          const secondaryColumns = columns.slice(1, 3)
          const additionalColumns = columns.slice(3)

          return (
            <Card key={rowKey} className="overflow-hidden">
              <CardContent className="p-0">
                {/* Main content - always visible */}
                <div 
                  className="p-4 cursor-pointer touch-target"
                  onClick={() => onRowClick?.(row)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Primary field */}
                      <div className="font-medium text-gray-900 truncate">
                        {primaryColumn.render 
                          ? primaryColumn.render(row[primaryColumn.key], row)
                          : row[primaryColumn.key]
                        }
                      </div>
                      
                      {/* Secondary fields */}
                      <div className="mt-1 space-y-1">
                        {secondaryColumns.map((column) => (
                          <div key={column.key} className="text-sm text-gray-500 truncate">
                            <span className="font-medium">{column.label}:</span>{' '}
                            {column.render 
                              ? column.render(row[column.key], row)
                              : row[column.key]
                            }
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      {/* Actions button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="touch-target"
                        onClick={(e) => {
                          e.stopPropagation()
                          // Handle actions menu
                        }}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>

                      {/* Expand button if there are additional columns */}
                      {additionalColumns.length > 0 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="touch-target"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleRowExpansion(rowKey)
                          }}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && additionalColumns.length > 0 && (
                  <div className="border-t bg-gray-50 p-4 space-y-2">
                    {additionalColumns.map((column) => (
                      <div key={column.key} className="flex justify-between text-sm">
                        <span className="font-medium text-gray-700">{column.label}:</span>
                        <span className="text-gray-900 text-right">
                          {column.render 
                            ? column.render(row[column.key], row)
                            : row[column.key]
                          }
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  // Desktop Table View
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
                  column.sortable && 'cursor-pointer hover:bg-gray-100',
                  column.width && `w-${column.width}`
                )}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div className="flex items-center space-x-1">
                  <span>{column.label}</span>
                  {column.sortable && sortColumn === column.key && (
                    <span className="text-gray-400">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedData.map((row, index) => {
            const rowKey = row[keyField]?.toString() || index.toString()
            
            return (
              <tr
                key={rowKey}
                className={cn(
                  'hover:bg-gray-50 transition-colors',
                  onRowClick && 'cursor-pointer'
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  >
                    {column.render 
                      ? column.render(row[column.key], row)
                      : row[column.key]
                    }
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}