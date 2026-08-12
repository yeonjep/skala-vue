<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
const goHome = () => router.push('/cities')
</script>

<template>
  <div class="guide-page">
    <h3>날씨 해석 가이드</h3>

    <div class="guide-card">
      <h4>더움 (25°C 이상)</h4>
      <p>외출 시 수분 섭취와 자외선 차단을 권장합니다.</p>
    </div>
    <div class="guide-card">
      <h4>선선함 (25°C 미만)</h4>
      <p>가벼운 겉옷을 준비하면 쾌적하게 활동할 수 있습니다.</p>
    </div>
    <div class="guide-card">
      <h4>습도</h4>
      <p>습도가 70%를 넘으면 체감 온도가 높아지고 불쾌지수가 상승합니다.</p>
    </div>

    <button type="button" class="home-btn" @click="goHome">대시보드로 돌아가기</button>
  </div>
</template>

<style scoped>
.guide-page h3 {
  color: #2a3340;
  font-weight: 800;
  font-size: 2.8rem;
  margin: 0 0 24px 0;
  letter-spacing: -0.02em;
}

.guide-card {
  background: rgba(255, 255, 255, 0.55);
  border: none;
  border-radius: 24px;
  padding: 28px 32px;
  margin-bottom: 16px;
  box-shadow: 0 12px 28px rgba(90, 110, 140, 0.12);
  backdrop-filter: blur(20px);
}

.guide-card h4 {
  color: #2a3340;
  margin: 0 0 14px 0;
  font-size: 1.85rem;
  font-weight: 800;
}

.guide-card p {
  color: rgba(42, 51, 64, 0.72);
  margin: 0;
  font-size: 1.45rem;
  line-height: 1.6;
}

.home-btn {
  width: 100%;
  margin-top: 12px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.72);
  color: #2a3340;
  border: none;
  border-radius: 18px;
  font-weight: 800;
  font-size: 1.45rem;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(90, 110, 140, 0.12);
}

.home-btn:hover {
  background: rgba(255, 255, 255, 0.95);
}
</style>
