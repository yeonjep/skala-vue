<script setup>
/**
 * 드래그로 좌/우/상/하 도킹 + 호버 확장
 */
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const emit = defineEmits(['dock'])

const route = useRoute()
const router = useRouter()

const STORAGE_KEY = 'aerocast-rail-dock'
const EDGE = 0.28

const TOOLS = [
  { id: 'home', label: '홈', icon: '⌂', to: '/', enabled: true },
  { id: 'chat', label: '챗봇', icon: '✦', to: '/chat', enabled: true },
  { id: 'sports', label: '운동 뉴스', icon: '⚽', to: '/sports', enabled: true },
  { id: 'health', label: '건강 관리', icon: '🏋️', to: '/health', enabled: true },
]

const dock = ref('left')
const dragging = ref(false)
const expanded = ref(false)
const dragPos = ref({ x: 0, y: 0 })
const previewDock = ref(null)
const suppressClick = ref(false)

let startX = 0
let startY = 0
let moved = false
let railW = 112
let railH = 320

const activeId = computed(() => {
  if (route.path === '/') return 'home'
  if (route.path.startsWith('/chat')) return 'chat'
  if (route.path.startsWith('/sports')) return 'sports'
  if (route.path.startsWith('/health')) return 'health'
  return ''
})

const isHorizontal = computed(() => dock.value === 'top' || dock.value === 'bottom')

const railStyle = computed(() => {
  if (!dragging.value) return undefined
  return {
    left: `${dragPos.value.x}px`,
    top: `${dragPos.value.y}px`,
    right: 'auto',
    bottom: 'auto',
    width: `${railW}px`,
    height: `${railH}px`,
    transition: 'none',
  }
})

function onSelect(tool) {
  if (suppressClick.value) return
  if (!tool.enabled || !tool.to) return
  router.push(tool.to)
  // 포커스가 남아 focus로 열린 채 유지되지 않게
  if (typeof document !== 'undefined' && document.activeElement?.blur) {
    document.activeElement.blur()
  }
}

function onRailEnter() {
  if (!dragging.value) expanded.value = true
}

function onRailLeave() {
  if (!dragging.value) expanded.value = false
}

function persistDock(next) {
  dock.value = next
  emit('dock', next)
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    /* ignore */
  }
}

function nearestDock(clientX, clientY) {
  const w = window.innerWidth
  const h = window.innerHeight
  const dists = {
    left: clientX,
    right: w - clientX,
    top: clientY,
    bottom: h - clientY,
  }
  // 가장자리 임계값 안이면 그쪽 우선
  if (clientX / w < EDGE) return 'left'
  if (clientX / w > 1 - EDGE) return 'right'
  if (clientY / h < EDGE) return 'top'
  if (clientY / h > 1 - EDGE) return 'bottom'
  return Object.entries(dists).sort((a, b) => a[1] - b[1])[0][0]
}

function onPointerDown(e) {
  if (e.button != null && e.button !== 0) return
  const el = e.currentTarget.closest('.side-rail')
  if (!el) return
  const rect = el.getBoundingClientRect()
  railW = rect.width
  railH = rect.height
  startX = e.clientX
  startY = e.clientY
  moved = false
  suppressClick.value = false

  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerUp)
}

function onPointerMove(e) {
  const dx = e.clientX - startX
  const dy = e.clientY - startY
  if (!moved && Math.hypot(dx, dy) < 10) return

  if (!moved) {
    moved = true
    dragging.value = true
    suppressClick.value = true
    document.body.classList.add('is-rail-dragging')
  }

  dragPos.value = {
    x: Math.min(Math.max(8, e.clientX - railW / 2), window.innerWidth - railW - 8),
    y: Math.min(Math.max(8, e.clientY - 28), window.innerHeight - railH - 8),
  }
  previewDock.value = nearestDock(e.clientX, e.clientY)
}

function onPointerUp(e) {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('pointercancel', onPointerUp)

  if (dragging.value) {
    const next = nearestDock(e.clientX, e.clientY)
    persistDock(next)
  }

  dragging.value = false
  previewDock.value = null
  document.body.classList.remove('is-rail-dragging')

  // 드래그 중 leave를 무시했으므로, 끝난 뒤 커서 위치에 맞춰 접기/펼치기
  const el = document.querySelector('.side-rail')
  if (el) {
    const r = el.getBoundingClientRect()
    const over =
      e.clientX >= r.left &&
      e.clientX <= r.right &&
      e.clientY >= r.top &&
      e.clientY <= r.bottom
    expanded.value = over
  } else {
    expanded.value = false
  }

  if (moved) {
    setTimeout(() => {
      suppressClick.value = false
    }, 80)
  }
}

