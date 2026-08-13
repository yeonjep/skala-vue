<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  WATER_TIPS,
  calcBmi,
  fetchExerciseCategories,
  fetchExercises,
  fetchHealthAir,
} from '@/api/healthApi'
import { DEFAULT_CITY } from '@/data/cities'

const loading = ref(false)
const errorMsg = ref('')
const exercises = ref([])
const categories = ref([])
const categoryId = ref('')
const air = ref(null)

const heightCm = ref(170)
const weightKg = ref(65)
const bmiResult = computed(() => calcBmi(heightCm.value, weightKg.value))
const waterTip = WATER_TIPS[new Date().getDate() % WATER_TIPS.length]

const pageIndex = ref(0)
const perPage = 4
const hovering = ref(false)
let timer = null

const pageCount = computed(() => Math.max(1, Math.ceil(exercises.value.length / perPage)))

const pageSlides = computed(() => {
  const pages = []
  for (let i = 0; i < exercises.value.length; i += perPage) {
    pages.push(exercises.value.slice(i, i + perPage))
  }
  return pages.length ? pages : [[]]
})

function nextPage() {
  if (pageCount.value <= 1) return
  pageIndex.value = (pageIndex.value + 1) % pageCount.value
}

function goPage(i) {
  pageIndex.value = i
}

function startAuto() {
  stopAuto()
  timer = window.setInterval(() => {
    if (!hovering.value && !loading.value) nextPage()
  }, 4200)
}

function stopAuto() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

async function loadExercises() {
  loading.value = true
  errorMsg.value = ''
  pageIndex.value = 0
  try {
    const data = await fetchExercises({
      limit: 20,
      category: categoryId.value || undefined,
    })
    exercises.value = data.results
  } catch (err) {
    console.error('[Health]', err)
    errorMsg.value = '운동 데이터를 불러오지 못했습니다. (wger.de)'
  } finally {
    loading.value = false
    startAuto()
  }
}

watch(categoryId, () => {
  loadExercises()
})

onMounted(async () => {
  try {
    categories.value = await fetchExerciseCategories()
  } catch {
    categories.value = []
  }
  await loadExercises()
  air.value = await fetchHealthAir({ lat: DEFAULT_CITY.lat, lon: DEFAULT_CITY.lon })
})

onUnmounted(stopAuto)
</script>

