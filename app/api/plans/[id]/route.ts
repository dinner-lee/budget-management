import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { teamId: true }
  })

  const plan = await prisma.budgetPlan.findFirst({
    where: { 
      id: params.id, 
      OR: [
        { userId: session.user.id },
        { teamId: user?.teamId || 'NONE' }
      ]
    },
    include: { evidences: true },
  })

  if (!plan) return NextResponse.json({ error: '찾을 수 없습니다.' }, { status: 404 })

  return NextResponse.json(plan)
}