watch(
  dock,
  (v) => {
    emit('dock', v)
  },
  { immediate: true },
)

onMounted(() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && ['left', 'right', 'top', 'bottom'].includes(saved)) {
      dock.value = saved
    }
  } catch {
    /* ignore */
  }
})

onUnmounted(() => {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('pointercancel', onPointerUp)
  document.body.classList.remove('is-rail-dragging')
})
</script>

<template>
  <aside
    class="side-rail"
    :class="[
      `side-rail--${dock}`,
      {
        'is-dragging': dragging,
        'is-expanded': expanded,
        'is-horizontal': isHorizontal,
      },
    ]"
    :style="railStyle"
    aria-label="부가 기능"
    @pointerenter="onRailEnter"
    @pointerleave="onRailLeave"
  >
    <div class="side-rail__inner">
      <div
        class="side-rail__brand"
        title="드래그해서 상·하·좌·우에 붙이기"
        @pointerdown="onPointerDown"
      >
        <span class="side-rail__grip" aria-hidden="true">⋮⋮</span>
        <span class="side-rail__logo" aria-hidden="true">☁</span>
        <div class="side-rail__brand-text">
          <strong>AeroCast</strong>
          <small>Tools · 드래그로 이동</small>
        </div>
      </div>

      <ul class="side-rail__list">
        <li v-for="tool in TOOLS" :key="tool.id">
          <button
            type="button"
            class="side-rail__btn"
            :class="{
              'is-active': activeId === tool.id,
              'is-disabled': !tool.enabled,
            }"
            :title="tool.enabled ? tool.label : `${tool.label} (준비 중)`"
            :disabled="!tool.enabled"
            @click="onSelect(tool)"
          >
            <span
              class="side-rail__icon"
              :class="{ 'is-home': tool.id === 'home', 'is-emoji': tool.id === 'sports' || tool.id === 'health' }"
              aria-hidden="true"
              >{{ tool.icon }}</span
            >
            <span class="side-rail__label">{{ tool.label }}</span>
          </button>
        </li>
      </ul>
    </div>
  </aside>

  <Teleport to="body">
    <div v-if="dragging" class="rail-drop-guides" aria-hidden="true">
      <div class="rail-drop-guides__edge is-left" :class="{ 'is-active': previewDock === 'left' }" />
      <div class="rail-drop-guides__edge is-right" :class="{ 'is-active': previewDock === 'right' }" />
      <div class="rail-drop-guides__edge is-top" :class="{ 'is-active': previewDock === 'top' }" />
      <div
        class="rail-drop-guides__edge is-bottom"
        :class="{ 'is-active': previewDock === 'bottom' }"
      />
    </div>
  </Teleport>
</template>