<template>
  <div class="health">
    <header class="health__head">
      <div>
        <p class="health__eyebrow">HEALTH · wger.de + Open-Meteo</p>
        <h2>건강 관리</h2>
        <p class="health__lead">운동 루틴 · BMI · 대기질 기반 야외 운동 가이드</p>
      </div>
    </header>

    <div class="health__tools">
      <section class="health-card">
        <h3>BMI 체크</h3>
        <p class="health-card__hint">키·몸무게는 이 기기에만 쓰이며 서버로 보내지 않습니다.</p>
        <div class="bmi-form">
          <label>
            키 (cm)
            <input v-model.number="heightCm" type="number" min="100" max="250" />
          </label>
          <label>
            몸무게 (kg)
            <input v-model.number="weightKg" type="number" min="30" max="250" step="0.1" />
          </label>
        </div>
        <div v-if="bmiResult" class="bmi-result">
          <strong>{{ bmiResult.bmi }}</strong>
          <span>{{ bmiResult.category }}</span>
          <p>{{ bmiResult.tip }}</p>
        </div>
      </section>

      <section class="health-card">
        <h3>오늘의 수분 · 대기질</h3>
        <p class="water-tip">💧 {{ waterTip }}</p>
        <div v-if="air" class="air-box">
          <p>
            <span>AQI</span>
            <strong>{{ air.aqi ?? '—' }} · {{ air.label }}</strong>
          </p>
          <p class="air-box__tip">{{ air.tip }}</p>
          <small>기준 도시: {{ DEFAULT_CITY.name }} (Open-Meteo Air Quality)</small>
        </div>
        <p v-else class="health-muted">대기질을 불러오는 중이거나 일시적으로 사용할 수 없습니다.</p>
      </section>
    </div>

    <section class="health-card health-card--wide">
      <header class="health-card__head">
        <div>
          <h3>운동 라이브러리</h3>
        </div>
        <select v-model="categoryId" class="health-select">
          <option value="">전체 부위</option>
          <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </header>

      <p v-if="errorMsg" class="health-error">{{ errorMsg }}</p>
      <p v-else-if="loading" class="health-muted">운동 목록 불러오는 중…</p>

      <div
        v-else
        class="ex-carousel"
        @mouseenter="hovering = true"
        @mouseleave="hovering = false"
      >
        <div class="ex-track" :style="{ transform: `translateX(-${pageIndex * 100}%)` }">
          <div v-for="(page, pi) in pageSlides" :key="`page-${pi}`" class="ex-page">
            <article v-for="ex in page" :key="ex.id" class="ex-card">
              <div
                class="ex-card__media"
                :style="ex.image ? { backgroundImage: `url(${ex.image})` } : undefined"
              >
                <span>{{ ex.category }}</span>
              </div>
              <div class="ex-card__body">
                <strong>{{ ex.name }}</strong>
                <p v-if="ex.description">{{ ex.description }}</p>
                <div class="ex-card__tags">
                  <span v-for="m in ex.muscles.slice(0, 3)" :key="m">{{ m }}</span>
                  <span v-for="eq in ex.equipment.slice(0, 2)" :key="eq" class="is-eq">{{ eq }}</span>
                </div>
              </div>
            </article>
          </div>
        </div>

        <div class="ex-controls">
          <button type="button" class="ex-nav" aria-label="이전" @click="goPage((pageIndex - 1 + pageCount) % pageCount)">
            ‹
          </button>
          <div class="ex-dots">
            <button
              v-for="(_, i) in pageSlides"
              :key="`dot-${i}`"
              type="button"
              class="ex-dot"
              :class="{ 'is-active': pageIndex === i }"
              :aria-label="`${i + 1}번째 페이지`"
              @click="goPage(i)"
            />
          </div>
          <button type="button" class="ex-nav" aria-label="다음" @click="nextPage">›</button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.health {
  display: flex;
  flex-direction: column;
  gap: 22px;
  width: 100%;
}

.health__eyebrow {
  margin: 0 0 10px;
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: rgba(74, 222, 128, 0.85);
}

.health__head h2 {
  margin: 0;
  font-size: clamp(2.6rem, 4.5vw, 3.4rem);
  font-weight: 800;
  color: #e8eef8;
}

.health__lead {
  margin: 10px 0 0;
  font-size: 1.45rem;
  color: rgba(232, 238, 248, 0.62);
  font-weight: 600;
}

.health__tools {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

.health-card {
  border-radius: 26px;
  background: rgba(18, 24, 38, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.14);
  padding: 26px;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.28);
  min-width: 0;
}

.health-card--wide {
  padding-bottom: 28px;
}

.health-card h3 {
  margin: 0 0 10px;
  font-size: 1.85rem;
  font-weight: 800;
  color: #fff;
}

.health-card__hint,
.health-muted {
  margin: 0 0 18px;
  font-size: 1.25rem;
  color: rgba(232, 238, 248, 0.55);
  font-weight: 600;
  line-height: 1.45;
}

.bmi-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.bmi-form label {
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 1.3rem;
  font-weight: 750;
  color: rgba(232, 238, 248, 0.78);
}

.bmi-form input,
.health-select {
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 18px;
  padding: 18px 20px;
  min-height: 64px;
  background: rgba(8, 12, 22, 0.55);
  color: #e8eef8;
  font-size: 1.55rem;
  font-weight: 700;
  box-sizing: border-box;
}

.bmi-result {
  margin-top: 20px;
  padding: 18px 20px;
  border-radius: 18px;
  background: rgba(74, 222, 128, 0.12);
  border: 1px solid rgba(74, 222, 128, 0.28);
}

