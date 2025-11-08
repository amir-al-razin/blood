'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Filter, X } from 'lucide-react'
import { useState, useEffect } from 'react'

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

const verificationStatuses = [
  { value: 'true', label: 'Verified' },
  { value: 'false', label: 'Pending Verification' },
]

const availabilityStatuses = [
  { value: 'true', label: 'Available' },
  { value: 'false', label: 'Unavailable' },
]

export function DonorsFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    bloodType: searchParams.get('bloodType') || '',
    location: searchParams.get('location') || '',
    area: searchParams.get('area') || '',
    isVerified: searchParams.get('isVerified') || '',
    isAvailable: searchParams.get('isAvailable') || '',
  })

  const updateURL = (newFilters: typeof filters) => {
    const params = new URLSearchParams()
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      }
    })

    const queryString = params.toString()
    const newURL = queryString ? `?${queryString}` : '/dashboard/donors'
    
    router.push(newURL)
  }

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    updateURL(newFilters)
  }

  const clearFilters = () => {
    const clearedFilters = {
      search: '',
      bloodType: '',
      location: '',
      area: '',
      isVerified: '',
      isAvailable: '',
    }
    setFilters(clearedFilters)
    updateURL(clearedFilters)
  }

  const hasActiveFilters = Object.values(filters).some(value => value !== '')

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search by name, phone, or email..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Blood Type Filter */}
        <Select
          value={filters.bloodType}
          onValueChange={(value) => handleFilterChange('bloodType', value)}
        >
          <SelectTrigger className="w-full sm:w-[120px]">
            <SelectValue placeholder="Blood Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Types</SelectItem>
            {bloodTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Verification Status Filter */}
        <Select
          value={filters.isVerified}
          onValueChange={(value) => handleFilterChange('isVerified', value)}
        >
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Verification" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Status</SelectItem>
            {verificationStatuses.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Availability Filter */}
        <Select
          value={filters.isAvailable}
          onValueChange={(value) => handleFilterChange('isAvailable', value)}
        >
          <SelectTrigger className="w-full sm:w-[120px]">
            <SelectValue placeholder="Availability" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All</SelectItem>
            {availabilityStatuses.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Location Filter */}
        <Input
          placeholder="Location"
          value={filters.location}
          onChange={(e) => handleFilterChange('location', e.target.value)}
          className="w-full sm:w-[120px]"
        />

        {/* Area Filter */}
        <Input
          placeholder="Area"
          value={filters.area}
          onChange={(e) => handleFilterChange('area', e.target.value)}
          className="w-full sm:w-[120px]"
        />

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={clearFilters}
            className="w-full sm:w-auto"
          >
            <X className="w-4 h-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.bloodType && (
            <div className="flex items-center gap-1 bg-red-100 text-red-800 px-2 py-1 rounded-md text-sm">
              Blood: {bloodTypes.find(t => t.value === filters.bloodType)?.label}
              <button
                onClick={() => handleFilterChange('bloodType', '')}
                className="ml-1 hover:bg-red-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          {filters.isVerified && (
            <div className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-md text-sm">
              Status: {verificationStatuses.find(s => s.value === filters.isVerified)?.label}
              <button
                onClick={() => handleFilterChange('isVerified', '')}
                className="ml-1 hover:bg-green-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          {filters.isAvailable && (
            <div className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm">
              Availability: {availabilityStatuses.find(s => s.value === filters.isAvailable)?.label}
              <button
                onClick={() => handleFilterChange('isAvailable', '')}
                className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          {filters.location && (
            <div className="flex items-center gap-1 bg-purple-100 text-purple-800 px-2 py-1 rounded-md text-sm">
              Location: {filters.location}
              <button
                onClick={() => handleFilterChange('location', '')}
                className="ml-1 hover:bg-purple-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          {filters.area && (
            <div className="flex items-center gap-1 bg-orange-100 text-orange-800 px-2 py-1 rounded-md text-sm">
              Area: {filters.area}
              <button
                onClick={() => handleFilterChange('area', '')}
                className="ml-1 hover:bg-orange-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}