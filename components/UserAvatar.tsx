'use client'

// 구글 프로필 사진 원형 아바타 (없으면 이름 첫 글자)
export default function UserAvatar({
  image,
  name,
  size = 'md',
}: {
  image?: string | null
  name?: string | null
  size?: 'md' | 'lg'
}) {
  const sizeClass = size === 'lg' ? 'w-9 h-9 text-sm' : 'w-7 h-7 text-xs'

  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={name ? `${name} 프로필` : '프로필'}
        referrerPolicy="no-referrer"
        className={`${sizeClass} rounded-full object-cover ring-2 ring-white/80 shadow-sm shrink-0`}
      />
    )
  }
  return (
    <span
      className={`${sizeClass} rounded-full bg-primary-100 text-primary-500 font-bold flex items-center justify-center shrink-0`}
      aria-hidden="true"
    >
      {name?.trim()?.[0] ?? '?'}
    </span>
  )
}