.bmi-result strong {
  font-size: 2.6rem;
  color: #86efac;
  margin-right: 12px;
}

.bmi-result span {
  font-size: 1.45rem;
  font-weight: 800;
  color: #e8eef8;
}

.bmi-result p {
  margin: 10px 0 0;
  font-size: 1.3rem;
  color: rgba(232, 238, 248, 0.75);
  line-height: 1.45;
}

.water-tip {
  margin: 0 0 16px;
  font-size: 1.45rem;
  font-weight: 700;
  color: #e8eef8;
  line-height: 1.5;
}

.air-box {
  padding: 18px 20px;
  border-radius: 18px;
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.28);
}

.air-box p {
  margin: 0 0 10px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 1.35rem;
  font-weight: 750;
  color: #e8eef8;
}

.air-box__tip {
  display: block !important;
  font-size: 1.25rem !important;
  font-weight: 650 !important;
  color: rgba(232, 238, 248, 0.75) !important;
  line-height: 1.45;
}

.air-box small {
  font-size: 1.1rem;
  color: rgba(125, 211, 252, 0.75);
  font-weight: 700;
}

.health-card__head {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  align-items: flex-end;
  margin-bottom: 18px;
}

.health-card__head p {
  margin: 8px 0 0;
  font-size: 1.25rem;
  color: rgba(232, 238, 248, 0.55);
  font-weight: 600;
}

.health-error {
  margin: 0 0 14px;
  padding: 14px 16px;
  border-radius: 14px;
  background: rgba(180, 35, 24, 0.18);
  color: #fecaca;
  font-size: 1.25rem;
  font-weight: 700;
}

.ex-carousel {
  overflow: hidden;
  border-radius: 18px;
}

.ex-track {
  display: flex;
  transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;
}

.ex-page {
  flex: 0 0 100%;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
  min-width: 0;
  padding: 2px;
  box-sizing: border-box;
}

.ex-card {
  border-radius: 22px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  display: flex;
  flex-direction: column;
  min-height: 420px;
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.22);
}

.ex-card__media {
  height: 180px;
  background:
    linear-gradient(145deg, rgba(56, 189, 248, 0.22), rgba(74, 222, 128, 0.16)),
    rgba(0, 0, 0, 0.35);
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: flex-end;
  padding: 14px 16px;
}

.ex-card__media span {
  font-size: 1.15rem;
  font-weight: 800;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(11, 18, 32, 0.78);
  color: #e8eef8;
}

.ex-card__body {
  padding: 20px 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}

.ex-card__body strong {
  font-size: 1.55rem;
  line-height: 1.25;
  color: #fff;
}

.ex-card__body p {
  margin: 0;
  font-size: 1.2rem;
  line-height: 1.5;
  color: rgba(232, 238, 248, 0.68);
  display: -webkit-box;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.ex-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ex-card__tags span {
  font-size: 1.05rem;
  font-weight: 750;
  padding: 7px 12px;
  border-radius: 10px;
  background: rgba(56, 189, 248, 0.16);
  color: #7dd3fc;
}

.ex-card__tags .is-eq {
  background: rgba(74, 222, 128, 0.16);
  color: #86efac;
}

.ex-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 18px;
}

.ex-nav {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.08);
  color: #e8eef8;
  font-size: 1.8rem;
  font-weight: 700;
  cursor: pointer;
  line-height: 1;
}

.ex-nav:hover {
  background: rgba(255, 255, 255, 0.14);
}

.ex-dots {
  display: flex;
  gap: 8px;
}

.ex-dot {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  border: none;
  background: rgba(255, 255, 255, 0.25);
  cursor: pointer;
  padding: 0;
}

.ex-dot.is-active {
  width: 28px;
  background: #4ade80;
}

@media (max-width: 1100px) {
  .ex-page {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .health__tools {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .ex-page {
    grid-template-columns: 1fr;
  }

  .bmi-form {
    grid-template-columns: 1fr;
  }
}
</style>
