<script setup>
import { ref, computed, watch, watchEffect, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import BaseDashboardCard from './BaseDashboardCard.vue'
import SearchBar from './SearchBar.vue'
import WeatherCard from './WeatherCard.vue'
import StorePanel from './StorePanel.vue'
import { useConfigStore } from '@/stores/configStore'
import { useWeatherStore } from '@/stores/weatherStore'
import { convertTemp } from '@/utils/temperature'
import { CITY_CATALOG } from '@/data/cities'
import { fetchCitiesCurrent } from '@/api/openMeteo'

defineProps({
  /** 허브(/cities) 안에서 이중 배경 제거 */
  embedded: {
    type: Boolean,
    default: false,
  },
})

const router = useRouter()
const route = useRoute()
const configStore = useConfigStore()
const weatherStore = useWeatherStore()

// [Axios + Open-Meteo] 실제 API로 채울 목록 (초기엔 카탈로그 골격)
const weatherList = ref(
  CITY_CATALOG.map((c) => ({
    id: c.id,
    name: c.name,
    temp: 0,
    status: '불러오는 중',
    humidity: 0,
  })),
)

const isLoading = ref(false)
const loadError = ref('')
const searchQuery = ref('')
const selectedCityInfo = ref('카드를 클릭하거나 검색해 보세요.')

async function loadLiveWeather() {
  isLoading.value = true
  loadError.value = ''
  try {
    weatherList.value = await fetchCitiesCurrent(CITY_CATALOG)
    console.log('[Open-Meteo] 도시 현재 날씨 동기화:', weatherList.value)
  } catch (err) {
    console.error('[Open-Meteo] 도시 날씨 실패:', err)
    loadError.value = '실시간 날씨를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  if (route.query.search) {
    searchQuery.value = String(route.query.search)
  }
  loadLiveWeather()
})

watch(searchQuery, (newQuery) => {
  if (route.path === '/cities' || route.name === 'WeatherHome') {
    router.push({
      path: route.path,
      query: { search: newQuery || undefined },
    })
  }
  if (newQuery.trim()) {
    weatherStore.addRecentSearch(newQuery)
  }
})

const filteredWeatherList = computed(() => {
  const query = searchQuery.value.trim()
  if (!query) return weatherList.value
  return weatherList.value.filter((item) => item.name.includes(query))
})

watch(selectedCityInfo, (newInfo) => {
  console.log(`[watch 감지] 상태 바 문구가 업데이트되었습니다 -> "${newInfo}"`)
})

watchEffect(() => {
  console.log(`[watchEffect] 현재 검색어 '${searchQuery.value}'에 매칭되는 API 데이터를 필터링합니다.`)
})

const detailViewCount = ref(0)

const averageTemp = computed(() => {
  if (filteredWeatherList.value.length === 0) return 0
  const total = filteredWeatherList.value.reduce((sum, item) => sum + item.temp, 0)
  return total / filteredWeatherList.value.length
})

const displayAverageTemp = computed(() => convertTemp(Number(averageTemp.value.toFixed(1)), configStore.unit))

watch(detailViewCount, (newCount) => {
  console.log(`[watch 감지] 상세보기 버튼이 총 ${newCount}번 클릭되었습니다.`)
})

const totalCityCount = computed(() => filteredWeatherList.value.length)
const hotCityCount = computed(() => filteredWeatherList.value.filter((item) => item.temp >= 25).length)
const coolCityCount = computed(() => filteredWeatherList.value.filter((item) => item.temp < 25).length)

const hottestCity = computed(() => {
  if (filteredWeatherList.value.length === 0) return null
  return filteredWeatherList.value.reduce((max, item) => (item.temp > max.temp ? item : max))
})
const coolestCity = computed(() => {
  if (filteredWeatherList.value.length === 0) return null
  return filteredWeatherList.value.reduce((min, item) => (item.temp < min.temp ? item : min))
})

const handleDetailJump = (cityId) => {
  detailViewCount.value++
  router.push(`/weather/${cityId}`)
}

