'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X, ChevronDown } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

const matchStatuses = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'COMPLETED', label: 'Completed' },
]

const bloodTypes = [
  { value: 'A_POSITIVE', label: 'A+' },
  { value: 'A_NEGATIVE', label: 'A-' },
  { value: 'B_POSITIVE', label: 'B+' },
  { value: 'B_NEGATIVE', label: 'B-' },
  { value: 'AB_POSITIVE', label: 'AB+' },
  { value: 'AB_NEGATIVE', label: 'AB-' },
  { value: 'O_POSITIVE', label: 'O+' },
  { value: 'O_NEGATIVE', label: 'O-' },
]

function FilterDropdown({
  label,
  value,
  options,
  onChange
}: {
  label: string
  value: string
  options: { value: string, label: string }[]
  onChange: (value: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedLabel = options.find(o => o.value === value)?.label

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg
          transition-colors whitespace-nowrap
          ${value
            ? 'bg-red-50 text-red-700 hover:bg-red-100'
            : 'text-gray-600 hover:bg-gray-100'
          }
        `}
      >
        {selectedLabel || label}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[140px] py-1">
          <button
            onClick={() => { onChange(''); setIsOpen(false) }}
            className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors
              ${!value ? 'text-red-600 bg-red-50' : 'text-gray-700'}`}
          >
            All {label}
          </button>
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => { onChange(option.value); setIsOpen(false) }}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors
                ${value === option.value ? 'text-red-600 bg-red-50' : 'text-gray-700'}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function MatchesFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
    bloodType: searchParams.get('bloodType') || '',
  })

  const updateURL = (newFilters: typeof filters) => {
    const params = new URLSearchParams()
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
    const queryString = params.toString()
    router.push(queryString ? `?${queryString}` : '/dashboard/matches')
  }

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    updateURL(newFilters)
  }

  const clearFilters = () => {
    const clearedFilters = { search: '', status: '', bloodType: '' }
    setFilters(clearedFilters)
    updateURL(clearedFilters)
  }

  const hasActiveFilters = Object.values(filters).some(value => value !== '')
  const activeCount = Object.values(filters).filter(v => v !== '').length

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search matches..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border-0 rounded-lg 
                     placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-red-500/20
                     transition-all outline-none"
        />
      </div>

      <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>

      <div className="flex items-center gap-1">
        <FilterDropdown
          label="Status"
          value={filters.status}
          options={matchStatuses}
          onChange={(value) => handleFilterChange('status', value)}
        />
        <FilterDropdown
          label="Blood Type"
          value={filters.bloodType}
          options={bloodTypes}
          onChange={(value) => handleFilterChange('bloodType', value)}
        />
      </div>

      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-500 
                     hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
        >
          <X className="w-3 h-3" />
          Clear ({activeCount})
        </button>
      )}
    </div>
  )
}