<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
const goHome = () => router.push('/cities')

const tips = [
  {
    title: '더움 (25°C 이상)',
    body: '외출 시 수분 섭취와 자외선 차단을 권장합니다. 한낮에는 그늘에서 짧게 쉬는 것이 좋아요.',
    tone: 'hot',
  },
  {
    title: '선선함 (25°C 미만)',
    body: '가벼운 겉옷을 준비하면 쾌적하게 활동할 수 있습니다. 일교차가 큰 날은 레이어드를 추천해요.',
    tone: 'cool',
  },
  {
    title: '습도',
    body: '습도가 70%를 넘으면 체감 온도가 높아지고 불쾌지수가 상승합니다. 환기와 제습을 함께 챙기세요.',
    tone: 'humid',
  },
]
</script>

<template>
  <div class="guide-page">
    <header class="guide-head">
      <p class="guide-eyebrow">GUIDE</p>
      <h3>날씨 해석 가이드</h3>
      <p class="guide-lead">기온·습도 뱃지를 어떻게 읽으면 좋은지 짧게 정리했어요.</p>
    </header>

    <div class="guide-grid">
      <article v-for="tip in tips" :key="tip.title" class="guide-card" :class="`is-${tip.tone}`">
        <h4>{{ tip.title }}</h4>
        <p>{{ tip.body }}</p>
      </article>
    </div>

    <button type="button" class="home-btn" @click="goHome">날씨 대시보드로 이동</button>
  </div>
</template>

<style scoped>
.guide-page {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.guide-head {
  margin-bottom: 14px;
}

.guide-eyebrow {
  margin: 0 0 6px;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  color: rgba(125, 211, 252, 0.85);
}

.guide-page h3 {
  color: #e8eef8;
  font-weight: 800;
  font-size: clamp(1.35rem, 2.2vw, 1.75rem);
  margin: 0 0 6px;
  letter-spacing: -0.02em;
}

.guide-lead {
  margin: 0;
  color: rgba(232, 238, 248, 0.62);
  font-size: 0.9rem;
  line-height: 1.5;
}

.guide-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.guide-card {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: 14px 16px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.18);
  backdrop-filter: blur(20px);
  border-left: 4px solid rgba(90, 140, 180, 0.45);
}

.guide-card.is-hot {
  border-left-color: rgba(220, 120, 80, 0.7);
}

.guide-card.is-cool {
  border-left-color: rgba(80, 150, 200, 0.7);
}

.guide-card.is-humid {
  border-left-color: rgba(100, 160, 140, 0.7);
}

.guide-card h4 {
  color: #e8eef8;
  margin: 0 0 8px;
  font-size: 1.05rem;
  font-weight: 800;
}

.guide-card p {
  color: rgba(232, 238, 248, 0.72);
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.55;
}

.home-btn {
  width: 100%;
  margin-top: 14px;
  padding: 12px 16px;
  background: rgba(42, 51, 64, 0.9);
  color: #fff;
  border: none;
  border-radius: 14px;
  font-weight: 800;
  font-size: 0.92rem;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(90, 110, 140, 0.16);
}

.home-btn:hover {
  background: #2a3340;
}
</style>
