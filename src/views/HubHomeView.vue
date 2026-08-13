<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import CurrentWeatherHero from '@/components/dashboard/CurrentWeatherHero.vue'
import SevenDayForecast from '@/components/dashboard/SevenDayForecast.vue'
import FavoriteCitiesPanel from '@/components/dashboard/FavoriteCitiesPanel.vue'
import WorldWeatherPanel from '@/components/dashboard/WorldWeatherPanel.vue'
import WeatherOverviewChart from '@/components/dashboard/WeatherOverviewChart.vue'
import RainRadarPanel from '@/components/dashboard/RainRadarPanel.vue'
import MonthWeatherCalendar from '@/components/MonthWeatherCalendar.vue'
import { CITY_CATALOG, DEFAULT_CITY } from '@/data/cities'
import { WORLD_CITIES } from '@/data/worldCities'
import {
  fetchAirQuality,
  aqiLabel,
  fetchCitiesCurrent,
  fetchDashboardBundle,
  searchCitiesByName,
} from '@/api/openMeteo'
import { convertTemp } from '@/utils/temperature'
import { useConfigStore } from '@/stores/configStore'
import { useWeatherStore } from '@/stores/weatherStore'

const router = useRouter()
const configStore = useConfigStore()
const weatherStore = useWeatherStore()

const selectedCity = ref(DEFAULT_CITY)
const searchQuery = ref('')
const searchLoading = ref(false)
const dashLoading = ref(false)
const citiesLoading = ref(false)
const worldLoading = ref(false)

const current = ref(null)
const daily = ref([])
const hourly = ref([])
const localCities = ref([])
const worldCities = ref([])
const air = ref(null)

const detailOpen = ref(false)
const detailType = ref('current')
const dialogEl = ref(null)
/** normal | minimized | maximized */
const windowMode = ref('normal')

const LAYOUT_KEY = 'aerocast-dash-layout'
const DEFAULT_CARD_ORDER = ['hero', 'forecast', 'world', 'fav', 'chart', 'radar']
const cardOrder = ref([...DEFAULT_CARD_ORDER])
const dragCardId = ref(null)
const dropCardId = ref(null)

function loadCardLayout() {
  try {
    const raw = localStorage.getItem(LAYOUT_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw)
    if (
      Array.isArray(parsed) &&
      parsed.length === DEFAULT_CARD_ORDER.length &&
      DEFAULT_CARD_ORDER.every((id) => parsed.includes(id))
    ) {
      cardOrder.value = parsed
    }
  } catch {
    /* ignore */
  }
}

function persistCardLayout() {
  try {
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(cardOrder.value))
  } catch {
    /* ignore */
  }
}

function onCardDragStart(id, e) {
  dragCardId.value = id
  dropCardId.value = null
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', id)
  const cell = e.currentTarget.closest('.dash__cell')
  if (cell) {
    try {
      e.dataTransfer.setDragImage(cell, Math.min(48, cell.clientWidth / 4), 28)
    } catch {
      /* some browsers */
    }
  }
}

function onCardDragOver(id, e) {
  e.preventDefault()
  e.dataTransfer.dropEffect = 'move'
  if (dragCardId.value && dragCardId.value !== id) dropCardId.value = id
}

function onCardDrop(id, e) {
  e.preventDefault()
  const from = dragCardId.value || e.dataTransfer.getData('text/plain')
  if (!from || from === id) {
    onCardDragEnd()
    return
  }
  const next = [...cardOrder.value]
  const i = next.indexOf(from)
  const j = next.indexOf(id)
  if (i < 0 || j < 0) {
    onCardDragEnd()
    return
  }
  ;[next[i], next[j]] = [next[j], next[i]]
  cardOrder.value = next
  persistCardLayout()
  onCardDragEnd()
  nextTick(() => {
    window.dispatchEvent(new Event('resize'))
  })
}

function onCardDragLeave(id) {
  if (dropCardId.value === id) dropCardId.value = null
}

function onCardDragEnd() {
  dragCardId.value = null
  dropCardId.value = null
}

function resetCardLayout() {
  cardOrder.value = [...DEFAULT_CARD_ORDER]
  persistCardLayout()
  ElMessage.success('카드 배치를 초기화했습니다')
}

