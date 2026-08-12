<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import UnitToggler from './components/exercise/UnitToggler.vue'
import { useWeatherStore } from './stores/weatherStore'

const route = useRoute()
const weatherStore = useWeatherStore()
const isLab = computed(() => String(route.name || '').startsWith('Lab'))

onMounted(() => {
  window.scrollTo(0, 0)
  document.documentElement.scrollLeft = 0
  document.body.scrollLeft = 0
})
</script>

<template>
  <div class="hub-app aurora-bg">
    <div class="hub-frame">
      <header class="hub-header">
        <div class="hub-header__top">
          <RouterLink to="/" class="hub-brand">
            <span class="hub-brand__mark">☁</span>
            <span class="hub-brand__text">AeroCast</span>
          </RouterLink>

          <div class="hub-header__actions">
            <span class="hub-fav" title="즐겨찾기">★ {{ weatherStore.favoriteCount }}</span>
            <UnitToggler />
          </div>
        </div>

        <nav class="hub-nav" aria-label="주요 메뉴">
          <RouterLink to="/" class="hub-nav__item" end>홈</RouterLink>
          <RouterLink to="/cities" class="hub-nav__item">날씨</RouterLink>
          <RouterLink to="/guide" class="hub-nav__item">가이드</RouterLink>
          <RouterLink to="/about" class="hub-nav__item">소개</RouterLink>
        </nav>
      </header>

      <main class="hub-main">
        <RouterView />
      </main>

      <footer v-if="!isLab" class="hub-footer">
        <span>AeroCast · Vue 3 + Router + Pinia</span>
      </footer>
    </div>
  </div>
</template>

<style>
.hub-app {
  width: 100%;
  max-width: 100%;
  min-height: 100vh;
  margin: 0;
  padding: 28px 24px 56px;
  box-sizing: border-box;
  overflow-x: clip;
  overscroll-behavior-x: none;
  display: flex;
  justify-content: center;
  color: #2a3340;
  font-size: 24px;
  font-family:
    'Pretendard',
    'Apple SD Gothic Neo',
    -apple-system,
    BlinkMacSystemFont,
    system-ui,
    sans-serif;
}

/* Daily Hub 비율 */
.hub-frame {
  width: min(1440px, 96vw);
  max-width: 1440px;
  min-width: 0;
  margin: 0 auto;
  box-sizing: border-box;
  overflow-x: clip;
}

.hub-header {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  margin: 0 0 20px;
  padding: 0;
  background: transparent;
  border: none;
}

.hub-header__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.hub-brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: inherit;
  font-weight: 800;
  font-size: 1.9rem;
  letter-spacing: -0.02em;
}

.hub-brand__mark {
  width: 54px;
  height: 54px;
  border-radius: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.55rem;
  background: rgba(255, 255, 255, 0.55);
  border: none;
  box-shadow: 0 4px 14px rgba(90, 110, 140, 0.12);
}

.hub-nav {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  padding: 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.5);
  border: none;
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  box-shadow: 0 10px 28px rgba(90, 110, 140, 0.12);
}

.hub-nav__item {
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: rgba(42, 51, 64, 0.62);
  font-size: 1.4rem;
  font-weight: 800;
  padding: 18px 14px;
  border-radius: 999px;
  white-space: nowrap;
  min-width: 0;
  transition:
    color 0.15s ease,
    background 0.15s ease;
}

.hub-nav__item:hover {
  color: #2a3340;
  background: rgba(255, 255, 255, 0.55);
}

.hub-nav__item.router-link-active {
  color: #2a3340;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 4px 14px rgba(90, 110, 140, 0.12);
}

.hub-header__actions {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
  max-width: 100%;
}

.hub-fav {
  font-size: 1.2rem;
  font-weight: 800;
  color: #b45309;
  padding: 12px 16px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.55);
  border: none;
  box-shadow: 0 4px 12px rgba(90, 110, 140, 0.1);
}

.hub-main {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: hidden;
  box-sizing: border-box;
}

.hub-footer {
  width: 100%;
  max-width: 100%;
  margin-top: 22px;
  padding-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  justify-content: space-between;
  font-size: 1.15rem;
  color: rgba(42, 51, 64, 0.55);
  box-sizing: border-box;
}

.hub-footer__labs {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hub-footer__labs a {
  color: #9ec5ff;
  text-decoration: none;
  font-weight: 600;
}

@media (max-width: 720px) {
  .hub-nav {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    border-radius: 22px;
  }

  .hub-nav__item {
    font-size: 0.95rem;
    padding: 12px 8px;
  }
}
</style>
