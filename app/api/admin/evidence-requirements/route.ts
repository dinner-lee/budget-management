import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { revalidateTag } from 'next/cache'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import {
  EVIDENCE_TAG,
  PURPOSE_KEYS,
  getEvidenceRequirements,
  sanitizeItems,
} from '@/lib/evidence-requirements'
import type { Purpose } from '@/lib/evidence-config'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  return session?.user.role === 'ADMIN'
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }
  return NextResponse.json(await getEvidenceRequirements())
}

// 한 사용 목적의 첨부 문서 목록 전체를 교체한다. 이미 만든 계획서에는 영향 없음.
export async function PUT(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }
  const { purpose, items } = await req.json()
  if (!PURPOSE_KEYS.includes(purpose as Purpose)) {
    return NextResponse.json({ error: '올바르지 않은 사용 목적입니다.' }, { status: 400 })
  }
  const clean = sanitizeItems(items)
  if (!clean) {
    return NextResponse.json({ error: '문서 이름이 비어 있거나 형식이 올바르지 않습니다.' }, { status: 400 })
  }

  await prisma.evidenceConfig.upsert({
    where: { purpose },
    create: { purpose, items: clean as any },
    update: { items: clean as any },
  })
  revalidateTag(EVIDENCE_TAG)
  return NextResponse.json({ success: true, items: clean })
}

// 관리자 수정분을 지우고 기본 목록으로 되돌린다.
export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }
  const purpose = new URL(req.url).searchParams.get('purpose')
  if (!purpose || !PURPOSE_KEYS.includes(purpose as Purpose)) {
    return NextResponse.json({ error: '올바르지 않은 사용 목적입니다.' }, { status: 400 })
  }
  await prisma.evidenceConfig.deleteMany({ where: { purpose } })
  revalidateTag(EVIDENCE_TAG)
  return NextResponse.json({ success: true })
}
