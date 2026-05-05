import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminPassword = await bcrypt.hash('admin1234!', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@lsri.kr' },
    update: {},
    create: {
      email: 'admin@lsri.kr',
      name: '관리자',
      password: adminPassword,
      role: 'ADMIN',
    },
  })

  console.log('Seeded admin user:', admin.email)
  console.log('Default password: admin1234!')
  console.log('Please change the password after first login.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