const detailTitle = computed(() => {
  const map = {
    current: `${selectedCity.value.name} · 현재 상세`,
    forecast: '7일 예보 상세',
    world: '세계 날씨 상세',
    cities: '즐겨찾기 도시',
    chart: 'Overview 상세',
    radar: '강수 레이더 상세',
  }
  return map[detailType.value] || '상세'
})

const todayLabel = computed(() =>
  new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }),
)

function openDetail(type) {
  if (!type) return
  detailType.value = type
  windowMode.value = 'normal'
  detailOpen.value = true
  nextTick(() => {
    dialogEl.value?.focus?.()
  })
}

function minimizeDetail(e) {
  e?.stopPropagation?.()
  e?.preventDefault?.()
  windowMode.value = 'minimized'
}

function toggleMaximize(e) {
  e?.stopPropagation?.()
  e?.preventDefault?.()
  windowMode.value = windowMode.value === 'maximized' ? 'normal' : 'maximized'
}

function closeDetail(e) {
  e?.stopPropagation?.()
  detailOpen.value = false
  windowMode.value = 'normal'
}

function restoreDetail() {
  windowMode.value = 'normal'
  nextTick(() => dialogEl.value?.focus?.())
}

function onOverlayClick() {
  if (windowMode.value === 'minimized') return
  closeDetail()
}

function onCardDetail(type) {
  openDetail(type)
}

function onGlobalKeydown(e) {
  if (!detailOpen.value) return
  if (e.key === 'Escape') {
    if (windowMode.value === 'maximized') {
      windowMode.value = 'normal'
      return
    }
    if (windowMode.value === 'minimized') {
      restoreDetail()
      return
    }
    closeDetail()
  }
}

watch(detailOpen, (open) => {
  document.body.style.overflow = open && windowMode.value !== 'minimized' ? 'hidden' : ''
})

watch(windowMode, (mode) => {
  if (!detailOpen.value) {
    document.body.style.overflow = ''
    return
  }
  document.body.style.overflow = mode === 'minimized' ? '' : 'hidden'
})

onUnmounted(() => {
  document.body.style.overflow = ''
  window.removeEventListener('keydown', onGlobalKeydown)
})

async function loadDashboard(city = selectedCity.value) {
  dashLoading.value = true
  try {
    const data = await fetchDashboardBundle({ lat: city.lat, lon: city.lon })
    current.value = data.current
    daily.value = data.daily
    hourly.value = data.hourly
    try {
      air.value = await fetchAirQuality({ lat: city.lat, lon: city.lon })
    } catch {
      air.value = null
    }
  } catch (err) {
    console.error('[Dashboard]', err)
    ElMessage.error('날씨 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')
  } finally {
    dashLoading.value = false
  }
}

async function loadLocalCities() {
  citiesLoading.value = true
  try {
    localCities.value = await fetchCitiesCurrent(CITY_CATALOG)
  } catch (err) {
    console.error(err)
    ElMessage.warning('즐겨찾기 도시 날씨를 일부만 불러오지 못했습니다.')
  } finally {
    citiesLoading.value = false
  }
}

async function loadWorld() {
  worldLoading.value = true
  try {
    const rows = await fetchCitiesCurrent(WORLD_CITIES)
    worldCities.value = WORLD_CITIES.map((c) => {
      const wx = rows.find((r) => r.id === c.id)
      return {
        ...c,
        temp: wx?.temp ?? null,
        emoji: wx?.emoji ?? '☁',
        status: wx?.status ?? '',
      }
    })
  } catch (err) {
    console.error(err)
    // 날씨 없이도 지도는 도시 좌표로 표시
    worldCities.value = WORLD_CITIES.map((c) => ({
      ...c,
      temp: null,
      emoji: '☁',
      status: '',
    }))
  } finally {
    worldLoading.value = false
  }
}

function onSelectFavorite(city) {
  selectedCity.value = city
  weatherStore.addRecentSearch(city.name)
}

