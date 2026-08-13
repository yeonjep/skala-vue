<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useConfigStore } from '@/stores/configStore'
import MonthWeatherCalendar from '@/components/MonthWeatherCalendar.vue'
import { convertTemp } from '@/utils/temperature'
import { DEFAULT_CITY, HOME_CAROUSEL_CITIES } from '@/data/cities'
import { fetchCitiesCurrent } from '@/api/openMeteo'

const router = useRouter()
const configStore = useConfigStore()

const slides = ref([])
const activeIndex = ref(0)
const isLoading = ref(false)
const pauseAuto = ref(false)
const slideDir = ref(1) // 1: 다음(왼쪽으로 나감), -1: 이전

let timer = null
const INTERVAL_MS = 3000

/** 드래그 스와이프 */
const dragX = ref(0)
const isDragging = ref(false)
let startX = 0
let startY = 0
let pointerId = null
let didSwipe = false
const SWIPE_THRESHOLD = 56

const spotlight = computed(
  () =>
    slides.value[activeIndex.value] || {
      id: DEFAULT_CITY.id,
      name: DEFAULT_CITY.name,
      temp: 0,
      status: '불러오는 중',
      humidity: 0,
      emoji: '☁',
    },
)

const displayTemp = computed(() => convertTemp(spotlight.value.temp, configStore.unit))

const moodLine = computed(() => {
  if (isLoading.value) return `${DEFAULT_CITY.name} 실시간 날씨를 확인하는 중이에요.`
  if (spotlight.value.temp >= 28) return '더운 하루예요. 수분 챙기고 가볍게 움직여 보세요.'
  if (String(spotlight.value.status).includes('비')) return '비 소식이 있어요. 우산 챙기고 천천히 시작해 보세요.'
  return '맑고 가벼운 하루예요. 이번 달 날씨를 한눈에 살펴보세요.'
})

const now = new Date()
const weekdayLine = computed(() => now.toLocaleDateString('en-US', { weekday: 'short' }))
const dateLine = computed(() =>
  now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  }),
)

function nextSlide() {
  if (!slides.value.length) return
  slideDir.value = 1
  activeIndex.value = (activeIndex.value + 1) % slides.value.length
}

function prevSlide() {
  if (!slides.value.length) return
  slideDir.value = -1
  activeIndex.value = (activeIndex.value - 1 + slides.value.length) % slides.value.length
}

function goSlide(index) {
  slideDir.value = index > activeIndex.value ? 1 : -1
  activeIndex.value = index
}

function startTimer() {
  stopTimer()
  timer = window.setInterval(() => {
    if (!pauseAuto.value && !isDragging.value) nextSlide()
  }, INTERVAL_MS)
}

function stopTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function onPointerDown(e) {
  if (e.button != null && e.button !== 0) return
  pointerId = e.pointerId
  startX = e.clientX
  startY = e.clientY
  dragX.value = 0
  didSwipe = false
  isDragging.value = true
  pauseAuto.value = true
  e.currentTarget.setPointerCapture?.(e.pointerId)
}

function onPointerMove(e) {
  if (!isDragging.value || e.pointerId !== pointerId) return
  const dx = e.clientX - startX
  const dy = e.clientY - startY
  // 세로 스크롤 우선이면 드래그 취소
  if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 24) {
    isDragging.value = false
    dragX.value = 0
    return
  }
  dragX.value = dx
}

function onPointerUp(e) {
  if (e.pointerId !== pointerId) return
  const dx = dragX.value
  isDragging.value = false
  dragX.value = 0
  pointerId = null

  if (Math.abs(dx) >= SWIPE_THRESHOLD) {
    didSwipe = true
    if (dx < 0) nextSlide()
    else prevSlide()
    startTimer()
    pauseAuto.value = false
    return
  }

  // 짧게 탭이면 상세로 이동
  if (Math.abs(dx) < 8) {
    router.push(`/weather/${spotlight.value.id}`)
  }
  pauseAuto.value = false
}

function onPointerCancel() {
  isDragging.value = false
  dragX.value = 0
  pointerId = null
  pauseAuto.value = false
}

function onCardClick(e) {
  // 스와이프 직후 click 방지
  if (didSwipe) {
    e.preventDefault()
    e.stopPropagation()
    didSwipe = false
  }
}

onMounted(async () => {
  isLoading.value = true
  try {
    slides.value = await fetchCitiesCurrent(HOME_CAROUSEL_CITIES)
    activeIndex.value = 0
    startTimer()
  } catch (err) {
    console.error('[Open-Meteo] 홈 캐러셀 실패:', err)
    slides.value = HOME_CAROUSEL_CITIES.map((c) => ({
      id: c.id,
      name: c.name,
      temp: 0,
      status: '연결 실패',
      humidity: 0,
      emoji: '⚠️',
    }))
  } finally {
    isLoading.value = false
  }
})

onUnmounted(() => {
  stopTimer()
})
</script>

