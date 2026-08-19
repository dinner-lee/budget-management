import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// 관리자 전용 계획서 삭제 — 상태 제한 없음 (증빙·검토 이력은 cascade로 함께 삭제)
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  const plan = await prisma.budgetPlan.findUnique({
    where: { id: params.id },
    select: { id: true },
  })
  if (!plan) return NextResponse.json({ error: '찾을 수 없습니다.' }, { status: 404 })

  await prisma.budgetPlan.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}