<style scoped>
.side-rail {
  position: fixed;
  z-index: 50;
  box-sizing: border-box;
  padding: 12px 10px;
  border-radius: 24px;
  background: rgba(18, 24, 38, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(28px) saturate(160%);
  -webkit-backdrop-filter: blur(28px) saturate(160%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow:
    0 18px 40px rgba(0, 0, 0, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.14);
  transition:
    width 0.28s cubic-bezier(0.22, 1, 0.36, 1),
    height 0.28s cubic-bezier(0.22, 1, 0.36, 1),
    top 0.28s cubic-bezier(0.22, 1, 0.36, 1),
    left 0.28s cubic-bezier(0.22, 1, 0.36, 1),
    right 0.28s cubic-bezier(0.22, 1, 0.36, 1),
    bottom 0.28s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.28s ease,
    border-color 0.28s ease;
}

.side-rail--left {
  top: 12px;
  left: 12px;
  bottom: 12px;
  width: var(--side-rail-width, 72px);
  height: auto;
}
.side-rail--right {
  top: 12px;
  right: 12px;
  bottom: 12px;
  left: auto;
  width: var(--side-rail-width, 72px);
  height: auto;
}
.side-rail--top {
  top: 12px;
  left: 12px;
  right: 12px;
  bottom: auto;
  width: auto;
  height: 72px;
}
.side-rail--bottom {
  bottom: 12px;
  left: 12px;
  right: 12px;
  top: auto;
  width: auto;
  height: 72px;
}

.side-rail--left.is-expanded:not(.is-dragging) {
  width: var(--side-rail-expanded, 240px);
  z-index: 60;
}
.side-rail--right.is-expanded:not(.is-dragging) {
  width: var(--side-rail-expanded, 240px);
  z-index: 60;
}
.side-rail--top.is-expanded:not(.is-dragging),
.side-rail--bottom.is-expanded:not(.is-dragging) {
  height: 104px;
  z-index: 60;
}

.side-rail.is-dragging {
  z-index: 80;
  width: var(--side-rail-width, 72px) !important;
  height: auto !important;
  min-height: 280px;
  opacity: 0.92;
  cursor: grabbing;
  box-shadow:
    0 30px 70px rgba(0, 0, 0, 0.5),
    0 0 40px rgba(56, 189, 248, 0.25);
}

.side-rail.is-horizontal .side-rail__inner {
  flex-direction: row;
  align-items: center;
  gap: 14px;
  height: 100%;
}

.side-rail.is-horizontal .side-rail__list {
  flex-direction: row;
  flex: 1;
  gap: 8px;
}

.side-rail.is-horizontal .side-rail__btn {
  width: auto;
  min-width: 72px;
  height: 68px;
}

.side-rail.is-horizontal .side-rail__brand {
  justify-content: flex-start;
  padding: 4px;
}

.side-rail.is-horizontal .side-rail__brand-text,
.side-rail.is-horizontal .side-rail__label {
  width: auto;
  opacity: 1;
  transform: none;
}

.side-rail.is-expanded:not(.is-dragging) {
  background: rgba(22, 30, 48, 0.72);
  border-color: rgba(255, 255, 255, 0.22);
  box-shadow:
    0 22px 48px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.16);
}

.side-rail__inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 22px;
  height: 100%;
  min-width: 0;
}

.side-rail__brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  width: 100%;
  min-height: 64px;
  padding: 4px 0;
  border-radius: 18px;
  cursor: grab;
  user-select: none;
  touch-action: none;
}

.side-rail__brand:active {
  cursor: grabbing;
}

.side-rail__grip {
  flex: 0 0 auto;
  width: 0;
  overflow: hidden;
  opacity: 0;
  font-size: 1rem;
  letter-spacing: -0.12em;
  color: rgba(232, 238, 248, 0.35);
  line-height: 1;
  transition:
    width 0.2s ease,
    opacity 0.2s ease;
}

.side-rail--left.is-expanded .side-rail__grip,
.side-rail--right.is-expanded .side-rail__grip,
.side-rail.is-horizontal .side-rail__grip {
  width: 18px;
  opacity: 1;
}

.side-rail--left.is-expanded .side-rail__brand,
.side-rail--right.is-expanded .side-rail__brand {
  justify-content: flex-start;
  padding: 6px;
}

.side-rail__logo {
  flex: 0 0 auto;
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  line-height: 1;
  text-align: center;
  background: linear-gradient(145deg, #38bdf8, #818cf8);
  color: #fff;
  box-shadow: 0 12px 28px rgba(56, 189, 248, 0.4);
}

.side-rail__brand-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  width: 0;
  overflow: hidden;
  opacity: 0;
  transform: translateX(-6px);
  transition:
    opacity 0.22s ease 0.04s,
    transform 0.22s ease 0.04s,
    width 0.22s ease;
  white-space: nowrap;
}

.side-rail--left.is-expanded .side-rail__brand-text,
.side-rail--right.is-expanded .side-rail__brand-text {
  width: auto;
  opacity: 1;
  transform: translateX(0);
}

.side-rail__brand-text strong {
  font-size: 1.1rem;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.02em;
  line-height: 1.15;
}

.side-rail__brand-text small {
  font-size: 0.95rem;
  font-weight: 700;
  color: rgba(232, 238, 248, 0.5);
  margin-top: 2px;
}

.side-rail__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.side-rail__btn {
  width: 100%;
  height: 68px;
  border: 1px solid transparent;
  border-radius: 18px;
  background: transparent;
  color: rgba(232, 238, 248, 0.72);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  padding: 0;
  position: relative;
  overflow: hidden;
  transition:
    background 0.18s ease,
    color 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    justify-content 0.2s ease,
    gap 0.2s ease,
    padding 0.2s ease;
}

