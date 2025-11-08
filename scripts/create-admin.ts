import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    console.log('🔐 Creating admin user...')
    
    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 12)
    console.log('✅ Password hashed')
    
    // Create or update admin user
    const admin = await prisma.user.upsert({
      where: { email: 'admin@redaid.com' },
      update: {
        password: hashedPassword,
        isActive: true
      },
      create: {
        email: 'admin@redaid.com',
        password: hashedPassword,
        name: 'Super Admin',
        role: 'SUPER_ADMIN',
        phone: '+8801712345678',
        isActive: true
      }
    })
    
    console.log('✅ Admin user created/updated:', {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      isActive: admin.isActive
    })
    
    // Test password verification
    const isValid = await bcrypt.compare('admin123', admin.password)
    console.log('✅ Password verification test:', isValid ? 'PASSED' : 'FAILED')
    
    // Create staff user
    const staff = await prisma.user.upsert({
      where: { email: 'staff@redaid.com' },
      update: {
        password: hashedPassword,
        isActive: true
      },
      create: {
        email: 'staff@redaid.com',
        password: hashedPassword,
        name: 'Staff Member',
        role: 'STAFF',
        phone: '+8801712345679',
        isActive: true
      }
    })
    
    console.log('✅ Staff user created/updated:', {
      id: staff.id,
      email: staff.email,
      name: staff.name,
      role: staff.role
    })
    
    console.log('\n🎉 Admin users ready!')
    console.log('📧 Login credentials:')
    console.log('   Email: admin@redaid.com')
    console.log('   Password: admin123')
    console.log('   Email: staff@redaid.com')
    console.log('   Password: admin123')
    
  } catch (error) {
    console.error('❌ Error creating admin:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()