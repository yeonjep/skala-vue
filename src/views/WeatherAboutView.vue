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
  font-size: clamp(1.35rem, 2.2vw, 1.75rem);
  margin: 0 0 14px 0;
  letter-spacing: -0.02em;
}

.description-box {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: 16px 18px;
  line-height: 1.6;
  font-size: 0.92rem;
  color: rgba(232, 238, 248, 0.82);
  margin-bottom: 14px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.18);
  backdrop-filter: blur(20px);
}

.description-box strong {
  color: #fff;
}

ul {
  padding-left: 20px;
  margin: 12px 0 0 0;
}

li {
  margin-bottom: 8px;
}

code {
  background: rgba(140, 168, 184, 0.22);
  padding: 2px 6px;
  border-radius: 5px;
  color: #c7e7f7;
  font-size: 0.85rem;
}

.home-btn {
  width: 100%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.12);
  color: #e8eef8;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 14px;
  font-weight: 800;
  font-size: 0.92rem;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.16);
}

.home-btn:hover {
  background: rgba(255, 255, 255, 0.18);
}
</style>
