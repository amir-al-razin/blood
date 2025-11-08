console.log('🔍 Environment Check')
console.log('==================')

const requiredEnvVars = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL'
]

let allGood = true

requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar]
  if (value) {
    console.log(`✅ ${envVar}: ${envVar === 'DATABASE_URL' ? '[HIDDEN]' : value}`)
  } else {
    console.log(`❌ ${envVar}: Missing!`)
    allGood = false
  }
})

if (allGood) {
  console.log('\n🎉 All environment variables are set!')
} else {
  console.log('\n⚠️  Some environment variables are missing.')
  console.log('Create a .env.local file with:')
  console.log('DATABASE_URL="your_postgresql_connection_string"')
  console.log('NEXTAUTH_SECRET="your_secret_key"')
  console.log('NEXTAUTH_URL="http://localhost:3000"')
}