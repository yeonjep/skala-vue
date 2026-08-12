<script setup>
// [3일차 과제] slot — 검색창·날씨 리스트 등 공통 카드 레이아웃을 감싸는 래퍼 컴포넌트
// 자식(SearchBar, WeatherCard)은 slot으로 삽입되지만, 데이터 바인딩은 부모(WeatherParent) 스코프에서 처리
</script>

<template>
  <section class="base-dashboard-card">
    <slot></slot>
  </section>
</template>

<style scoped>
.base-dashboard-card {
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(24px) saturate(150%);
  -webkit-backdrop-filter: blur(24px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 20px;
  box-shadow:
    0 10px 40px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  padding: 22px 24px;
  margin-bottom: 18px;
}
</style>
