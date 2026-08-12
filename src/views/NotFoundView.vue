<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

// [4일차 과제] 404 페이지에서 메인으로 Programmatic Navigation
const goHome = () => {
  router.push({ name: 'HubHome' })
}
</script>

<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <h2>페이지를 찾을 수 없습니다</h2>
      <p>요청하신 주소가 존재하지 않거나,<br />아직 개발되지 않았습니다.</p>
      <button type="button" class="home-button" @click="goHome">날씨 메인으로 이동</button>
    </div>
  </div>
</template>

<style scoped>
.not-found-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 50vh;
  padding: 24px;
}

.not-found-content {
  text-align: center;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.14);
  padding: 40px 32px;
  border-radius: 20px;
  backdrop-filter: blur(16px);
  max-width: 400px;
  width: 100%;
}

h2 {
  font-size: 1.4rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 12px 0;
}

p {
  font-size: 0.92rem;
  color: rgba(255, 255, 255, 0.65);
  line-height: 1.6;
  margin: 0 0 24px 0;
}

.home-button {
  background: rgba(100, 160, 255, 0.25);
  color: #ffffff;
  border: 1px solid rgba(140, 180, 255, 0.45);
  padding: 11px 24px;
  font-size: 0.9rem;
  font-weight: 600;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.18s ease;
}

.home-button:hover {
  background: rgba(100, 160, 255, 0.4);
}
</style>
