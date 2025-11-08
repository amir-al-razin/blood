import { db } from '@/lib/db'
import { db } from '@/lib/db'
import { db } from '@/lib/db'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin users
  const hashedPassword = await bcrypt.hash('admin123', 12)

  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@redaid.com' },
    update: {},
    create: {
      email: 'admin@redaid.com',
      password: hashedPassword,
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      phone: '+8801712345678'
    }
  })

  const staff = await prisma.user.upsert({
    where: { email: 'staff@redaid.com' },
    update: {},
    create: {
      email: 'staff@redaid.com',
      password: hashedPassword,
      name: 'Staff Member',
      role: 'STAFF',
      phone: '+8801712345679'
    }
  })

  const viewer = await prisma.user.upsert({
    where: { email: 'viewer@redaid.com' },
    update: {},
    create: {
      email: 'viewer@redaid.com',
      password: hashedPassword,
      name: 'Viewer User',
      role: 'VIEWER',
      phone: '+8801712345680'
    }
  })

  // Create sample donors
  const donors = [
    {
      name: 'Ahmed Rahman',
      phone: '+8801712345681',
      email: 'ahmed@example.com',
      bloodType: 'O_POSITIVE',
      location: 'Dhaka',
      area: 'Dhanmondi',
      address: '123 Dhanmondi Road',
      dateOfBirth: new Date('1990-01-15'),
      gender: 'MALE',
      weight: 70,
      lastDonation: new Date('2024-08-15'),
      isAvailable: true,
      isVerified: true,
      donationCount: 5,
      reliabilityScore: 0.9
    },
    {
      name: 'Fatima Khan',
      phone: '+8801712345682',
      email: 'fatima@example.com',
      bloodType: 'A_POSITIVE',
      location: 'Dhaka',
      area: 'Gulshan',
      address: '456 Gulshan Avenue',
      dateOfBirth: new Date('1992-03-20'),
      gender: 'FEMALE',
      weight: 55,
      lastDonation: new Date('2024-07-10'),
      isAvailable: true,
      isVerified: true,
      donationCount: 3,
      reliabilityScore: 0.8
    },
    {
      name: 'Mohammad Ali',
      phone: '+8801712345683',
      email: 'ali@example.com',
      bloodType: 'B_NEGATIVE',
      location: 'Chittagong',
      area: 'Agrabad',
      address: '789 Agrabad Road',
      dateOfBirth: new Date('1988-07-12'),
      gender: 'MALE',
      weight: 75,
      isAvailable: true,
      isVerified: false,
      donationCount: 0,
      reliabilityScore: 0.0
    },
    {
      name: 'Rashida Begum',
      phone: '+8801712345684',
      email: 'rashida@example.com',
      bloodType: 'AB_POSITIVE',
      location: 'Sylhet',
      area: 'Zindabazar',
      address: '321 Zindabazar Lane',
      dateOfBirth: new Date('1985-11-08'),
      gender: 'FEMALE',
      weight: 60,
      lastDonation: new Date('2024-09-01'),
      isAvailable: false,
      isVerified: true,
      donationCount: 8,
      reliabilityScore: 0.95
    }
  ]

  for (const donor of donors) {
    await prisma.donor.upsert({
      where: { phone: donor.phone },
      update: {},
      create: donor as any
    })
  }

  // Create sample blood requests
  const requests = [
    {
      referenceId: 'REQ001',
      requesterName: 'Dr. Karim Hospital',
      requesterPhone: '+8801712345685',
      requesterEmail: 'emergency@karimhospital.com',
      bloodType: 'O_POSITIVE',
      location: 'Dhaka',
      hospital: 'Karim Medical College Hospital',
      urgencyLevel: 'CRITICAL',
      unitsRequired: 2,
      status: 'PENDING',
      notes: 'Emergency surgery patient needs immediate blood transfusion'
    },
    {
      referenceId: 'REQ002',
      requesterName: 'Nurse Sarah',
      requesterPhone: '+8801712345686',
      requesterEmail: 'sarah@hospital.com',
      bloodType: 'A_POSITIVE',
      location: 'Dhaka',
      hospital: 'Square Hospital',
      urgencyLevel: 'URGENT',
      unitsRequired: 1,
      status: 'IN_PROGRESS',
      notes: 'Patient scheduled for surgery tomorrow'
    },
    {
      referenceId: 'REQ003',
      requesterName: 'Family Member',
      requesterPhone: '+8801712345687',
      bloodType: 'B_NEGATIVE',
      location: 'Chittagong',
      hospital: 'Chittagong Medical College',
      urgencyLevel: 'NORMAL',
      unitsRequired: 1,
      status: 'COMPLETED',
      notes: 'Regular blood requirement for thalassemia patient',
      completedAt: new Date('2024-10-15')
    }
  ]

  for (const request of requests) {
    await prisma.request.upsert({
      where: { referenceId: request.referenceId },
      update: {},
      create: request as any
    })
  }

  // Create sample matches (simplified)
  try {
    const createdDonors = await db.donor.findMany({ take: 2 })
    const createdRequests = await db.request.findMany({ take: 2 })

    if (createdDonors.length >= 2 && createdRequests.length >= 2) {
      // Only create matches if they don't exist
      const existingMatches = await db.match.count()
      
      if (existingMatches === 0) {
        await db.match.create({
          data: {
            donorId: createdDonors[0].id,
            requestId: createdRequests[0].id,
            status: 'COMPLETED',
            contactedAt: new Date('2024-10-10'),
            acceptedAt: new Date('2024-10-10'),
            completedAt: new Date('2024-10-15'),
            createdBy: superAdmin.id,
            notes: 'Successful donation completed at hospital'
          }
        })

        await db.match.create({
          data: {
            donorId: createdDonors[1].id,
            requestId: createdRequests[1].id,
            status: 'PENDING',
            createdBy: staff.id,
            notes: 'New match created, awaiting contact'
          }
        })
      }
    }
  } catch (error) {
    console.log('Note: Matches may already exist, skipping match creation')
  }

  console.log('✅ Database seeded successfully!')
  console.log('\n📋 Test Accounts Created:')
  console.log('Super Admin: admin@redaid.com / admin123')
  console.log('Staff: staff@redaid.com / admin123')
  console.log('Viewer: viewer@redaid.com / admin123')
  console.log('\n🩸 Sample Data:')
  console.log('- 4 Donors created')
  console.log('- 3 Blood requests created')
  console.log('- Sample matches created')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })