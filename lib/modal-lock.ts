// 모달 열림 시 body 상태(스크롤 잠금, data-modal-open) 관리.
// 검토 모달 위에 인쇄 모달이 겹쳐 열려도 어긋나지 않도록 카운터로 관리한다.
// data-modal-open은 상단 navbar의 backdrop-filter를 끄는 CSS 훅
// (모달 오버레이 블러와 중첩 시 navbar 영역만 블러가 끊기는 아티팩트 방지).
let lockCount = 0
let prevOverflow = ''

export function lockBodyForModal() {
  if (lockCount === 0) {
    prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.body.dataset.modalOpen = '1'
  }
  lockCount++
}

export function unlockBodyForModal() {
  lockCount = Math.max(0, lockCount - 1)
  if (lockCount === 0) {
    document.body.style.overflow = prevOverflow
    delete document.body.dataset.modalOpen
  }
}