async function onSearch() {
  const q = searchQuery.value.trim()
  if (!q) return
  searchLoading.value = true
  weatherStore.addRecentSearch(q)
  try {
    const localHit = CITY_CATALOG.find(
      (c) => c.name.includes(q) || c.english.toLowerCase().includes(q.toLowerCase()),
    )
    if (localHit) {
      selectedCity.value = localHit
      ElMessage.success(`${localHit.name} 날씨로 이동`)
      return
    }
    const results = await searchCitiesByName(q, 1)
    if (!results.length) {
      ElMessage.warning('검색 결과가 없습니다.')
      return
    }
    selectedCity.value = results[0]
    ElMessage.success(`${results[0].name} 날씨를 불러옵니다`)
  } catch (err) {
    console.error(err)
    ElMessage.error('도시 검색에 실패했습니다.')
  } finally {
    searchLoading.value = false
  }
}

watch(
  selectedCity,
  (city) => {
    if (city) loadDashboard(city)
  },
  { immediate: true },
)

onMounted(async () => {
  loadCardLayout()
  window.addEventListener('keydown', onGlobalKeydown)
  // 한도/폴백 대비: 즐겨찾기 → 세계 순으로 로드 (병렬 폭주 방지)
  await loadLocalCities()
  await loadWorld()
})
</script>

