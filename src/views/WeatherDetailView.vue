<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConfigStore } from '@/stores/configStore'
import { useDisplayTemp } from '@/composables/useDisplayTemp'
import { findCityById } from '@/data/cities'
import { fetchCurrentWeather, fetchAirQuality, aqiLabel } from '@/api/openMeteo'

const route = useRoute()
const router = useRouter()
const configStore = useConfigStore()

const cityData = ref(null)
const airData = ref(null)
const isLoading = ref(false)
const loadError = ref('')

const displayTemp = useDisplayTemp(() => cityData.value?.temp ?? 0)

onMounted(async () => {
  const city = findCityById(String(route.params.cityId))
  if (!city) return

  isLoading.value = true
  loadError.value = ''
  try {
    // 1) 현재 날씨 + 2) 대기질(기타 외부 API) 병렬
    const [weather, air] = await Promise.all([
      fetchCurrentWeather({ lat: city.lat, lon: city.lon }),
      fetchAirQuality({ lat: city.lat, lon: city.lon }),
    ])

    cityData.value = {
      name: city.label,
      temp: weather.temp,
      status: weather.status,
      emoji: weather.emoji,
      humidity: `${weather.humidity}%`,
      wind: `${weather.wind}m/s`,
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
    <h3>지역별 상세 기상 관측 정보</h3>
    <p class="api-credit">Open-Meteo Forecast · Air Quality · Axios</p>

    <p v-if="isLoading" class="load-msg">실시간 데이터를 동기화하는 중입니다…</p>
    <p v-else-if="loadError" class="empty-result">{{ loadError }}</p>

    <template v-else>
      <div v-if="cityData" class="info-card">
        <h4>{{ cityData.emoji }} 지정 지역: {{ cityData.name }}</h4>
        <p>
          실시간 기온: <strong>{{ displayTemp }}{{ configStore.unitSymbol }}</strong>
        </p>
        <p>기상 현황: {{ cityData.status }}</p>
        <p>대기 습도: {{ cityData.humidity }}</p>
        <p>현재 풍속: {{ cityData.wind }}</p>
      </div>
      <p v-else class="empty-result">해당 지역의 상세 데이터가 존재하지 않습니다.</p>

      <div v-if="airData" class="info-card air-card">
        <h4>대기질 (외부 API)</h4>
        <p>
          유럽 AQI: <strong>{{ airData.aqi ?? '—' }}</strong>
          <span class="aqi-badge">{{ aqiLabel(airData.aqi) }}</span>
        </p>
        <p>PM2.5: {{ airData.pm25 != null ? `${airData.pm25} μg/m³` : '—' }}</p>
        <p>PM10: {{ airData.pm10 != null ? `${airData.pm10} μg/m³` : '—' }}</p>
      </div>
    </template>

    <button type="button" class="back-btn" @click="router.push('/cities')">날씨 대시보드로 돌아가기</button>
  </div>
</template>

<style scoped>
.detail-page {
  padding: 8px 4px;
}

.detail-page h3 {
  color: #2a3340;
  font-weight: 800;
  font-size: 2rem;
  margin: 0 0 6px 0;
}

.api-credit {
  margin: 0 0 18px;
  font-size: 0.95rem;
  color: rgba(42, 51, 64, 0.45);
}

.load-msg {
  text-align: center;
  padding: 24px;
  color: #3d6680;
  font-weight: 700;
}

.info-card {
  background: rgba(255, 255, 255, 0.55);
  border: none;
  border-radius: 22px;
  padding: 24px;
  margin-bottom: 18px;
  backdrop-filter: blur(16px);
  box-shadow: 0 12px 28px rgba(90, 110, 140, 0.12);
}

.info-card h4 {
  color: #2a3340;
  margin: 0 0 14px 0;
  font-size: 1.45rem;
}

.info-card p {
  color: rgba(42, 51, 64, 0.78);
  margin: 0 0 10px 0;
  font-size: 1.2rem;
}

.info-card strong {
  color: #2a3340;
  font-size: 1.45rem;
}

.aqi-badge {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 0.9rem;
  font-weight: 700;
  background: rgba(90, 140, 200, 0.18);
  color: #2a3340;
}

.empty-result {
  text-align: center;
  color: #b42318;
  padding: 20px;
  margin-bottom: 18px;
  background: rgba(255, 80, 80, 0.1);
  border-radius: 12px;
  font-size: 1.15rem;
}

.back-btn {
  display: inline-block;
  padding: 14px 22px;
  background: rgba(255, 255, 255, 0.72);
  color: #2a3340;
  border: none;
  border-radius: 14px;
  font-weight: 700;
  font-size: 1.15rem;
  cursor: pointer;
  box-shadow: 0 6px 16px rgba(90, 110, 140, 0.12);
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.95);
}
</style>
