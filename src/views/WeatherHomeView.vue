<script setup>
// cities View — 실제 날씨 UI는 WeatherParent
import WeatherParent from '../components/exercise/WeatherParent.vue'
</script>

<template>
  <div class="weather-home">
    <div class="page-head">
      <div>
        <p class="page-eyebrow">WEATHER</p>
        <h2 class="page-title">전국 날씨</h2>
      </div>
    </div>

    <!-- [3일차] WeatherParent = 실사용 부모 (SearchBar / WeatherCard / BaseDashboardCard 조립) -->
    <WeatherParent embedded />
  </div>
</template>

<style scoped>
.weather-home {
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

.page-head {
  margin-bottom: 14px;
}

.page-eyebrow {
  margin: 0 0 6px;
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  font-weight: 800;
  color: rgba(125, 211, 252, 0.85);
}

.page-title {
  margin: 0 0 6px;
  font-size: clamp(1.35rem, 2.2vw, 1.75rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #e8eef8;
}

.page-sub {
  margin: 0;
  color: rgba(232, 238, 248, 0.62);
  font-size: 0.9rem;
}
</style>
