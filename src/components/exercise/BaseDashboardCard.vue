<script setup>
// [3일차 과제] slot — 검색창·날씨 리스트 등 공통 카드 레이아웃을 감싸는 래퍼 컴포넌트
</script>

<template>
  <section class="base-dashboard-card">
    <slot></slot>
  </section>
</template>

<style scoped>
.base-dashboard-card {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  overflow-x: hidden;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(28px) saturate(140%);
  -webkit-backdrop-filter: blur(28px) saturate(140%);
  border: none;
  border-radius: 28px;
  box-shadow: 0 18px 40px rgba(90, 110, 140, 0.14);
  padding: 18px;
  margin-bottom: 14px;
}
</style>
