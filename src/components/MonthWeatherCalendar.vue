<script setup>
import { computed, ref, watch } from 'vue'
import { useConfigStore } from '@/stores/configStore'
import { convertTemp } from '@/utils/temperature'
import { CITY_CATALOG, DEFAULT_CITY, findCityById } from '@/data/cities'
import { fetchMonthDaily } from '@/api/openMeteo'

const props = defineProps({
  cityId: { type: String, default: '' },
  lat: { type: Number, default: null },
  lon: { type: Number, default: null },
  cityName: { type: String, default: '' },
})

const configStore = useConfigStore()

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

const activeCity = computed(() => {
  if (props.lat != null && props.lon != null) {
    return {
      name: props.cityName || findCityById(props.cityId)?.name || DEFAULT_CITY.name,
      lat: props.lat,
      lon: props.lon,
    }
  }
  if (props.cityId) return findCityById(props.cityId) || DEFAULT_CITY
  return DEFAULT_CITY || CITY_CATALOG[0]
})

const today = new Date()
const year = today.getFullYear()
const month = today.getMonth()

const dailyMap = ref({})
const isLoading = ref(false)
const loadError = ref('')

function startOfWeekMonday(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const day = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - day)
  return d
}

function dateKey(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

async function loadMonth(city) {
  isLoading.value = true
  loadError.value = ''
  try {
    const map = await fetchMonthDaily({
      lat: city.lat,
      lon: city.lon,
      year,
      monthIndex: month,
    })
    dailyMap.value = map || {}
    if (!Object.keys(dailyMap.value).length) {
      loadError.value = '이번 달 날씨를 불러오지 못했습니다.'
    }
  } catch (err) {
    console.error('[월간 날씨] 실패:', err)
    loadError.value = '이번 달 날씨를 불러오지 못했습니다.'
    dailyMap.value = {}
  } finally {
    isLoading.value = false
  }
}

watch(activeCity, (city) => city && loadMonth(city), { immediate: true })

const monthLabel = computed(() =>
  today.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
)

const monthTitleKo = computed(() =>
  today.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' }),
)

const weeks = computed(() => {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const gridStart = startOfWeekMonday(first)
  const gridEnd = startOfWeekMonday(last)
  gridEnd.setDate(gridEnd.getDate() + 6)

  const rows = []
  const cursor = new Date(gridStart)

  while (cursor <= gridEnd) {
    const week = []
    for (let i = 0; i < 7; i += 1) {
      const y = cursor.getFullYear()
      const m = cursor.getMonth()
      const d = cursor.getDate()
      const inMonth = m === month
      const isToday =
        y === today.getFullYear() && m === today.getMonth() && d === today.getDate()
      const wx = inMonth ? dailyMap.value[dateKey(y, m, d)] : null

      week.push({
        key: `${y}-${m}-${d}`,
        day: d,
        inMonth,
        isToday,
        emoji: wx?.emoji ?? (inMonth ? '·' : ''),
        label: wx?.label ?? '데이터 없음',
        high: wx ? convertTemp(wx.high, configStore.unit) : '—',
        low: wx ? convertTemp(wx.low, configStore.unit) : '—',
        hasData: Boolean(wx),
      })
      cursor.setDate(cursor.getDate() + 1)
    }
    rows.push(week)
  }

  return rows
})
</script>

<template>
  <section class="month-cal" aria-label="이번 달 날씨 캘린더">
    <header class="month-cal__head">
      <div>
        <p class="month-cal__eyebrow">This month · {{ activeCity.name }}</p>
        <h2 class="month-cal__title">{{ monthTitleKo }}</h2>
        <p class="month-cal__credit">Open-Meteo Archive + Forecast</p>
      </div>
      <p class="month-cal__range">{{ monthLabel }}</p>
    </header>

    <p v-if="isLoading" class="month-cal__status">월간 날씨를 불러오는 중…</p>
    <p v-else-if="loadError" class="month-cal__status is-error">{{ loadError }}</p>

    <div class="month-cal__weekdays" aria-hidden="true">
      <span v-for="(wd, i) in WEEKDAYS" :key="`${wd}-${i}`">{{ wd }}</span>
    </div>

    <div class="month-cal__grid">
      <div v-for="(week, wi) in weeks" :key="`w-${wi}`" class="month-cal__week">
        <div
          v-for="cell in week"
          :key="cell.key"
          class="month-cal__day"
          :class="{
            'is-outside': !cell.inMonth,
            'is-today': cell.isToday,
            'is-empty': cell.inMonth && !cell.hasData,
          }"
          :aria-current="cell.isToday ? 'date' : undefined"
        >
          <div class="month-cal__pill">
            <span class="month-cal__date">{{ cell.day }}</span>
            <span class="month-cal__emoji" aria-hidden="true">{{ cell.emoji }}</span>
            <span class="month-cal__temps">
              <span class="hi">{{ cell.high }}{{ cell.hasData ? '°' : '' }}</span>
              <span class="lo">{{ cell.low }}{{ cell.hasData ? '°' : '' }}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.month-cal {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 28px 22px 24px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.58);
  backdrop-filter: blur(18px);
  box-shadow: 0 18px 40px rgba(90, 110, 140, 0.14);
}

