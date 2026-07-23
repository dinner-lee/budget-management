import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { PURPOSE_LABELS } from '@/lib/evidence-config'
import { notFound, redirect } from 'next/navigation'
import PrintButton from './PrintButton'

const PRINT_PURPOSES: { label: string; keys: string[] }[] = [
  { label: '회의', keys: ['MEETING_FEE'] },
  { label: '전문가 활용', keys: ['EXPERT_FEE'] },
  { label: '물품 구매', keys: ['PURCHASE_FEE'] },
  { label: '기타', keys: ['PARTICIPANT_FEE', 'SOFTWARE_FEE', 'OTHER'] },
]

const POST_EXPENSE_DOCS: [string, string][] = [
  ['회의비', '회의록, 영수증'],
  ['전문가 활용비', '지급청구서, 이력서, 증빙자료(강연자료, 면담자료 등), 통장 및 신분증 사본'],
  ['연구참여자 사례비', '지급청구서, 증빙 자료(안내문, 설문결과 등), 통장 및 신분증 사본'],
  ['구매지출비', '견적서 및 타견적서, 구매 물품 실제 사진, 거래내역서, 영수증'],
  ['소프트웨어 구독료', '견적서 및 타견적서, 영수증'],
]

function Checkbox({ checked, label }: { checked: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 mr-6">
      <span className="inline-flex items-center justify-center w-3.5 h-3.5 border border-gray-500 text-[11px] leading-none">
        {checked ? '✓' : ' '}
      </span>
      {label}
    </span>
  )
}

export default async function PlanPrintPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if (session.user.role !== 'ADMIN') redirect('/dashboard')

  const plan = await prisma.budgetPlan.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { name: true, email: true } },
      team: { select: { teamNumber: true } },
    },
  })
  if (!plan) notFound()

  const purposeLabel = PURPOSE_LABELS[plan.purpose as keyof typeof PURPOSE_LABELS]
  const created = new Date(plan.createdAt)
  const plannedDate = new Date(plan.plannedDate)

  const remarks: string[] = [
    `사용 예정일: ${plannedDate.toLocaleDateString('ko-KR')}${plan.plannedTime ? ` ${plan.plannedTime}` : ''}`,
  ]
  if (plan.isRecurring) {
    remarks.push(`${plan.totalRepeats}개월 반복 결제 (${purposeLabel})`)
  }

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      <PrintButton />

      {/* A4 용지 */}
      <div className="mx-auto max-w-[210mm] bg-white shadow-lg print:shadow-none px-[18mm] py-[16mm] text-gray-900">
        {/* 로고 + 제목 */}
        <div className="relative mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/lsri_logo.png"
            alt="학습과학연구소"
            className="absolute right-0 -top-2 h-9 object-contain"
          />
          <h1 className="text-center text-3xl font-black tracking-[0.3em] pt-6">예산 사용 계획서</h1>
        </div>

        <p className="text-sm font-bold mb-2">이하 항목을 기입하여 제출해 주시기 바랍니다.</p>

        {/* 본문 표 */}
        <table className="w-full border-collapse text-sm [&_th]:border [&_th]:border-gray-700 [&_td]:border [&_td]:border-gray-700 [&_th]:px-3 [&_th]:py-3 [&_td]:px-3 [&_td]:py-3">
          <tbody>
            <tr>
              <th className="bg-gray-50 w-24 font-medium text-center">성함</th>
              <td className="w-[35%]">{plan.user.name ?? ''}</td>
              <th className="bg-gray-50 w-20 font-medium text-center">소속</th>
              <td>{plan.team ? `${plan.team.teamNumber}팀` : ''}</td>
            </tr>
            <tr>
              <th className="bg-gray-50 font-medium text-center">사용 목적</th>
              <td colSpan={3}>
                {PRINT_PURPOSES.map(({ label, keys }) => {
                  const checked = keys.includes(plan.purpose)
                  const display =
                    label === '기타' && checked && plan.purpose !== 'OTHER'
                      ? `기타 (${purposeLabel})`
                      : label
                  return <Checkbox key={label} checked={checked} label={display} />
                })}
              </td>
            </tr>
            <tr>
              <th className="bg-gray-50 font-medium text-center">예상 금액</th>
              <td colSpan={3}>
                {plan.amount.toLocaleString()}원
                {plan.isRecurring && ` (매달, 총 ${plan.totalRepeats}개월)`}
              </td>
            </tr>
            <tr>
              <th className="bg-gray-50 font-medium text-center h-24 align-middle">지출 개요</th>
              <td colSpan={3} className="align-top whitespace-pre-wrap leading-relaxed">
                {plan.expenditureOverview}
              </td>
            </tr>
            <tr>
              <th className="bg-gray-50 font-medium text-center h-16 align-middle">비고</th>
              <td colSpan={3} className="align-top leading-relaxed">
                {remarks.join(' / ')}
              </td>
            </tr>
          </tbody>
        </table>

        {/* 지출 이후 제출 서류 */}
        <p className="text-sm font-bold mt-6 mb-2">※ 지출 이후 제출 서류</p>
        <table className="w-full border-collapse text-sm [&_th]:border [&_th]:border-gray-700 [&_td]:border [&_td]:border-gray-700 [&_th]:px-3 [&_th]:py-2.5 [&_td]:px-3 [&_td]:py-2.5">
          <tbody>
            {POST_EXPENSE_DOCS.map(([category, docs]) => (
              <tr key={category}>
                <th className="w-40 font-medium text-center">{category}</th>
                <td>{docs}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 작성일 + 서명 */}
        <p className="text-center text-base font-bold mt-10">
          {created.getFullYear()}년 {created.getMonth() + 1}월 {created.getDate()}일
        </p>

        <div className="flex justify-end mt-8 pr-8">
          <div className="relative flex items-center gap-3 text-base">
            <span className="font-bold">신청자:</span>
            <span className="min-w-[7rem] text-center">{plan.user.name ?? ''}</span>
            <span className="relative inline-flex items-center justify-center w-16 h-16 text-gray-400">
              (인)
              {plan.signature && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={plan.signature}
                  alt="신청자 서명"
                  className="absolute inset-0 w-full h-full object-contain"
                />
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
