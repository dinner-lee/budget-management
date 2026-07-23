import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// 브라우저 푸시 구독 저장
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const endpoint = body?.endpoint
  const p256dh = body?.keys?.p256dh
  const auth = body?.keys?.auth
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: '올바르지 않은 구독 정보입니다.' }, { status: 400 })
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { userId: session.user.id, p256dh, auth },
    create: { userId: session.user.id, endpoint, p256dh, auth },
  })

  return NextResponse.json({ success: true })
}

// 구독 해제
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const endpoint = body?.endpoint
  if (!endpoint) return NextResponse.json({ error: 'endpoint 필요' }, { status: 400 })

  await prisma.pushSubscription.deleteMany({
    where: { endpoint, userId: session.user.id },
  })

  return NextResponse.json({ success: true })
}
