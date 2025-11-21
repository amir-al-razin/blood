'use client'

import { useState } from 'react'
import DatePicker from 'react-datepicker'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar, ChevronDown } from 'lucide-react'
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import "react-datepicker/dist/react-datepicker.css"

interface DateRange {
  start: Date
  end: Date
}

interface DateRangePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
  className?: string
}

const presetRanges = [
  {
    label: 'Last 7 days',
    getValue: () => ({
      start: subDays(new Date(), 7),
      end: new Date()
    })
  },
  {
    label: 'Last 30 days',
    getValue: () => ({
      start: subDays(new Date(), 30),
      end: new Date()
    })
  },
  {
    label: 'Last 90 days',
    getValue: () => ({
      start: subDays(new Date(), 90),
      end: new Date()
    })
  },
  {
    label: 'This month',
    getValue: () => ({
      start: startOfMonth(new Date()),
      end: endOfMonth(new Date())
    })
  },
  {
    label: 'Last month',
    getValue: () => {
      const lastMonth = subMonths(new Date(), 1)
      return {
        start: startOfMonth(lastMonth),
        end: endOfMonth(lastMonth)
      }
    }
  },
  {
    label: 'Last 6 months',
    getValue: () => ({
      start: subMonths(new Date(), 6),
      end: new Date()
    })
  },
  {
    label: 'Last year',
    getValue: () => ({
      start: subDays(new Date(), 365),
      end: new Date()
    })
  }
]

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [tempRange, setTempRange] = useState<DateRange>(value)

  const handlePresetClick = (preset: typeof presetRanges[0]) => {
    const newRange = preset.getValue()
    setTempRange(newRange)
    onChange(newRange)
    setIsOpen(false)
  }

  const handleApply = () => {
    onChange(tempRange)
    setIsOpen(false)
  }

  const handleCancel = () => {
    setTempRange(value)
    setIsOpen(false)
  }

  const formatDateRange = (range: DateRange) => {
    return `${format(range.start, 'MMM d, yyyy')} - ${format(range.end, 'MMM d, yyyy')}`
  }

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between"
      >
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>{formatDateRange(value)}</span>
        </div>
        <ChevronDown className="h-4 w-4" />
      </Button>

      {isOpen && (
        <Card className="absolute top-full left-0 mt-2 z-50 w-96 shadow-lg">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Preset Ranges */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-700">Quick Select</h4>
                <div className="space-y-1">
                  {presetRanges.map((preset) => (
                    <Button
                      key={preset.label}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-sm"
                      onClick={() => handlePresetClick(preset)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom Date Picker */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-gray-700">Custom Range</h4>
                
                <div className="space-y-2">
                  <label className="text-xs text-gray-600">Start Date</label>
                  <DatePicker
                    selected={tempRange.start}
                    onChange={(date) => date && setTempRange({ ...tempRange, start: date })}
                    selectsStart
                    startDate={tempRange.start}
                    endDate={tempRange.end}
                    maxDate={tempRange.end}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    dateFormat="MMM d, yyyy"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-gray-600">End Date</label>
                  <DatePicker
                    selected={tempRange.end}
                    onChange={(date) => date && setTempRange({ ...tempRange, end: date })}
                    selectsEnd
                    startDate={tempRange.start}
                    endDate={tempRange.end}
                    minDate={tempRange.start}
                    maxDate={new Date()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    dateFormat="MMM d, yyyy"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={handleApply}
                    className="flex-1"
                  >
                    Apply
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancel}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}