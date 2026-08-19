import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'
import PlanPrintSheet from '@/components/PlanPrintSheet'
import PrintButton from './PrintButton'

export default async function PlanPrintPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if (session.user.role !== 'ADMIN') redirect('/dashboard')

  const plan = await prisma.budgetPlan.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { name: true, email: true, signature: true } },
      team: { select: { teamNumber: true } },
    },
  })
  if (!plan) notFound()

  // 저장 공간 절약을 위해 재사용된 서명은 사용자 대표 서명을 참조
  const signature = plan.signature ?? plan.user.signature

  return (
    <div className="min-h-screen bg-[#f5f8fd] print:bg-white">
      <PrintButton />
      <PlanPrintSheet
        plan={plan}
        userName={plan.user.name}
        teamNumber={plan.team?.teamNumber}
        signature={signature}
      />
    </div>
  )
}
