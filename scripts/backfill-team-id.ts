import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({
    where: { teamId: { not: null } },
    select: { id: true, teamId: true }
  })

  for (const user of users) {
    await prisma.budgetPlan.updateMany({
      where: { userId: user.id },
      data: { teamId: user.teamId }
    })
    
    // BudgetModificationHistory
    await prisma.budgetModificationHistory.updateMany({
      where: { userId: user.id },
      data: { teamId: user.teamId }
    })
  }

  console.log('Backfill complete.')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
