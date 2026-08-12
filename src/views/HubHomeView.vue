<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useConfigStore } from '@/stores/configStore'
import MonthWeatherCalendar from '@/components/MonthWeatherCalendar.vue'
import { convertTemp } from '@/utils/temperature'

const router = useRouter()
const configStore = useConfigStore()

const spotlight = {
  id: 'city_01',
  name: '서울',
  temp: 28,
  status: '맑음',
  humidity: 45,
}

const displayTemp = computed(() => convertTemp(spotlight.temp, configStore.unit))

const moodLine = computed(() => {
  if (spotlight.temp >= 28) return '더운 하루예요. 수분 챙기고 가볍게 움직여 보세요.'
  if (spotlight.status === '비') return '비 소식이 있어요. 우산 챙기고 천천히 시작해 보세요.'
  return '맑고 가벼운 하루예요. 이번 달 날씨를 한눈에 살펴보세요.'
})

const now = new Date()
const weekdayLine = computed(() =>
  now.toLocaleDateString('en-US', { weekday: 'short' }),
)

const dateLine = computed(() =>
  now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  }),
)
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

    <section class="weather-teaser" @click="router.push(`/weather/${spotlight.id}`)">
      <div class="weather-teaser__left">
        <div class="weather-teaser__icon">☀️</div>
        <div>
          <p class="label">대표 도시</p>
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
  border: none;
  box-shadow: 0 8px 20px rgba(90, 110, 140, 0.1);
  font-size: 1.15rem;
  font-weight: 600;
  color: rgba(42, 51, 64, 0.78);
}

:global(.hub-app--light) .status-strip {
  background: rgba(255, 255, 255, 0.75);
  border-color: rgba(15, 23, 42, 0.08);
  color: #334155;
}

.dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.35);
}

:global(.hub-app--light) .dot {
  background: rgba(15, 23, 42, 0.25);
}

.mood {
  opacity: 0.9;
}

.weather-teaser {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  padding: 22px 22px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.55);
  border: none;
  box-shadow: 0 12px 28px rgba(90, 110, 140, 0.12);
  cursor: pointer;
  transition:
    transform 0.18s ease,
    background 0.18s ease;
}

.weather-teaser:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.72);
}

:global(.hub-app--light) .weather-teaser {
  background: rgba(255, 255, 255, 0.82);
  border-color: rgba(15, 23, 42, 0.08);
}

.weather-teaser__left {
  display: flex;
  gap: 14px;
  align-items: center;
}

.weather-teaser__icon {
  width: 56px;
  height: 56px;
  border-radius: 18px;
  display: grid;
  place-items: center;
  font-size: 1.6rem;
  background: rgba(100, 160, 255, 0.18);
  border: 1px solid rgba(140, 180, 255, 0.3);
}

.label {
  margin: 0;
  font-size: 1rem;
  color: rgba(42, 51, 64, 0.5);
}

:global(.hub-app--light) .label {
  color: #64748b;
}

.weather-teaser h2 {
  margin: 2px 0 4px;
  font-size: 1.55rem;
  color: #2a3340;
}

.meta {
  margin: 0;
  color: rgba(42, 51, 64, 0.7);
  font-size: 1.15rem;
}

:global(.hub-app--light) .meta {
  color: #475569;
}

.weather-teaser__right {
  text-align: right;
}

.big-temp {
  margin: 0 0 6px;
  font-size: 2.6rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #2a3340;
}

.linkish {
  border: none;
  background: transparent;
  color: #3d6680;
  font-weight: 700;
  font-size: 1.15rem;
  cursor: pointer;
  padding: 0;
}

:global(.hub-app--light) .linkish {
  color: #2563eb;
}

@media (max-width: 520px) {
  .weather-teaser {
    flex-direction: column;
    align-items: flex-start;
  }

  .weather-teaser__right {
    text-align: left;
    width: 100%;
  }
}
</style>
