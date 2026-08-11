<script setup>
import { ref, computed, watch, watchEffect } from 'vue'

// 1. [1일차 데이터] 가상의 백엔드 데이터 배열
// [실습과제 코드 추가 : 습도(humidity) 필드 추가]
const weatherList = ref([
  { id: 'city_01', name: '서울', temp: 28, status: '맑음', humidity: 45 },
  { id: 'city_02', name: '수원', temp: 24, status: '비', humidity: 80 },
  { id: 'city_03', name: '부산', temp: 26, status: '구름', humidity: 65 },
  // [실습과제 코드 추가 : 도시 2개 추가 — Mockup과 동일 데이터]
  { id: 'city_04', name: '전주', temp: 27, status: '맑음', humidity: 50 },
  { id: 'city_05', name: '강릉', temp: 22, status: '흐림', humidity: 70 },
])

// 2. [1일차 데이터] 검색어 및 알림창 제어용 데이터
const searchQuery = ref('')
const selectedCityInfo = ref('카드를 클릭하거나 검색해 보세요.')

// 3. [2일차 추가] computed를 활용한 실시간 검색 필터링 연산기 (★핵심)
const filteredWeatherList = computed(() => {
  // 사용자가 입력한 검색어의 앞뒤 공백을 제거합니다.
  const query = searchQuery.value.trim()

  // 검색어가 비어있다면 원본 weatherList를 그대로 보여줍니다.
  if (!query) {
    return weatherList.value
  }

  // 검색어가 포함된 도시만 칼같이 필터링하여 실시간으로 뱉어냅니다.
  return weatherList.value.filter((item) => item.name.includes(query))
})

// 4. [2일차 추가] watch를 활용한 선택 도시 추적 센서
// selectedCityInfo의 문구 변화를 감시하여 후속 로그를 처리합니다.
watch(selectedCityInfo, (newInfo) => {
  console.log(`👁️‍🗨️ [watch 감지] 상태 바 문구가 업데이트되었습니다 -> "${newInfo}"`)
})

// 5. [2일차 추가] watchEffect를 활용한 자동 의존성 API 로그 시뮬레이션
// 타이핑할 때마다 변하는 searchQuery 자동 추적
watchEffect(() => {
  console.log(`🤖 [watchEffect 자동 호출] 현재 검색어 '${searchQuery.value}'에 매칭되는 API 데이터를 필터링합니다.`)
})

// ----------------------------------------------------------
// 6. [실습 과제 코드 추가] 상세보기 클릭 횟수 추적용 반응형 변수
const detailViewCount = ref(0)

// 7. [실습 과제 코드 추가] 평균 기온 계산기(computed 활용)
const averageTemp = computed(() => {
  if (filteredWeatherList.value.length === 0) return 0
  const total = filteredWeatherList.value.reduce((sum, item) => sum + item.temp, 0)
  return (total / filteredWeatherList.value.length).toFixed(1)
})

// 8. [실습 과제 코드 추가] watch를 활용한 클릭 횟수 감시
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
// ----------------------------------------------------------

// 알림 대행 함수
const showDetail = (cityName, status) => {
  detailViewCount.value++ // [실습 과제 코드 추가] 클릭할 때마다 카운트 증가
  window.alert(`${cityName}의 현재 날씨는 [${status}] 상태입니다.`)
}
</script>

<template>
  <div class="dashboard-wrapper">
    <section class="search-box">
      <h3>도시 검색</h3>
      <input type="text" :value="searchQuery" @input="(e) => (searchQuery = e.target.value)" placeholder="검색할 도시 이름 입력" />
      <p>
        검색 중인 도시: <strong>{{ searchQuery }}</strong>
      </p>
    </section>

    <!-- [실습과제 코드 추가 : 요약 통계 및 최고·최저 기온 표시 영역] -->
    <section class="summary-box">
      <ul class="summary-stats">
        <li><span class="label">도시</span><span class="value">{{ totalCityCount }}</span></li>
        <li><span class="label">평균</span><span class="value">{{ averageTemp }}°C</span></li>
        <li><span class="label">더움</span><span class="value">{{ hotCityCount }}</span></li>
        <li><span class="label">선선함</span><span class="value">{{ coolCityCount }}</span></li>
      </ul>
      <div v-if="hottestCity && coolestCity" class="summary-extremes">
        <span class="extreme-pill hot">최고 {{ hottestCity.name }} {{ hottestCity.temp }}°C</span>
        <span class="extreme-pill cool">최저 {{ coolestCity.name }} {{ coolestCity.temp }}°C</span>
      </div>
    </section>

    <section class="list-box">
      <h3>지역별 날씨 현황 (평균 기온: {{ averageTemp }}°C)</h3>

      <div v-for="item in filteredWeatherList" :key="item.id" class="weather-card" @click="selectedCityInfo = `${item.name}이 선택되었습니다.`">
        <h4>{{ item.name }} ({{ item.status }})</h4>
        <p>현재 기온: {{ item.temp }}°C</p>

        <div class="card-tags">
          <span v-if="item.temp >= 25" class="badge hot">더움 (25도 이상)</span>
          <span v-else class="badge cool">선선함 (25도 미만)</span>
          <span class="humidity-badge">습도 {{ item.humidity }}%</span>
        </div>

        <button class="btn-detail" @click.stop="showDetail(item.name, item.status)">상세보기</button>
      </div>

      <p v-if="filteredWeatherList.length === 0" class="empty-result">검색 결과와 일치하는 도시가 없습니다.</p>
    </section>

    <div class="status-bar">
      {{ selectedCityInfo }}
      <p class="status-sub">상세보기 클릭 횟수: {{ detailViewCount }}회</p>
    </div>
  </div>
</template>

<style scoped>
@import '@/assets/weather-dashboard.css';
</style>