<template>
  <div class="dash">
    <div class="dash__top">
      <div>
        <p class="dash__eyebrow">WEATHER DASHBOARD</p>
        <h1 class="dash__title">{{ todayLabel }}</h1>
      </div>

      <div class="dash__searchbar glass-card">
        <div class="dash__search-field">
          <span class="dash__search-icon" aria-hidden="true">⌕</span>
          <input
            v-model="searchQuery"
            type="search"
            placeholder="도시 이름을 검색하세요 (예: Seoul, 도쿄)"
            @keyup.enter="onSearch"
          />
        </div>

        <button
          type="button"
          class="ac-btn ac-btn--primary ac-btn--lg"
          :disabled="searchLoading"
          @click="onSearch"
        >
          {{ searchLoading ? 'Searching…' : 'Search' }}
        </button>
        <button
          v-if="String(selectedCity.id || '').startsWith('city_')"
          type="button"
          class="ac-btn ac-btn--ghost ac-btn--lg"
          @click="router.push(`/weather/${selectedCity.id}`)"
        >
          Detail
        </button>
      </div>
    </div>

    <div class="dash__layout-hint">
      <span>카드 왼쪽 위 ⋮⋮ 를 드래그하면 자리 교환 · 자동 정렬됩니다</span>
      <button type="button" class="dash__layout-reset" @click="resetCardLayout">배치 초기화</button>
    </div>

    <div class="dash__grid">
      <div
        v-for="cardId in cardOrder"
        :key="cardId"
        class="dash__cell"
        :class="{
          'is-dragging': dragCardId === cardId,
          'is-drop-target': dropCardId === cardId,
          [`dash__cell--${cardId}`]: true,
        }"
        @dragover="onCardDragOver(cardId, $event)"
        @drop="onCardDrop(cardId, $event)"
        @dragleave="onCardDragLeave(cardId)"
      >
        <button
          type="button"
          class="dash__drag-handle"
          title="드래그해서 다른 카드와 자리 바꾸기"
          aria-label="카드 위치 이동"
          draggable="true"
          @click.stop.prevent
          @dragstart="onCardDragStart(cardId, $event)"
          @dragend="onCardDragEnd"
        >
          ⋮⋮
        </button>

        <CurrentWeatherHero
          v-if="cardId === 'hero'"
          class="dash__card"
          :city="selectedCity"
          :current="current"
          :loading="dashLoading"
          @show-detail="onCardDetail('current')"
        />

        <SevenDayForecast
          v-else-if="cardId === 'forecast'"
          class="dash__card"
          :days="daily"
          :loading="dashLoading"
          @show-detail="onCardDetail('forecast')"
        />

        <WorldWeatherPanel
          v-else-if="cardId === 'world'"
          class="dash__card"
          :cities="worldCities"
          :loading="worldLoading"
          @show-detail="onCardDetail('world')"
        />

        <FavoriteCitiesPanel
          v-else-if="cardId === 'fav'"
          class="dash__card"
          :city-weather="localCities"
          :loading="citiesLoading"
          @select="onSelectFavorite"
          @show-detail="onCardDetail('cities')"
        />

        <WeatherOverviewChart
          v-else-if="cardId === 'chart'"
          class="dash__card"
          :hourly="hourly"
          :daily="daily"
          :loading="dashLoading"
          @show-detail="onCardDetail('chart')"
        />

        <div
          v-else-if="cardId === 'radar'"
          class="dash__card dash__radar glass-card is-clickable"
          role="button"
          tabindex="0"
          @click="onCardDetail('radar')"
          @keyup.enter="onCardDetail('radar')"
        >
          <RainRadarPanel
            :lat="selectedCity.lat"
            :lon="selectedCity.lon"
            :city-name="selectedCity.name"
          />
        </div>
      </div>
    </div>

    <section class="dash__calendar glass-card">
      <header class="dash__calendar-head">
        <h3>{{ selectedCity.name }} Monthly</h3>
        <p>Open-Meteo Archive + Forecast</p>
      </header>
      <MonthWeatherCalendar
        :city-id="selectedCity.id"
        :lat="selectedCity.lat"
        :lon="selectedCity.lon"
        :city-name="selectedCity.name"
      />
    </section>

    <Teleport to="body">
      <Transition name="mac-fade">
        <div
          v-if="detailOpen"
          class="mac-overlay"
          :class="{
            'is-minimized': windowMode === 'minimized',
            'is-maximized': windowMode === 'maximized',
          }"
          role="presentation"
          @click.self="onOverlayClick"
        >
          <!-- 최소화 상태: 하단 독 바 -->
          <button
            v-if="windowMode === 'minimized'"
            type="button"
            class="mac-dock"
            :aria-label="`${detailTitle} 복원`"
            @click.stop="restoreDetail"
          >
            <span class="mac-dock__title">{{ detailTitle }}</span>
            <span class="mac-dock__hint">클릭해서 복원</span>
          </button>

          <section
            v-show="windowMode !== 'minimized'"
            class="mac-window"
            :class="{
              'is-maximized': windowMode === 'maximized',
              'is-hidden-min': windowMode === 'minimized',
            }"
            role="dialog"
            aria-modal="true"
            :aria-label="detailTitle"
            tabindex="-1"
            ref="dialogEl"
          >
            <header class="mac-window__bar">
              <div class="mac-traffic" @click.stop>
                <button
                  type="button"
                  class="mac-dot mac-dot--close"
                  title="닫기"
                  aria-label="닫기"
                  @click.stop.prevent="closeDetail"
                />
                <button
                  type="button"
                  class="mac-dot mac-dot--min"
                  title="최소화"
                  aria-label="최소화"
                  @click.stop.prevent="minimizeDetail"
                />
                <button
                  type="button"
                  class="mac-dot mac-dot--max"
                  :title="windowMode === 'maximized' ? '이전 크기로' : '전체 화면'"
                  :aria-label="windowMode === 'maximized' ? '이전 크기로' : '전체 화면'"
                  @click.stop.prevent="toggleMaximize"
                />
              </div>
              <p class="mac-window__title">{{ detailTitle }}</p>
              <span class="mac-window__spacer" />
            </header>

            <div
              class="mac-window__body"
              :class="{
                'is-chart': detailType === 'chart',
                'is-forecast': detailType === 'forecast',
              }"
            >
              <div v-if="detailType === 'current'" class="detail">
                <p class="detail__lead">
                  {{ current?.emoji }} {{ current?.status }} ·
                  {{ current ? convertTemp(current.temp, configStore.unit) : '—'
                  }}{{ configStore.unitSymbol }}
                </p>
                <div class="detail__grid">
                  <div class="detail__item">
                    <span>Wind</span><strong>{{ current?.wind ?? '—' }} m/s</strong>
                  </div>
                  <div class="detail__item">
                    <span>Humidity</span><strong>{{ current?.humidity ?? '—' }}%</strong>
                  </div>
                  <div class="detail__item">
                    <span>Visibility</span>
                    <strong>{{
                      current?.visibilityKm != null ? `${current.visibilityKm} km` : '—'
                    }}</strong>
                  </div>
                  <div class="detail__item">
                    <span>Precip</span>
                    <strong>{{
                      current?.precipitation != null ? `${current.precipitation} mm` : '—'
                    }}</strong>
                  </div>
                  <div class="detail__item">
                    <span>AQI</span>
                    <strong>{{ air?.aqi ?? '—' }} · {{ aqiLabel(air?.aqi) }}</strong>
                  </div>
                  <div class="detail__item">
                    <span>PM2.5</span><strong>{{ air?.pm25 ?? '—' }}</strong>
                  </div>
                </div>
              </div>

              <SevenDayForecast
                v-else-if="detailType === 'forecast'"
                :days="daily"
                :interactive="false"
              />
              <WorldWeatherPanel
                v-else-if="detailType === 'world'"
                tall
                :interactive="false"
                :cities="worldCities"
              />
              <FavoriteCitiesPanel
                v-else-if="detailType === 'cities'"
                :interactive="false"
                :city-weather="localCities"
                @select="
                  (c) => {
                    onSelectFavorite(c)
                    closeDetail()
                  }
                "
              />
              <WeatherOverviewChart
                v-else-if="detailType === 'chart'"
                :interactive="false"
                fill
                :hourly="hourly"
                :daily="daily"
              />
              <RainRadarPanel
                v-else-if="detailType === 'radar'"
                compact
                :lat="selectedCity.lat"
                :lon="selectedCity.lon"
                :city-name="selectedCity.name"
              />
            </div>
          </section>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style>