.month-cal__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  padding: 0 8px;
}

.month-cal__eyebrow {
  margin: 0 0 6px;
  font-size: 1.15rem;
  font-weight: 600;
  color: rgba(42, 51, 64, 0.48);
}

.month-cal__title {
  margin: 0;
  font-size: 1.9rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #2a3340;
}

.month-cal__credit {
  margin: 6px 0 0;
  font-size: 1.05rem;
  color: rgba(42, 51, 64, 0.42);
}

.month-cal__range {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: rgba(42, 51, 64, 0.48);
}

.month-cal__status {
  margin: 0 8px 12px;
  font-weight: 600;
  color: #3d6680;
}

.month-cal__status.is-error {
  color: #b42318;
}

.month-cal__weekdays {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
  margin-bottom: 10px;
  padding: 0 4px;
}

.month-cal__weekdays span {
  text-align: center;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: rgba(42, 51, 64, 0.42);
}

.month-cal__grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.month-cal__week {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
  padding: 14px 0;
  border-top: 1px solid rgba(90, 110, 140, 0.1);
}

.month-cal__week:first-child {
  border-top: none;
}

.month-cal__day {
  min-width: 0;
  display: flex;
  justify-content: center;
}

.month-cal__pill {
  width: 100%;
  max-width: 118px;
  min-height: 168px;
  padding: 16px 6px 14px;
  border-radius: 999px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  box-sizing: border-box;
}

.month-cal__day.is-today .month-cal__pill {
  background: #fff;
  box-shadow:
    0 14px 32px rgba(90, 110, 140, 0.18),
    0 0 0 1px rgba(255, 255, 255, 0.9);
}

.month-cal__day.is-outside {
  opacity: 0.28;
  pointer-events: none;
}

.month-cal__day.is-empty .month-cal__emoji {
  opacity: 0.35;
}

.month-cal__date {
  font-size: 1.65rem;
  font-weight: 800;
  line-height: 1;
  color: #2a3340;
}

.month-cal__emoji {
  font-size: 2.35rem;
  line-height: 1;
}

.month-cal__temps {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  font-size: 1.15rem;
  font-weight: 700;
  line-height: 1.2;
}

.month-cal__temps .hi {
  color: #2a3340;
}

.month-cal__temps .lo {
  color: rgba(42, 51, 64, 0.45);
}

@media (max-width: 720px) {
  .month-cal {
    padding: 18px 10px 14px;
  }

  .month-cal__pill {
    max-width: none;
    min-height: 132px;
    padding: 12px 2px 10px;
    border-radius: 28px;
    gap: 6px;
  }

  .month-cal__date {
    font-size: 1.25rem;
  }

  .month-cal__emoji {
    font-size: 1.7rem;
  }

  .month-cal__temps {
    font-size: 0.95rem;
  }
}
</style>
