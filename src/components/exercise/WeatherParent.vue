<script setup>
import { ref, computed, watch, watchEffect } from 'vue'
// [3일차 과제] 4개 컴포넌트 분리 — 부모가 자식들을 조립하고 모든 상태·로직을 소유
import BaseDashboardCard from './BaseDashboardCard.vue'
import SearchBar from './SearchBar.vue'
import WeatherCard from './WeatherCard.vue'

// 1. [1일차 데이터] 가상의 백엔드 데이터 배열
// [실습과제 코드 추가 : 습도(humidity) 필드 및 도시 2개 추가]
const weatherList = ref([
  { id: 'city_01', name: '서울', temp: 28, status: '맑음', humidity: 45 },
  { id: 'city_02', name: '수원', temp: 24, status: '비', humidity: 80 },
  { id: 'city_03', name: '부산', temp: 26, status: '구름', humidity: 65 },
  { id: 'city_04', name: '전주', temp: 27, status: '맑음', humidity: 50 },
  { id: 'city_05', name: '강릉', temp: 22, status: '흐림', humidity: 70 },
])

// 2. [1일차 데이터] 검색어 및 알림창 제어용 데이터
const searchQuery = ref('')
const selectedCityInfo = ref('카드를 클릭하거나 검색해 보세요.')

// 3. [2일차 추가] computed 활용한 실시간 검색 필터링 연산기
const filteredWeatherList = computed(() => {
  const query = searchQuery.value.trim()
  if (!query) return weatherList.value
  return weatherList.value.filter((item) => item.name.includes(query))
})

// 4. [2일차 추가] watch를 활용한 선택 도시 추적 센서
watch(selectedCityInfo, (newInfo) => {
  console.log(`👁️‍🗨️ [watch 감지] 상태 바 문구가 업데이트되었습니다 -> "${newInfo}"`)
})

// 5. [2일차 추가] watchEffect를 활용한 자동 의존성 API 로그 시뮬레이션
watchEffect(() => {
  console.log(`🤖 [watchEffect 자동 호출] 현재 검색어 '${searchQuery.value}'에 매칭되는 API 데이터를 필터링합니다.`)
})

// [실습과제 코드 추가 : 상세보기 클릭 횟수 추적용 반응형 변수]
const detailViewCount = ref(0)

// [실습과제 코드 추가 : 평균 기온 계산기(computed 활용)]
const averageTemp = computed(() => {
  if (filteredWeatherList.value.length === 0) return 0
  const total = filteredWeatherList.value.reduce((sum, item) => sum + item.temp, 0)
  return (total / filteredWeatherList.value.length).toFixed(1)
})

// [실습과제 코드 추가 : watch를 활용한 클릭 횟수 감시]
watch(detailViewCount, (newCount) => {
  console.log(`[watch 감지] 상세보기 버튼이 총 ${newCount}번 클릭되었습니다.`)
})

// [실습과제 코드 추가 : 요약 통계 — 도시 수, 더움/선선함 개수]
const totalCityCount = computed(() => filteredWeatherList.value.length)
const hotCityCount = computed(() => filteredWeatherList.value.filter((item) => item.temp >= 25).length)
const coolCityCount = computed(() => filteredWeatherList.value.filter((item) => item.temp < 25).length)

// [실습과제 코드 추가 : 최고/최저 기온 도시 연산]
const hottestCity = computed(() => {
  if (filteredWeatherList.value.length === 0) return null
  return filteredWeatherList.value.reduce((max, item) => (item.temp > max.temp ? item : max))
})
const coolestCity = computed(() => {
  if (filteredWeatherList.value.length === 0) return null
  return filteredWeatherList.value.reduce((min, item) => (item.temp < min.temp ? item : min))
})

// [3일차 과제] WeatherCard의 click-detail 이벤트를 수신해 alert 처리
const showDetail = (cityName, status) => {
  detailViewCount.value++
  window.alert(`${cityName}의 현재 날씨는 [${status}] 상태입니다.`)
}
</script>

<template>
  <div class="dashboard-wrapper">
    <!-- [3일차 과제] BaseDashboardCard + SearchBar — props/emit으로 searchQuery 연동 -->
    <BaseDashboardCard class="search-box">
      <SearchBar :current-query="searchQuery" @update-query="(val) => (searchQuery = val)" />
    </BaseDashboardCard>

    <!-- [실습과제 코드 추가 : 요약 통계 및 최고·최저 기온 표시 영역] -->
    <section class="summary-box">
      <ul class="summary-stats">
        <li>
          <span class="label">도시</span><span class="value">{{ totalCityCount }}</span>
        </li>
        <li>
          <span class="label">평균</span><span class="value">{{ averageTemp }}°C</span>
        </li>
        <li>
          <span class="label">더움</span><span class="value">{{ hotCityCount }}</span>
        </li>
        <li>
          <span class="label">선선함</span><span class="value">{{ coolCityCount }}</span>
        </li>
      </ul>
      <div v-if="hottestCity && coolestCity" class="summary-extremes">
        <span class="extreme-pill hot">최고 {{ hottestCity.name }} {{ hottestCity.temp }}°C</span>
        <span class="extreme-pill cool">최저 {{ coolestCity.name }} {{ coolestCity.temp }}°C</span>
      </div>
    </section>

    <!-- [3일차 과제] BaseDashboardCard + WeatherCard — cityItem props / select-card·click-detail emit -->
    <BaseDashboardCard class="list-box">
      <h3>지역별 날씨 현황 (평균 기온: {{ averageTemp }}°C)</h3>

      <WeatherCard v-for="item in filteredWeatherList" :key="item.id" :city-item="item" @select-card="(msg) => (selectedCityInfo = msg)" @click-detail="showDetail" />

      <p v-if="filteredWeatherList.length === 0" class="empty-result">검색 결과와 일치하는 도시가 없습니다.</p>
    </BaseDashboardCard>

    <div class="status-bar">
      {{ selectedCityInfo }}
      <p class="status-sub">상세보기 클릭 횟수: {{ detailViewCount }}회</p>
    </div>
  </div>
</template>

<style scoped>
/* 부모 레이아웃·요약·상태바 — 공통 대시보드 테마 */
@import '@/assets/weather-dashboard.css';

.list-box h3 {
  color: #ffffff;
  font-weight: 700;
  font-size: 1.05rem;
  letter-spacing: -0.3px;
  margin: 0 0 16px 0;
}
</style>
