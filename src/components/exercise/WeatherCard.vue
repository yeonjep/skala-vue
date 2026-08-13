<script setup>
import { computed } from 'vue'
import { useConfigStore } from '@/stores/configStore'
import { useWeatherStore } from '@/stores/weatherStore'
import { useDisplayTemp } from '@/composables/useDisplayTemp'

//  props — 부모(WeatherParent)가 cityItem 객체를 단방향 주입
const props = defineProps({
  cityItem: {
    type: Object,
    required: true,
  },
})

//  emits — 카드 선택·상세보기 클릭 시 부모로 이벤트 전달
const emit = defineEmits(['select-card', 'click-detail'])

const configStore = useConfigStore()
const weatherStore = useWeatherStore()

//  스토어 단위에 따라 표시 온도 변환 
const displayTemp = useDisplayTemp(() => props.cityItem.temp)

const isFavorite = computed(() => weatherStore.isFavorite(props.cityItem.id))

function toggleFavorite() {
  weatherStore.toggleFavorite(props.cityItem.id)
}
</script>

<template>
  <div
    class="weather-card"
    :class="{ 'weather-card--favorite': isFavorite }"
    @click="emit('select-card', `${cityItem.name}이 선택되었습니다.`)"
  >
    <div class="card-header">
      <h4>{{ cityItem.name }} ({{ cityItem.status }})</h4>
      <button type="button" class="favorite-btn" :class="{ active: isFavorite }" @click.stop="toggleFavorite">
        {{ isFavorite ? '★' : '☆' }}
      </button>
    </div>

    <p class="card-temp">현재 기온: {{ displayTemp }}{{ configStore.unitSymbol }}</p>

    <div class="card-tags">
      <span v-if="cityItem.temp >= 25" class="badge hot">더움 (25도 이상)</span>
      <span v-else class="badge cool">선선함 (25도 미만)</span>
      <span v-if="cityItem.humidity != null" class="humidity-badge">습도 {{ cityItem.humidity }}%</span>
    </div>

    <div class="card-footer">
      <button class="btn-detail" @click.stop="emit('click-detail', cityItem.name, cityItem.status)">상세보기</button>
    </div>
  </div>
</template>

<style scoped>
.weather-card {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  overflow: hidden;
  border: none;
  border-radius: 22px;
  margin-bottom: 18px;
  padding: 22px 28px 18px;
  background: rgba(255, 255, 255, 0.62);
  backdrop-filter: blur(20px) saturate(140%);
  -webkit-backdrop-filter: blur(20px) saturate(140%);
  box-shadow: 0 10px 28px rgba(90, 110, 140, 0.12);
  cursor: pointer;
  transition:
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.weather-card--favorite {
  box-shadow: 0 10px 28px rgba(180, 140, 40, 0.18);
}

.weather-card:last-child {
  margin-bottom: 0;
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.weather-card h4 {
  color: #2a3340;
  font-weight: 800;
  font-size: 2.15rem;
  margin: 0;
  letter-spacing: -0.02em;
  line-height: 1.35;
}

.favorite-btn {
  flex-shrink: 0;
  width: auto;
  height: auto;
  padding: 0;
  border: none;
  border-radius: 0;
  background: transparent;
  color: rgba(42, 51, 64, 0.35);
  font-size: 2.1rem;
  line-height: 1;
  cursor: pointer;
  transition: color 0.18s ease, transform 0.18s ease;
}

.favorite-btn:hover {
  color: #d4a017;
  transform: scale(1.08);
}

.favorite-btn.active {
  color: #d4a017;
  border: none;
  background: transparent;
}

.card-temp {
  color: rgba(42, 51, 64, 0.78);
  font-size: 1.55rem;
  margin: 0 0 14px 0;
  font-weight: 600;
  line-height: 1.5;
}

.weather-card:hover {
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 14px 34px rgba(90, 110, 140, 0.16);
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
}

.badge,
.humidity-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 10px 18px;
  border: 1px solid transparent;
  backdrop-filter: blur(6px);
  font-weight: 700;
  font-size: 1.2rem;
  line-height: 1.3;
}

.badge.hot {
  background: rgba(255, 120, 120, 0.18);
  color: #b42318;
  border-color: transparent;
}

.badge.cool {
  background: rgba(100, 150, 210, 0.18);
  color: #175cd3;
  border-color: transparent;
}

.humidity-badge {
  background: rgba(80, 180, 200, 0.16);
  color: #0e7490;
  border-color: transparent;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.btn-detail {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 12px 24px;
  background: rgba(42, 51, 64, 0.08);
  color: #2a3340;
  border: none;
  backdrop-filter: blur(8px);
  border-radius: 14px;
  font-weight: 700;
  font-size: 1.3rem;
  cursor: pointer;
  transition: all 0.18s ease;
  box-shadow: 0 2px 8px rgba(90, 110, 140, 0.1);
}

.btn-detail:hover {
  background: rgba(42, 51, 64, 0.14);
  box-shadow: 0 6px 16px rgba(90, 110, 140, 0.14);
}
</style>