const applySearch = (query) => {
  searchQuery.value = query
}

const jumpCity = (cityId) => {
  handleDetailJump(cityId)
}
</script>

<template>
  <div class="dashboard-wrapper" :class="{ 'dashboard-wrapper--embedded': embedded }">
    <BaseDashboardCard class="search-box">
      <SearchBar :current-query="searchQuery" @update-query="(val) => (searchQuery = val)" />
    </BaseDashboardCard>

    <StorePanel :cities="weatherList" @apply-search="applySearch" @jump-city="jumpCity" />

    <section class="summary-box">
      <ul class="summary-stats">
        <li>
          <span class="label">도시</span><span class="value">{{ totalCityCount }}</span>
        </li>
        <li>
          <span class="label">평균</span>
          <span class="value">{{ displayAverageTemp }}{{ configStore.unitSymbol }}</span>
        </li>
        <li>
          <span class="label">더움</span><span class="value">{{ hotCityCount }}</span>
        </li>
        <li>
          <span class="label">선선함</span><span class="value">{{ coolCityCount }}</span>
        </li>
      </ul>
      <div v-if="!isLoading && hottestCity && coolestCity" class="summary-extremes">
        <span class="extreme-pill hot">
          최고 {{ hottestCity.name }} {{ convertTemp(hottestCity.temp, configStore.unit) }}{{ configStore.unitSymbol }}
        </span>
        <span class="extreme-pill cool">
          최저 {{ coolestCity.name }} {{ convertTemp(coolestCity.temp, configStore.unit) }}{{ configStore.unitSymbol }}
        </span>
      </div>
    </section>

    <BaseDashboardCard class="list-box">
      <div class="list-box__head">
        <h3>지역별 날씨 현황 (평균 {{ displayAverageTemp }}{{ configStore.unitSymbol }})</h3>
        <button type="button" class="refresh-btn" :disabled="isLoading" @click="loadLiveWeather">
          {{ isLoading ? '불러오는 중…' : '새로고침' }}
        </button>
      </div>
      <p class="api-credit">Open-Meteo 실시간 · Axios</p>

      <p v-if="isLoading" class="load-msg">실시간 기상 데이터를 가져오는 중입니다…</p>
      <p v-else-if="loadError" class="error-msg">{{ loadError }}</p>

      <template v-else>
        <WeatherCard
          v-for="item in filteredWeatherList"
          :key="item.id"
          :city-item="item"
          @select-card="(msg) => (selectedCityInfo = msg)"
          @click-detail="() => handleDetailJump(item.id)"
        />
        <p v-if="filteredWeatherList.length === 0" class="empty-result">검색 결과와 일치하는 도시가 없습니다.</p>
      </template>
    </BaseDashboardCard>

    <div class="status-bar">
      {{ selectedCityInfo }}
      <p class="status-sub">상세보기 클릭 횟수: {{ detailViewCount }}회</p>
    </div>
  </div>
</template>

<style scoped>
@import '@/assets/weather-dashboard.css';

.list-box__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
}

.list-box h3 {
  color: #2a3340;
  font-weight: 800;
  font-size: 2rem;
  letter-spacing: -0.3px;
  margin: 0;
}

.api-credit {
  margin: 0 0 16px;
  font-size: 0.95rem;
  color: rgba(42, 51, 64, 0.45);
}

.refresh-btn {
  flex-shrink: 0;
  border: none;
  border-radius: 999px;
  padding: 10px 16px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  background: rgba(42, 51, 64, 0.9);
  color: #fff;
}

.refresh-btn:disabled {
  opacity: 0.55;
  cursor: wait;
}

.load-msg {
  text-align: center;
  padding: 28px 12px;
  color: #3d6680;
  font-weight: 700;
  font-size: 1.15rem;
}

.error-msg {
  text-align: center;
  padding: 20px 12px;
  color: #b42318;
  font-weight: 600;
}
</style>
