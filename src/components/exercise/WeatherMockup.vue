<script setup>
import { ref, computed } from 'vue'

// 4일차 API 연동을 대비한 가상의 백엔드 데이터 배열 (v-for 및 :key 실습용)
const weatherList = ref([
  { id: 'city_01', name: '서울', temp: 28, status: '맑음', humidity: 45 },
  { id: 'city_02', name: '수원', temp: 24, status: '비', humidity: 80 },
  { id: 'city_03', name: '부산', temp: 26, status: '구름', humidity: 65 },
  // 개인과제 - 도시 2개, 습도 추가
  { id: 'city_04', name: '전주', temp: 27, status: '맑음', humidity: 50 },
  { id: 'city_05', name: '강릉', temp: 22, status: '흐림', humidity: 70 },
])

// 검색어 및 알림창 제어용 데이터 (v-model 대용 한글 처리 및 이벤트 실습용)
const searchQuery = ref('')
const selectedCityInfo = ref('카드를 클릭하거나 검색해 보세요.')

// [실습과제 코드 추가 : computed 검색 필터링 — 검색어에 맞는 도시 목록 연산]
const filteredWeatherList = computed(() => {
  const query = searchQuery.value.trim()
  if (!query) return weatherList.value
  return weatherList.value.filter((item) => item.name.includes(query))
})

// [실습과제 코드 추가 : 검색 필터 결과에 따라 카드 표시 여부 판별]
const isCityVisible = (cityId) => {
  return filteredWeatherList.value.some((item) => item.id === cityId)
}

// [실습과제 코드 추가 : 요약 통계 — 도시 수, 평균 기온, 더움/선선함 개수]
const totalCityCount = computed(() => filteredWeatherList.value.length)
const summaryAverageTemp = computed(() => {
  if (filteredWeatherList.value.length === 0) return 0
  const total = filteredWeatherList.value.reduce((sum, item) => sum + item.temp, 0)
  return (total / filteredWeatherList.value.length).toFixed(1)
})
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

// 알림 대행 함수 (window 객체 격리 우회)
const showDetail = (cityName, status) => {
  window.alert(`${cityName}의 현재 날씨는 [${status}] 상태입니다.`)
}
</script>

<template>
  <div class="dashboard-wrapper">
    <section class="search-box">
      <h3>도시 검색</h3>
      <!-- input type="text" v-model="searchQuery" placeholder="검색할 도시 이름 입력" / -->
      <input type="text" :value="searchQuery" @input="(e) => (searchQuery = e.target.value)" placeholder="검색할 도시 이름 입력" />
      <p>
        검색 중인 도시: <strong>{{ searchQuery }}</strong>
      </p>
    </section>

    <!-- [실습과제 코드 추가 : 요약 통계 및 최고·최저 기온 표시 영역] -->
    <section class="summary-box">
      <ul class="summary-stats">
        <li><span class="label">도시</span><span class="value">{{ totalCityCount }}</span></li>
        <li><span class="label">평균</span><span class="value">{{ summaryAverageTemp }}°C</span></li>
        <li><span class="label">더움</span><span class="value">{{ hotCityCount }}</span></li>
        <li><span class="label">선선함</span><span class="value">{{ coolCityCount }}</span></li>
      </ul>
      <div v-if="hottestCity && coolestCity" class="summary-extremes">
        <span class="extreme-pill hot">최고 {{ hottestCity.name }} {{ hottestCity.temp }}°C</span>
        <span class="extreme-pill cool">최저 {{ coolestCity.name }} {{ coolestCity.temp }}°C</span>
      </div>
    </section>

    <section class="list-box">
      <h3>지역별 날씨 현황</h3>

      <div
        v-for="item in weatherList"
        :key="item.id"
        class="weather-card"
        v-show="isCityVisible(item.id)"
        @click="selectedCityInfo = `${item.name}이 선택되었습니다.`"
      >
        <h4>{{ item.name }} ({{ item.status }})</h4>
        <p>현재 기온: {{ item.temp }}°C</p>

        <div class="card-tags">
          <span v-if="item.temp >= 25" class="badge hot">더움 (25도 이상)</span>
          <span v-else class="badge cool">선선함 (25도 미만)</span>
          <span class="humidity-badge">습도 {{ item.humidity }}%</span>
        </div>

        <button class="btn-detail" @click.stop="showDetail(item.name, item.status)">상세보기</button>
      </div>

      <!-- [실습과제 코드 추가 : 검색 결과 없음 안내 문구] -->
      <p v-if="filteredWeatherList.length === 0" class="empty-result">검색 결과와 일치하는 도시가 없습니다.</p>
    </section>

    <div class="status-bar">
      {{ selectedCityInfo }}
    </div>
  </div>
</template>

<style scoped>
@import '@/assets/weather-dashboard.css';
</style>
