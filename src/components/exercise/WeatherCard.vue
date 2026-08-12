<script setup>
// [3일차 과제] props — 부모(WeatherParent)가 cityItem 객체를 단방향 주입
defineProps({
  cityItem: {
    type: Object,
    required: true,
  },
})

// [3일차 과제] emits — 카드 선택·상세보기 클릭 시 부모로 이벤트 전달
const emit = defineEmits(['select-card', 'click-detail'])
</script>

<template>
  <div class="weather-card" @click="emit('select-card', `${cityItem.name}이 선택되었습니다.`)">
    <h4>{{ cityItem.name }} ({{ cityItem.status }})</h4>
    <p>현재 기온: {{ cityItem.temp }}°C</p>

    <div class="card-tags">
      <span v-if="cityItem.temp >= 25" class="badge hot">더움 (25도 이상)</span>
      <span v-else class="badge cool">선선함 (25도 미만)</span>
      <!-- [실습과제 코드 추가 : 습도(humidity) 표시] -->
      <span v-if="cityItem.humidity != null" class="humidity-badge">습도 {{ cityItem.humidity }}%</span>
    </div>

    <button class="btn-detail" @click.stop="emit('click-detail', cityItem.name, cityItem.status)">상세보기</button>
  </div>
</template>

<style scoped>
.weather-card {
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 18px;
  margin-bottom: 16px;
  padding: 18px 20px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(18px) saturate(140%);
  -webkit-backdrop-filter: blur(18px) saturate(140%);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.28);
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.weather-card:last-child {
  margin-bottom: 0;
}

.weather-card h4 {
  color: #ffffff;
  font-weight: 700;
  font-size: 1.05rem;
  margin: 0 0 10px 0;
}

.weather-card p {
  color: rgba(255, 255, 255, 0.78);
  font-size: 0.95rem;
  margin: 0 0 14px 0;
}

.weather-card:hover {
  border-color: rgba(160, 190, 255, 0.35);
  background: rgba(255, 255, 255, 0.09);
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.38);
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.badge,
.humidity-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 6px 13px;
  border: 1px solid transparent;
  backdrop-filter: blur(6px);
  font-weight: 600;
  font-size: 0.8rem;
  line-height: 1.3;
  transition: all 0.15s ease;
}

.badge.hot {
  background: rgba(255, 99, 99, 0.16);
  color: #ffc4c4;
  border-color: rgba(255, 99, 99, 0.4);
}

.badge.cool {
  background: rgba(90, 170, 255, 0.16);
  color: #b8dcff;
  border-color: rgba(90, 170, 255, 0.4);
}

.humidity-badge {
  background: rgba(0, 200, 230, 0.12);
  color: #8eeaff;
  border-color: rgba(0, 200, 230, 0.35);
}

.btn-detail {
  display: inline-block;
  margin-top: 4px;
  padding: 10px 18px;
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.28);
  backdrop-filter: blur(8px);
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
  transition: all 0.18s ease;
}

.btn-detail:hover {
  background: rgba(255, 255, 255, 0.16);
  border-color: rgba(180, 210, 255, 0.55);
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.3);
}
</style>
