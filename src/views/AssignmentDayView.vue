<script setup>
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import WeatherMockup from '../components/exercise/WeatherMockup.vue'
import WeatherComposition from '../components/exercise/WeatherComposition.vue'
import WeatherParent from '../components/exercise/WeatherParent.vue'

const route = useRoute()

const dayMeta = {
  '1': {
    title: '1일차 · Mockup',
    desc: 'WeatherMockup.vue — 소개(/about)와 이 경로에서 동일 컴포넌트가 렌더됩니다.',
    component: WeatherMockup,
  },
  '2': {
    title: '2일차 · Composition',
    desc: 'WeatherComposition.vue — 소개(/about)와 이 경로에서 동일 컴포넌트가 렌더됩니다.',
    component: WeatherComposition,
  },
  '3': {
    title: '3일차 · Component (WeatherParent)',
    desc: 'WeatherParent.vue — /cities 날씨 탭에서 쓰는 그 부모 컴포넌트입니다. (embedded 없음)',
    component: WeatherParent,
  },
}

const meta = computed(() => dayMeta[route.params.day] || null)
</script>

<template>
  <section v-if="meta" class="lab-day">
    <div class="lab-day__head">
      <div>
        <h2 class="lab-day__title">{{ meta.title }}</h2>
        <p class="lab-day__desc">{{ meta.desc }}</p>
      </div>
      <RouterLink to="/cities" class="lab-day__back">← 날씨로</RouterLink>
    </div>
    <div class="lab-day__body">
      <component :is="meta.component" />
    </div>
  </section>

  <section v-else class="lab-day">
    <h2 class="lab-day__title">존재하지 않는 실습 번호입니다.</h2>
    <RouterLink to="/" class="lab-day__back">← 홈으로</RouterLink>
  </section>
</template>

<style>
@import '@/assets/exercise.css';
</style>

<style scoped>
.lab-day {
  background: rgba(8, 12, 24, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 22px;
  padding: 20px;
  backdrop-filter: blur(16px);
}

.lab-day__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.lab-day__title {
  margin: 0 0 6px;
  font-size: 1.15rem;
  font-weight: 800;
  color: #ffffff;
}

.lab-day__desc {
  margin: 0;
  color: rgba(255, 255, 255, 0.62);
  font-size: 0.88rem;
}

.lab-day__back {
  flex-shrink: 0;
  text-decoration: none;
  color: #9ec5ff;
  font-size: 0.86rem;
  font-weight: 700;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid rgba(140, 180, 255, 0.28);
  background: rgba(100, 150, 255, 0.12);
}

.lab-day__body :deep(.dashboard-wrapper) {
  min-height: auto;
  padding: 0;
}
</style>
