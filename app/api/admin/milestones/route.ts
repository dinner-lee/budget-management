import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getMilestones, MILESTONES_TAG } from '@/lib/milestones'
import { revalidateTag } from 'next/cache'

export async function GET() {
  const milestones = await getMilestones()
  return NextResponse.json({ milestones })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }

  const body = await req.json()
  const { name, date } = body

  const milestone = await prisma.milestone.create({
    data: {
      name,
      date: new Date(date)
    }
  })

  revalidateTag(MILESTONES_TAG)
  return NextResponse.json({ milestone }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }

  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID 필요' }, { status: 400 })

  await prisma.milestone.delete({ where: { id } })

  revalidateTag(MILESTONES_TAG)
  return NextResponse.json({ success: true })
}
