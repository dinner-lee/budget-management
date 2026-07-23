import webpush from 'web-push'
import { prisma } from './db'

let configured = false

function ensureConfigured() {
  if (configured) return true
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  if (!publicKey || !privateKey) return false
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:admin@example.com', publicKey, privateKey)
  configured = true
  return true
}

export interface PushPayload {
  title: string
  body: string
  url?: string
  tag?: string
}

// 지정한 사용자들의 모든 구독으로 푸시 발송. 만료된 구독(404/410)은 정리.
export async function sendPushToUsers(userIds: string[], payload: PushPayload): Promise<number> {
  if (!ensureConfigured() || userIds.length === 0) return 0

  const subs = await prisma.pushSubscription.findMany({
    where: { userId: { in: userIds } },
  })

  let sent = 0
  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
        )
        sent++
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {})
        }
      }
    }),
  )
  return sent
}