.dash__calendar :deep(.month-cal) {
  background: transparent;
  box-shadow: none;
  backdrop-filter: none;
  padding: 8px 4px 4px;
  color: #e8eef8;
}

.dash__calendar :deep(.month-cal__title),
.dash__calendar :deep(.month-cal__date),
.dash__calendar :deep(.month-cal__temps .hi) {
  color: #fff;
}

.dash__calendar :deep(.month-cal__eyebrow),
.dash__calendar :deep(.month-cal__credit),
.dash__calendar :deep(.month-cal__range),
.dash__calendar :deep(.month-cal__weekdays span),
.dash__calendar :deep(.month-cal__temps .lo) {
  color: rgba(232, 238, 248, 0.5);
}

.dash__calendar :deep(.month-cal__day.is-today .month-cal__pill) {
  background: rgba(255, 255, 255, 0.95);
}

.dash__calendar :deep(.month-cal__day.is-today .month-cal__date),
.dash__calendar :deep(.month-cal__day.is-today .month-cal__temps .hi) {
  color: #0b1220;
}

/* macOS 스타일 팝업 — body 포탈용 글로벌 */
.mac-overlay {
  position: fixed !important;
  inset: 0 !important;
  z-index: 10000 !important;
  display: grid !important;
  place-items: center !important;
  padding: 20px !important;
  background: rgba(0, 0, 0, 0.55) !important;
  backdrop-filter: blur(12px) !important;
  -webkit-backdrop-filter: blur(12px) !important;
  transition:
    background 0.2s ease,
    backdrop-filter 0.2s ease !important;
}

.mac-overlay.is-minimized {
  place-items: end center !important;
  padding: 0 20px 22px !important;
  background: transparent !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  pointer-events: none !important;
}

.mac-overlay.is-maximized {
  padding: 8px !important;
  place-items: stretch center !important;
}

.mac-dock {
  pointer-events: auto !important;
  appearance: none !important;
  -webkit-appearance: none !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 16px !important;
  max-width: min(640px, 94vw) !important;
  margin: 0 !important;
  padding: 16px 22px !important;
  border: 1px solid rgba(255, 255, 255, 0.22) !important;
  border-radius: 20px !important;
  background: rgba(28, 34, 48, 0.96) !important;
  backdrop-filter: blur(22px) !important;
  -webkit-backdrop-filter: blur(22px) !important;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5) !important;
  color: #fff !important;
  cursor: pointer !important;
  font: inherit !important;
  animation: mac-dock-in 0.22s ease-out;
}

.mac-dock:hover {
  border-color: rgba(125, 211, 252, 0.55) !important;
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.5), 0 0 24px rgba(56, 189, 248, 0.2) !important;
}

.mac-dock__title {
  font-size: 1.35rem !important;
  font-weight: 800 !important;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #fff !important;
}