.side-rail--left.is-expanded .side-rail__btn,
.side-rail--right.is-expanded .side-rail__btn {
  justify-content: flex-start;
  gap: 16px;
  padding: 0 12px;
}

.side-rail.is-horizontal .side-rail__btn {
  justify-content: flex-start;
  gap: 12px;
  padding: 0 16px;
}

.side-rail__btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.side-rail__btn.is-active {
  background: rgba(56, 189, 248, 0.22);
  border-color: rgba(56, 189, 248, 0.4);
  color: #fff;
  box-shadow: 0 0 22px rgba(56, 189, 248, 0.22);
}

.side-rail__btn.is-disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.side-rail__icon {
  flex: 0 0 auto;
  width: 36px;
  display: grid;
  place-items: center;
  font-size: 1.35rem;
  line-height: 1;
}

.side-rail__icon.is-home {
  font-size: 1.85rem;
  transform: translateY(-1px);
}

.side-rail__icon.is-emoji {
  font-size: 1.45rem;
}

.side-rail__label {
  font-size: 0.95rem;
  font-weight: 750;
  white-space: nowrap;
  width: 0;
  overflow: hidden;
  opacity: 0;
  transform: translateX(-8px);
  transition:
    opacity 0.22s ease 0.05s,
    transform 0.22s ease 0.05s,
    width 0.22s ease;
}

.side-rail--left.is-expanded .side-rail__label,
.side-rail--right.is-expanded .side-rail__label {
  width: auto;
  opacity: 1;
  transform: translateX(0);
}

.side-rail--right .side-rail__btn {
  flex-direction: row-reverse;
}
.side-rail--right .side-rail__brand {
  flex-direction: row-reverse;
}
.side-rail--right .side-rail__brand-text,
.side-rail--right .side-rail__label {
  transform: translateX(8px);
  text-align: right;
}
.side-rail--right.is-expanded .side-rail__brand-text,
.side-rail--right.is-expanded .side-rail__label {
  transform: translateX(0);
}

/* 드롭 가이드 */
.rail-drop-guides {
  position: fixed;
  inset: 0;
  z-index: 70;
  pointer-events: none;
}

.rail-drop-guides__edge {
  position: absolute;
  border-radius: 20px;
  background: rgba(56, 189, 248, 0.08);
  border: 1px dashed rgba(56, 189, 248, 0.35);
  opacity: 0.35;
  transition:
    opacity 0.15s ease,
    background 0.15s ease,
    border-color 0.15s ease;
}

.rail-drop-guides__edge.is-active {
  opacity: 1;
  background: rgba(56, 189, 248, 0.18);
  border-color: rgba(125, 211, 252, 0.85);
  box-shadow: 0 0 30px rgba(56, 189, 248, 0.25);
}

.rail-drop-guides__edge.is-left {
  top: 12px;
  bottom: 12px;
  left: 12px;
  width: var(--side-rail-width, 72px);
}
.rail-drop-guides__edge.is-right {
  top: 12px;
  bottom: 12px;
  right: 12px;
  width: var(--side-rail-width, 72px);
}
.rail-drop-guides__edge.is-top {
  top: 12px;
  left: 12px;
  right: 12px;
  height: 72px;
}
.rail-drop-guides__edge.is-bottom {
  bottom: 12px;
  left: 12px;
  right: 12px;
  height: 72px;
}

@media (max-width: 900px) {
  .side-rail,
  .side-rail--left,
  .side-rail--right,
  .side-rail--top,
  .side-rail--bottom {
    position: static;
    width: 100% !important;
    height: auto !important;
    inset: auto;
  }

  .side-rail__inner {
    flex-direction: row;
    align-items: center;
  }

  .side-rail__list {
    flex-direction: row;
    flex: 1;
  }

  .side-rail__brand-text,
  .side-rail__label {
    width: auto;
    opacity: 1;
    transform: none;
  }

  .side-rail__btn {
    justify-content: flex-start;
    gap: 12px;
    padding: 0 12px;
  }

  .side-rail__grip {
    display: none;
  }

  .rail-drop-guides {
    display: none;
  }
}
</style>
