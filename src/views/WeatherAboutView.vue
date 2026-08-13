<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
const handleGoHome = () => router.push('/cities')
</script>

<template>
  <div class="about-page">
    <h3>서비스 소개</h3>

    <div class="description-box">
      <p>
        <strong>AeroCast</strong>는 Vue 3 · Vue Router · Pinia로 만든 종합 날씨 허브입니다.
      </p>
      <ul>
        <li>
          <strong>날씨</strong> — <code>WeatherParent</code> + 컴포넌트 분리 · 검색 · 요약 · 즐겨찾기
        </li>
        <li>
          <strong>라우터</strong> — <code>/cities</code>, <code>/weather/:cityId</code>, 검색 query, 404
        </li>
        <li>
          <strong>스토어</strong> — 섭씨/화씨 단위 · 즐겨찾기 · 최근 검색
        </li>
        <li>
          <strong>Axios + Open-Meteo:</strong> 실시간 도시 날씨 · 월간 캘린더 · 대기질 API
        </li>
        <li>
          <strong>운동 뉴스</strong> — ESPN 공개 API로 프리미어리그 등 순위·스코어·기사 (`/sports`)
        </li>
        <li>
          <strong>건강 관리</strong> — wger.de 운동 DB · BMI · 대기질 가이드 (`/health`)
        </li>
        <li>부가 기능: 홈 월간 날씨 캘린더 · 날씨 해석 가이드 · Groq 챗봇</li>
      </ul>
    </div>

    <button type="button" class="home-btn" @click="handleGoHome">날씨 대시보드로 이동</button>
  </div>
</template>

<style scoped>
.about-page h3 {
  color: #e8eef8;
  font-weight: 800;
  font-size: clamp(2.4rem, 4vw, 3rem);
  margin: 0 0 20px 0;
  letter-spacing: -0.02em;
}

.description-box {
  background: rgba(255, 255, 255, 0.55);
  border: none;
  border-radius: 24px;
  padding: 28px 32px;
  line-height: 1.7;
  font-size: 1.45rem;
  color: rgba(42, 51, 64, 0.82);
  margin-bottom: 20px;
  box-shadow: 0 12px 28px rgba(90, 110, 140, 0.12);
  backdrop-filter: blur(20px);
}

.description-box strong {
  color: #2a3340;
}

ul {
  padding-left: 24px;
  margin: 16px 0 0 0;
}

li {
  margin-bottom: 12px;
}

code {
  background: rgba(140, 168, 184, 0.22);
  padding: 3px 8px;
  border-radius: 6px;
  color: #3d5566;
  font-size: 1.2rem;
}

.home-btn {
  width: 100%;
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