.mac-dock__hint {
  font-size: 1.15rem !important;
  font-weight: 700 !important;
  color: rgba(232, 238, 248, 0.6) !important;
  white-space: nowrap;
}

@keyframes mac-dock-in {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.mac-window {
  width: min(1280px, 96vw) !important;
  height: min(88vh, 920px) !important;
  max-height: min(88vh, 920px) !important;
  display: flex !important;
  flex-direction: column !important;
  border-radius: 18px !important;
  overflow: hidden !important;
  background: rgba(40, 44, 52, 0.94) !important;
  border: 1px solid rgba(255, 255, 255, 0.18) !important;
  box-shadow:
    0 30px 80px rgba(0, 0, 0, 0.55),
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    0 0 40px rgba(56, 189, 248, 0.12) !important;
  backdrop-filter: blur(28px) saturate(160%) !important;
  -webkit-backdrop-filter: blur(28px) saturate(160%) !important;
  color: #e8eef8 !important;
  outline: none !important;
  font-size: 1.25rem !important;
  transition:
    width 0.22s ease,
    height 0.22s ease,
    max-height 0.22s ease,
    border-radius 0.22s ease !important;
}

.mac-window.is-maximized {
  width: 98vw !important;
  max-width: 98vw !important;
  height: 96vh !important;
  max-height: 96vh !important;
  border-radius: 14px !important;
}

.mac-window.is-hidden-min {
  display: none !important;
}

.mac-window__bar {
  display: grid;
  grid-template-columns: 140px 1fr 140px;
  align-items: center;
  gap: 8px;
  min-height: 72px;
  padding: 0 20px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0.04));
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.mac-traffic {
  display: inline-flex;
  gap: 14px;
  align-items: center;
  padding: 6px 4px;
}

.mac-dot {
  width: 22px !important;
  height: 22px !important;
  min-width: 22px !important;
  min-height: 22px !important;
  border: none !important;
  border-radius: 50% !important;
  padding: 0 !important;
  margin: 0 !important;
  cursor: pointer !important;
  box-shadow:
    inset 0 0 0 0.5px rgba(0, 0, 0, 0.3),
    0 1px 2px rgba(0, 0, 0, 0.25) !important;
  transition: transform 0.12s ease, filter 0.12s ease;
  position: relative;
}

/* 클릭 영역 확대 */
.mac-dot::after {
  content: '';
  position: absolute;
  inset: -10px;
}

.mac-dot:hover {
  transform: scale(1.14);
  filter: brightness(1.1);
}

.mac-dot:active {
  transform: scale(0.94);
}

.mac-dot--close {
  background: #ff5f57 !important;
}
.mac-dot--min {
  background: #febc2e !important;
}
.mac-dot--max {
  background: #28c840 !important;
}

.mac-window__title {
  margin: 0;
  text-align: center;
  font-size: 1.55rem;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.95);
  letter-spacing: -0.01em;
}

.mac-window__spacer {
  display: block;
}

.mac-window__body {
  padding: 28px 32px;
  overflow: auto;
  color: #e8eef8;
  flex: 1 1 auto;
  min-height: 0;
  font-size: 1.3rem;
}

.mac-window__body.is-chart {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 20px 24px 24px;
}

.mac-window__body.is-forecast {
  display: flex;
  flex-direction: column;
  overflow: auto;
}

.mac-window__body :deep(.glass-card) {
  min-height: 560px;
  height: 100%;
  background: rgba(255, 255, 255, 0.06) !important;
}

.mac-window__body.is-chart :deep(.glass-card),
.mac-window__body.is-chart :deep(.chart) {
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
  max-height: none;
}

.mac-window__body.is-forecast :deep(.forecast) {
  min-height: 0;
  height: auto;
}

.mac-window__body.is-forecast :deep(.forecast__list) {
  gap: 10px;
}

.mac-window__body.is-forecast :deep(.forecast__row) {
  padding: 16px 16px;
  font-size: 1.35rem;
}

.mac-fade-enter-active,
.mac-fade-leave-active {
  transition: opacity 0.16s ease;
}
.mac-fade-enter-active .mac-window,
.mac-fade-leave-active .mac-window {
  transition: transform 0.18s ease, opacity 0.16s ease;
}
.mac-fade-enter-from,
.mac-fade-leave-to {
  opacity: 0;
}
.mac-fade-enter-from .mac-window,
.mac-fade-leave-to .mac-window {
  opacity: 0;
  transform: scale(0.96) translateY(8px);
}
</style>

