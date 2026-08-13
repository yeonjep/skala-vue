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
      <p class="page-sub">검색 · 요약 · 즐겨찾기 · 단위 변환이 한 화면에 연결되어 있습니다.</p>
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
  font-size: 0.95rem;
  letter-spacing: 0.12em;
  font-weight: 800;
  color: #5b7c92;
}

.page-title {
  margin: 0 0 8px;
  font-size: 2.6rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #2a3340;
}

.page-sub {
  margin: 0;
  color: rgba(42, 51, 64, 0.62);
  font-size: 1.3rem;
}
</style>
