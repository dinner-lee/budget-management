import { unstable_cache } from 'next/cache'
import { prisma } from './db'

// 마일스톤은 관리자가 수정할 때만 바뀌므로 태그 기반으로 캐싱.
// 수정 API에서 revalidateTag(MILESTONES_TAG) 호출 시 무효화됨.
export const MILESTONES_TAG = 'milestones'

export const getMilestones = unstable_cache(
  () => prisma.milestone.findMany({ orderBy: { date: 'asc' } }),
  [MILESTONES_TAG],
  { tags: [MILESTONES_TAG] },
)
