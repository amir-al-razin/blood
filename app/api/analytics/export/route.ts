import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth-utils'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, format: exportFormat, startDate, endDate, filters } = body

    let data: any[] = []
    let filename = ''
    let headers: string[] = []

    switch (type) {
      case 'donors':
        data = await exportDonorsData(startDate, endDate, filters)
        filename = `donors-report-${format(new Date(), 'yyyy-MM-dd')}`
        headers = ['Name', 'Phone', 'Email', 'Blood Type', 'Area', 'Status', 'Donation Count', 'Last Donation', 'Created Date']
        break

      case 'requests':
        data = await exportRequestsData(startDate, endDate, filters)
        filename = `requests-report-${format(new Date(), 'yyyy-MM-dd')}`
        headers = ['Reference ID', 'Requester Name', 'Phone', 'Blood Type', 'Location', 'Hospital', 'Urgency', 'Units', 'Status', 'Created Date']
        break

      case 'matches':
        data = await exportMatchesData(startDate, endDate, filters)
        filename = `matches-report-${format(new Date(), 'yyyy-MM-dd')}`
        headers = ['Match ID', 'Donor Name', 'Donor Phone', 'Request ID', 'Blood Type', 'Status', 'Created Date', 'Completed Date']
        break

      case 'analytics':
        data = await exportAnalyticsData(startDate, endDate)
        filename = `analytics-summary-${format(new Date(), 'yyyy-MM-dd')}`
        headers = ['Metric', 'Value', 'Period']
        break

      default:
        return NextResponse.json({ error: 'Invalid export type' }, { status: 400 })
    }

    if (exportFormat === 'excel') {
      const buffer = generateExcelReport(data, headers, filename)

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}.xlsx"`
        }
      })
    } else if (exportFormat === 'pdf') {
      const buffer = generatePDFReport(data, headers, filename, type)

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}.pdf"`
        }
      })
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
  } catch (error) {
    console.error('Export API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate export' },
      { status: 500 }
    )
  }
}

async function exportDonorsData(startDate?: string, endDate?: string, filters?: any) {
  const whereClause: any = {}

  if (startDate && endDate) {
    whereClause.createdAt = {
      gte: new Date(startDate),
      lte: new Date(endDate)
    }
  }

  if (filters?.bloodType) {
    whereClause.bloodType = filters.bloodType
  }

  if (filters?.area) {
    whereClause.area = filters.area
  }

  if (filters?.isVerified !== undefined) {
    whereClause.isVerified = filters.isVerified
  }

  const donors = await db.donor.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' }
  })

  return donors.map(donor => [
    donor.name,
    donor.phone,
    donor.email || 'N/A',
    donor.bloodType.replace('_', ''),
    donor.area,
    donor.isVerified ? 'Verified' : 'Unverified',
    donor.donationCount,
    donor.lastDonation ? format(donor.lastDonation, 'yyyy-MM-dd') : 'Never',
    format(donor.createdAt, 'yyyy-MM-dd HH:mm')
  ])
}

async function exportRequestsData(startDate?: string, endDate?: string, filters?: any) {
  const whereClause: any = {}

  if (startDate && endDate) {
    whereClause.createdAt = {
      gte: new Date(startDate),
      lte: new Date(endDate)
    }
  }

  if (filters?.bloodType) {
    whereClause.bloodType = filters.bloodType
  }

  if (filters?.urgencyLevel) {
    whereClause.urgencyLevel = filters.urgencyLevel
  }

  if (filters?.status) {
    whereClause.status = filters.status
  }

  const requests = await db.request.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' }
  })

  return requests.map(request => [
    request.referenceId,
    request.requesterName,
    request.requesterPhone,
    request.bloodType.replace('_', ''),
    request.location,
    request.hospital,
    request.urgencyLevel,
    request.unitsRequired,
    request.status,
    format(request.createdAt, 'yyyy-MM-dd HH:mm')
  ])
}

async function exportMatchesData(startDate?: string, endDate?: string, filters?: any) {
  const whereClause: any = {}

  if (startDate && endDate) {
    whereClause.createdAt = {
      gte: new Date(startDate),
      lte: new Date(endDate)
    }
  }

  if (filters?.status) {
    whereClause.status = filters.status
  }

  const matches = await db.match.findMany({
    where: whereClause,
    include: {
      donor: true,
      request: true
    },
    orderBy: { createdAt: 'desc' }
  })

  return matches.map(match => [
    match.id,
    match.donor.name,
    match.donor.phone,
    match.request.referenceId,
    match.request.bloodType.replace('_', ''),
    match.status,
    format(match.createdAt, 'yyyy-MM-dd HH:mm'),
    match.completedAt ? format(match.completedAt, 'yyyy-MM-dd HH:mm') : 'N/A'
  ])
}

async function exportAnalyticsData(startDate?: string, endDate?: string) {
  const period = startDate && endDate ? `${startDate} to ${endDate}` : 'All time'

  const [totalDonors, totalRequests, totalMatches, completedMatches] = await Promise.all([
    db.donor.count(),
    db.request.count(),
    db.match.count(),
    db.match.count({ where: { status: 'COMPLETED' } })
  ])

  const successRate = totalMatches > 0 ? ((completedMatches / totalMatches) * 100).toFixed(1) : '0'

  return [
    ['Total Donors', totalDonors.toString(), period],
    ['Total Requests', totalRequests.toString(), period],
    ['Total Matches', totalMatches.toString(), period],
    ['Completed Matches', completedMatches.toString(), period],
    ['Success Rate', `${successRate}%`, period],
    ['Active Donors', (await db.donor.count({ where: { isAvailable: true } })).toString(), period],
    ['Verified Donors', (await db.donor.count({ where: { isVerified: true } })).toString(), period]
  ]
}

function generateExcelReport(data: any[], headers: string[], filename: string): Buffer {
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data])
  const workbook = XLSX.utils.book_new()

  // Auto-size columns
  const colWidths = headers.map((header, i) => {
    const maxLength = Math.max(
      header.length,
      ...data.map(row => (row[i] || '').toString().length)
    )
    return { wch: Math.min(maxLength + 2, 50) }
  })
  worksheet['!cols'] = colWidths

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report')

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
}

function generatePDFReport(data: any[], headers: string[], filename: string, type: string): Buffer {
  const doc = new jsPDF()

  // Add title
  doc.setFontSize(20)
  doc.text(`RedAid ${type.charAt(0).toUpperCase() + type.slice(1)} Report`, 20, 20)

  // Add generation date
  doc.setFontSize(12)
  doc.text(`Generated on: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, 20, 35)

  // Add table
  autoTable(doc, {
    head: [headers],
    body: data,
    startY: 50,
    styles: {
      fontSize: 8,
      cellPadding: 2
    },
    headStyles: {
      fillColor: [220, 38, 38], // Red theme
      textColor: 255
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { top: 50 }
  })

  return Buffer.from(doc.output('arraybuffer'))
}