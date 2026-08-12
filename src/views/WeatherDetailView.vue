<script setup>
// [4일차 과제] 동적 경로 상세 View + [5일차] 스토어 단위 변환
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConfigStore } from '@/stores/configStore'
import { useDisplayTemp } from '@/composables/useDisplayTemp'

const route = useRoute()
const router = useRouter()
const configStore = useConfigStore()

const mockDetails = {
  city_01: { name: '대한민국 서울특별시', temp: 28, status: '맑음', humidity: '45%', wind: '2.5m/s' },
  city_02: { name: '경기도 수원시', temp: 24, status: '비', humidity: '80%', wind: '4.1m/s' },
  city_03: { name: '부산광역시 해운대구', temp: 26, status: '구름', humidity: '65%', wind: '5.0m/s' },
  city_04: { name: '전북특별자치도 전주시', temp: 27, status: '맑음', humidity: '50%', wind: '3.2m/s' },
  city_05: { name: '강원특별자치도 강릉시', temp: 22, status: '흐림', humidity: '70%', wind: '6.3m/s' },
}

const cityData = ref(null)

onMounted(() => {
  const id = route.params.cityId
  if (mockDetails[id]) {
    cityData.value = mockDetails[id]
  }
})

const displayTemp = useDisplayTemp(() => cityData.value?.temp ?? 0)
</script>

<template>
  <div class="detail-page">
    <h3>지역별 상세 기상 관측 정보</h3>

    <div v-if="cityData" class="info-card">
      <h4>지정 지역: {{ cityData.name }}</h4>
      <p>
        실시간 기온: <strong>{{ displayTemp }}{{ configStore.unitSymbol }}</strong>
      </p>
      <p>기상 현황: {{ cityData.status }}</p>
      <p>대기 습도: {{ cityData.humidity }}</p>
      <p>현재 풍속: {{ cityData.wind }}</p>
    </div>
    <p v-else class="empty-result">해당 지역의 상세 데이터가 존재하지 않습니다.</p>

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
  margin: 0 0 18px 0;
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

.empty-result {
  text-align: center;
  color: #b42318;
  padding: 20px;
  margin-bottom: 18px;
  background: rgba(255, 80, 80, 0.1);
  border-radius: 12px;
  border: none;
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
  transition: all 0.18s ease;
  box-shadow: 0 6px 16px rgba(90, 110, 140, 0.12);
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.95);
}

:global(.hub-app--light) .detail-page h3,
:global(.hub-app--light) .info-card h4,
:global(.hub-app--light) .info-card strong {
  color: #0f172a;
}

:global(.hub-app--light) .info-card {
  background: rgba(255, 255, 255, 0.88);
  border-color: rgba(15, 23, 42, 0.08);
}

:global(.hub-app--light) .info-card p {
  color: #475569;
}

:global(.hub-app--light) .back-btn {
  color: #0f172a;
  background: #fff;
  border-color: rgba(15, 23, 42, 0.12);
}
</style>
