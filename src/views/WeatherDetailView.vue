<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConfigStore } from '@/stores/configStore'
import { useDisplayTemp } from '@/composables/useDisplayTemp'
import { findCityById } from '@/data/cities'
import { fetchCurrentWeather, fetchAirQuality, aqiLabel } from '@/api/openMeteo'
import { discomfortIndex, diLabel } from '@/utils/weatherMood'
import WeatherBuddy from '@/components/weather/WeatherBuddy.vue'

const route = useRoute()
const router = useRouter()
const configStore = useConfigStore()

const cityData = ref(null)
const airData = ref(null)
const isLoading = ref(false)
const loadError = ref('')

const displayTemp = useDisplayTemp(() => cityData.value?.temp ?? 0)
const di = computed(() =>
  cityData.value ? discomfortIndex(cityData.value.temp, cityData.value.humidityNum) : null,
)

onMounted(async () => {
  const city = findCityById(String(route.params.cityId))
  if (!city) return

  isLoading.value = true
  loadError.value = ''
  try {
    const [weather, air] = await Promise.all([
      fetchCurrentWeather({ lat: city.lat, lon: city.lon }),
      fetchAirQuality({ lat: city.lat, lon: city.lon }),
    ])

    cityData.value = {
      name: city.label,
      shortName: city.name,
      temp: weather.temp,
      status: weather.status,
      emoji: weather.emoji,
      humidityNum: weather.humidity,
      humidity: `${weather.humidity}%`,
      wind: `${weather.wind}m/s`,
      weatherCode: weather.weatherCode,
    }
    airData.value = air
  } catch (err) {
    console.error('[Open-Meteo] 상세 로딩 실패:', err)
    loadError.value = '상세 날씨·대기질을 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="detail-page">
    <header class="detail-head">
      <div>
        <p class="detail-eyebrow">WEATHER DETAIL · NUBI</p>
        <h3>지역별 상세 기상</h3>
        <p class="api-credit">Open-Meteo · 불쾌지수 · 오리지널 캐릭터 누비</p>
      </div>
      <button type="button" class="back-btn" @click="router.push('/cities')">대시보드로</button>
    </header>

    <p v-if="isLoading" class="load-msg">실시간 데이터를 동기화하는 중입니다…</p>
    <p v-else-if="loadError" class="empty-result">{{ loadError }}</p>

    <template v-else>
      <WeatherBuddy
        v-if="cityData"
        :temp-c="cityData.temp"
        :humidity="cityData.humidityNum"
        :status="cityData.status"
        :weather-code="cityData.weatherCode"
        :city-name="cityData.shortName"
      />

      <div v-if="cityData" class="detail-grid">
        <div class="info-card">
          <h4>{{ cityData.emoji }} {{ cityData.name }}</h4>
          <p>
            실시간 기온:
            <strong>{{ displayTemp }}{{ configStore.unitSymbol }}</strong>
          </p>
          <p>기상 현황: {{ cityData.status }}</p>
          <p>대기 습도: {{ cityData.humidity }}</p>
          <p>현재 풍속: {{ cityData.wind }}</p>
          <p>
            불쾌지수:
            <strong>{{ di ?? '—' }}</strong>
            <span class="aqi-badge">{{ diLabel(di) }}</span>
          </p>
        </div>

        <div v-if="airData" class="info-card air-card">
          <h4>대기질 (외부 API)</h4>
          <p>
            유럽 AQI: <strong>{{ airData.aqi ?? '—' }}</strong>
            <span class="aqi-badge">{{ aqiLabel(airData.aqi) }}</span>
          </p>
          <p>PM2.5: {{ airData.pm25 != null ? `${airData.pm25} μg/m³` : '—' }}</p>
          <p>PM10: {{ airData.pm10 != null ? `${airData.pm10} μg/m³` : '—' }}</p>
        </div>
      </div>

      <p v-if="!cityData" class="empty-result">해당 지역의 상세 데이터가 존재하지 않습니다.</p>

      <p class="buddy-legend">
        누비는 온도 · 습도 · 불쾌지수 · 강수/뇌우 상태에 따라
        <strong>8~9가지 모션</strong>(폭풍·비·한파·쌀쌀·잔잔·맑음·끈적·무더위·폭염)으로 바뀝니다.
      </p>
    </template>
  </div>
</template>

<style scoped>
.detail-page {
  padding: 8px 4px 28px;
  color: #e8eef8;
}

.detail-head {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  align-items: flex-start;
  margin-bottom: 18px;
}

.detail-eyebrow {
  margin: 0 0 6px;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: rgba(125, 211, 252, 0.85);
}

.detail-page h3 {
  color: #e8eef8;
  font-weight: 800;
  font-size: clamp(1.35rem, 2.2vw, 1.75rem);
  margin: 0 0 6px 0;
}

.api-credit {
  margin: 0;
  font-size: 0.85rem;
  color: rgba(232, 238, 248, 0.55);
  font-weight: 600;
}

.load-msg {
  text-align: center;
  padding: 20px;
  color: rgba(125, 211, 252, 0.9);
  font-weight: 700;
  font-size: 0.95rem;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-top: 14px;
}

.info-card {
  background: rgba(18, 24, 38, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 18px;
  padding: 16px 18px;
  backdrop-filter: blur(16px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.28);
}

.info-card h4 {
  color: #fff;
  margin: 0 0 12px 0;
  font-size: 1.1rem;
  font-weight: 800;
  line-height: 1.3;
}

.info-card p {
  color: rgba(232, 238, 248, 0.85);
  margin: 0 0 10px 0;
  font-size: 0.92rem;
  font-weight: 650;
  line-height: 1.45;
}

.info-card p:last-child {
  margin-bottom: 0;
}

.info-card strong {
  color: #fff;
  font-size: 1rem;
  font-weight: 800;
}

.aqi-badge {
  display: inline-block;
  margin-left: 8px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 750;
  vertical-align: middle;
  background: rgba(56, 189, 248, 0.22);
  color: #e8eef8;
}

.empty-result {
  text-align: center;
  color: #fecaca;
  padding: 14px;
  margin-bottom: 12px;
  background: rgba(180, 35, 24, 0.15);
  border-radius: 12px;
  font-size: 0.95rem;
}

.buddy-legend {
  margin: 14px 0 0;
  font-size: 0.9rem;
  font-weight: 650;
  color: rgba(232, 238, 248, 0.58);
  line-height: 1.5;
}

.back-btn {
  display: inline-block;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.1);
  color: #e8eef8;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 12px;
  font-weight: 750;
  font-size: 0.9rem;
  cursor: pointer;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.16);
}

@media (max-width: 800px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
