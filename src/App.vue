<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import UnitToggler from './components/exercise/UnitToggler.vue'
import HubSideRail from './components/HubSideRail.vue'
import { useWeatherStore } from './stores/weatherStore'

const route = useRoute()
const weatherStore = useWeatherStore()
const isLab = computed(() => String(route.name || '').startsWith('Lab'))
const railDock = ref('left')

function onRailDock(dock) {
  railDock.value = dock || 'left'
}

onMounted(() => {
  window.scrollTo(0, 0)
  document.documentElement.scrollLeft = 0
  document.body.scrollLeft = 0
})
</script>

<template>
  <div
    class="hub-app aurora-bg"
    :class="[{ 'hub-app--lab': isLab }, `hub-app--rail-${railDock}`]"
  >
    <HubSideRail v-if="!isLab" @dock="onRailDock" />

    <div class="hub-main-panel">
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
  min-height: 100dvh;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  color: #e8eef8;
  font-size: 13px;
  font-family:
    'Pretendard',
    'Apple SD Gothic Neo',
    -apple-system,
    BlinkMacSystemFont,
    system-ui,
    sans-serif;
}

.hub-app--lab {
  padding: 20px 18px 40px;
  display: flex;
  justify-content: center;
}

.hub-main-panel {
  box-sizing: border-box;
  padding: 12px 14px 18px;
  overflow-x: hidden;
}

.hub-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  margin: 0 0 10px;
  flex-shrink: 0;
}

.hub-header__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.hub-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: #fff;
  font-weight: 800;
  font-size: 1.1rem;
  letter-spacing: -0.02em;
}

.hub-brand__mark {
  width: 30px;
  height: 30px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
  background: linear-gradient(145deg, rgba(56, 189, 248, 0.35), rgba(129, 140, 248, 0.35));
  border: 1px solid rgba(255, 255, 255, 0.16);
}

.hub-nav {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 4px;
  width: 100%;
  box-sizing: border-box;
  padding: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(18px);
}

.hub-nav__item {
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: rgba(232, 238, 248, 0.65);
  font-size: 0.82rem;
  font-weight: 800;
  padding: 7px 10px;
  border-radius: 999px;
  white-space: nowrap;
  min-width: 0;
}

.hub-nav__item:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
}

.hub-nav__item.router-link-active {
  color: #0b1220;
  background: #fff;
  box-shadow: 0 8px 22px rgba(56, 189, 248, 0.25);
}

.hub-header__actions {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.hub-fav {
  font-size: 0.9rem;
  font-weight: 800;
  color: #fbbf24;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.hub-main {
  width: 100%;
  margin: 0;
  min-width: 0;
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
}

.hub-footer {
  width: 100%;
  margin: auto 0 0;
  padding-top: 12px;
  flex-shrink: 0;
  font-size: 0.85rem;
  color: rgba(232, 238, 248, 0.45);
}

@media (max-width: 900px) {
  .hub-app--lab {
    padding: 18px 16px 40px;
  }

  .hub-main-panel {
    padding: 14px 14px 24px;
  }

  .hub-nav {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    border-radius: 22px;
  }

  .hub-nav__item {
    font-size: 1rem;
    padding: 12px 8px;
  }
}
</style>