<style scoped>
.dash {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.dash__top {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dash__eyebrow {
  margin: 0 0 6px;
  font-size: 0.85rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  color: rgba(56, 189, 248, 0.95);
}

.dash__title {
  margin: 0;
  font-size: clamp(1.35rem, 2.2vw, 1.75rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #fff;
}

.dash__searchbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  flex-wrap: wrap;
  min-height: 44px;
}

.dash__search-field {
  flex: 1;
  min-width: 240px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.14);
}

.dash__search-icon {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.35rem;
  line-height: 1;
  opacity: 0.85;
  color: rgba(232, 238, 248, 0.9);
  transform: translateY(1px);
}

.dash__search-field input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
}

.dash__search-field input::placeholder {
  color: rgba(232, 238, 248, 0.42);
}

.dash__layout-hint {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin: -4px 0 4px;
  font-size: 1.05rem;
  font-weight: 650;
  color: rgba(232, 238, 248, 0.5);
}

.dash__layout-reset {
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.08);
  color: #e8eef8;
  border-radius: 999px;
  padding: 8px 14px;
  font-size: 0.95rem;
  font-weight: 750;
  cursor: pointer;
}

.dash__layout-reset:hover {
  background: rgba(255, 255, 255, 0.14);
}

.dash__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  align-items: stretch;
}

.dash__cell {
  position: relative;
  min-width: 0;
  min-height: 180px;
  display: flex;
  flex-direction: column;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    outline-color 0.18s ease;
}

.dash__cell > .dash__card,
.dash__cell > .glass-card {
  flex: 1 1 auto;
  width: 100%;
  min-width: 0;
  min-height: 100%;
  box-sizing: border-box;
}

.dash__drag-handle {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 8;
  width: 34px;
  height: 34px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 10px;
  background: rgba(11, 18, 32, 0.72);
  color: rgba(232, 238, 248, 0.55);
  font-size: 0.85rem;
  letter-spacing: -0.12em;
  cursor: grab;
  display: grid;
  place-items: center;
  opacity: 0.55;
  transition:
    opacity 0.15s ease,
    background 0.15s ease,
    color 0.15s ease;
}

.dash__cell:hover .dash__drag-handle,
.dash__drag-handle:focus-visible {
  opacity: 1;
}

.dash__drag-handle:active {
  cursor: grabbing;
}

.dash__cell.is-dragging {
  opacity: 0.45;
  transform: scale(0.985);
}

.dash__cell.is-drop-target {
  outline: 2px solid rgba(56, 189, 248, 0.75);
  outline-offset: 2px;
  border-radius: 26px;
  box-shadow: 0 0 0 6px rgba(56, 189, 248, 0.12);
}

.dash__radar {
  padding: 0;
  overflow: hidden;
  cursor: pointer;
  min-height: 180px;
}

.dash__calendar {
  padding: 18px 14px 10px;
}

.dash__calendar-head {
  padding: 0 10px 8px;
}

.dash__calendar-head h3 {
  margin: 0;
  font-size: 1.55rem;
  font-weight: 800;
  color: #fff;
}

.dash__calendar-head p {
  margin: 4px 0 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: rgba(232, 238, 248, 0.5);
}

.detail__lead {
  margin: 0 0 18px;
  font-size: 2rem;
  font-weight: 800;
  color: #fff;
}

.detail__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.detail__item {
  padding: 18px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.detail__item span {
  display: block;
  margin-bottom: 8px;
  font-size: 1.2rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(232, 238, 248, 0.55);
}

.detail__item strong {
  font-size: 1.6rem;
  font-weight: 800;
  color: #fff;
}

@media (max-width: 1200px) {
  .dash__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .dash__grid {
    grid-template-columns: 1fr;
  }

  .dash__cell {
    min-height: 200px;
  }

  .detail__grid {
    grid-template-columns: 1fr 1fr;
  }

  .mac-window__bar {
    grid-template-columns: 78px 1fr;
  }

  .mac-window__spacer {
    display: none;
  }
}
</style>