<template>
  <div class="hub-home">
    <header class="date-hero">
      <h1 class="date-hero__date">
        <span class="date-hero__weekday">{{ weekdayLine }},</span>
        {{ dateLine }}
      </h1>
      <p class="date-hero__label">Today</p>
    </header>

    <section class="status-strip">
      <span>{{ spotlight.name }}</span>
      <span class="dot" />
      <span>{{ displayTemp }}{{ configStore.unitSymbol }} · {{ spotlight.status }}</span>
      <span class="dot" />
      <span class="mood">{{ moodLine }}</span>
    </section>

    <section
      class="weather-teaser"
      :class="{ 'is-dragging': isDragging }"
      @mouseenter="pauseAuto = true"
      @mouseleave="pauseAuto = isDragging"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerCancel"
      @click.capture="onCardClick"
    >
      <Transition :name="slideDir >= 0 ? 'slide-next' : 'slide-prev'" mode="out-in">
        <div
          :key="spotlight.id"
          class="weather-teaser__inner"
          :style="isDragging ? { transform: `translateX(${dragX}px)`, transition: 'none' } : undefined"
        >
          <div class="weather-teaser__left">
            <div class="weather-teaser__icon">{{ spotlight.emoji }}</div>
            <div>
              <p class="label">대표 도시 · 드래그/스와이프 · 3초 자동</p>
              <h2>{{ spotlight.name }}</h2>
              <p class="meta">{{ spotlight.status }} · 습도 {{ spotlight.humidity }}%</p>
            </div>
          </div>
          <div class="weather-teaser__right">
            <p class="big-temp">{{ displayTemp }}{{ configStore.unitSymbol }}</p>
            <button type="button" class="linkish" @click.stop="router.push('/cities')">
              자세히 보기 →
            </button>
          </div>
        </div>
      </Transition>

      <div class="carousel-dots" role="tablist" aria-label="도시 선택" @pointerdown.stop @click.stop>
        <button
          v-for="(slide, i) in slides"
          :key="slide.id"
          type="button"
          class="carousel-dot"
          :class="{ 'is-active': i === activeIndex }"
          :aria-label="slide.name"
          :aria-selected="i === activeIndex"
          @click="goSlide(i)"
        />
      </div>
    </section>

    <MonthWeatherCalendar />
  </div>
</template>

<style scoped>
.hub-home {
  display: grid;
  gap: 14px;
}

.date-hero {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: clamp(160px, 22vw, 260px);
  padding: 36px 8px 28px;
}

.date-hero__label {
  margin: 0;
  font-size: clamp(1.9rem, 4vw, 2.8rem);
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.2;
  color: rgba(255, 255, 255, 0.94);
  text-shadow: 0 3px 20px rgba(70, 90, 120, 0.28);
}

.date-hero__date {
  margin: 0 0 10px;
  font-size: clamp(3.4rem, 8vw, 5.5rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1.05;
  color: #fff;
  text-shadow: 0 4px 28px rgba(70, 90, 120, 0.32);
}

.date-hero__weekday {
  font-weight: 400;
  margin-right: 0.18em;
}

.status-strip {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 10px;
  padding: 14px 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.5);
  box-shadow: 0 8px 20px rgba(90, 110, 140, 0.1);
  font-size: 1.15rem;
  font-weight: 600;
  color: rgba(42, 51, 64, 0.78);
}

.dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.25);
}

.mood {
  opacity: 0.9;
}

.weather-teaser {
  position: relative;
  padding: 34px 32px 26px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.55);
  box-shadow: 0 12px 28px rgba(90, 110, 140, 0.12);
  cursor: grab;
  overflow: hidden;
  min-height: 200px;
  touch-action: pan-y;
  user-select: none;
  transition: background 0.18s ease;
}

.weather-teaser.is-dragging {
  cursor: grabbing;
  background: rgba(255, 255, 255, 0.78);
}

.weather-teaser:hover {
  background: rgba(255, 255, 255, 0.72);
}

.weather-teaser__inner {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: center;
}

.weather-teaser__left {
  display: flex;
  gap: 18px;
  align-items: center;
}

.weather-teaser__icon {
  width: 84px;
  height: 84px;
  border-radius: 24px;
  display: grid;
  place-items: center;
  font-size: 2.6rem;
  background: rgba(100, 160, 255, 0.18);
}

.label {
  margin: 0;
  font-size: 1.25rem;
  color: rgba(42, 51, 64, 0.5);
  font-weight: 600;
}

.weather-teaser h2 {
  margin: 6px 0 8px;
  font-size: 2.6rem;
  color: #2a3340;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.meta {
  margin: 0;
  color: rgba(42, 51, 64, 0.7);
  font-size: 1.45rem;
  font-weight: 600;
}

.weather-teaser__right {
  text-align: right;
}

.big-temp {
  margin: 0 0 10px;
  font-size: 4rem;
  font-weight: 800;
  letter-spacing: -0.04em;
  color: #2a3340;
  line-height: 1;
}

.linkish {
  border: none;
  background: transparent;
  color: #3d6680;
  font-weight: 700;
  font-size: 1.4rem;
  cursor: pointer;
  padding: 0;
}

.carousel-dots {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
}

.carousel-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  border: none;
  padding: 0;
  cursor: pointer;
  background: rgba(42, 51, 64, 0.22);
  transition:
    width 0.2s ease,
    background 0.2s ease;
}

.carousel-dot.is-active {
  width: 28px;
  background: #2a3340;
}

.slide-next-enter-active,
.slide-next-leave-active,
.slide-prev-enter-active,
.slide-prev-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.slide-next-enter-from {
  opacity: 0;
  transform: translateX(28px);
}

.slide-next-leave-to {
  opacity: 0;
  transform: translateX(-28px);
}

.slide-prev-enter-from {
  opacity: 0;
  transform: translateX(-28px);
}

.slide-prev-leave-to {
  opacity: 0;
  transform: translateX(28px);
}

@media (max-width: 520px) {
  .weather-teaser__inner {
    flex-direction: column;
    align-items: flex-start;
  }

  .weather-teaser__right {
    text-align: left;
    width: 100%;
  }
}
</style>
