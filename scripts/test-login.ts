import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function testLogin() {
  try {
    console.log('🧪 Testing login process...')
    
    // Test database connection
    await prisma.$connect()
    console.log('✅ Database connected')
    
    // Find admin user
    const user = await prisma.user.findUnique({
      where: { email: 'admin@redaid.com' }
    })
    
    if (!user) {
      console.log('❌ Admin user not found!')
      console.log('Run: npm run create-admin first')
      return
    }
    
    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive
    })
    
    // Test password
    const isPasswordValid = await bcrypt.compare('admin123', user.password)
    console.log('✅ Password test:', isPasswordValid ? 'VALID' : 'INVALID')
    
    if (!user.isActive) {
      console.log('❌ User is not active!')
    }
    
    console.log('\n🎯 Login should work with:')
    console.log('   Email: admin@redaid.com')
    console.log('   Password: admin123')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testLogin()