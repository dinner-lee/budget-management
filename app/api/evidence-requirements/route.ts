import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getEvidenceRequirements } from '@/lib/evidence-requirements'

// 계획서 작성 화면의 '필요한 증빙 항목' 미리보기용
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })
  const { requirements } = await getEvidenceRequirements()
  return NextResponse.json({ requirements })
}
