<script setup>
/**
 * 왼쪽 full-height 사이드바 (대시보드형)
 * - 화면 왼쪽 전체를 차지
 * - 기능이 정해지면 TOOLS에 항목만 추가
 */
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const TOOLS = [
  { id: 'home', label: '홈', icon: '⌂', to: '/', enabled: true },
  { id: 'cities', label: '날씨', icon: '☁', to: '/cities', enabled: true },
  { id: 'guide', label: '가이드', icon: '📖', to: '/guide', enabled: true },
  { id: 'coming-a', label: '추가 예정', icon: '＋', to: null, enabled: false },
  { id: 'coming-b', label: '추가 예정', icon: '＋', to: null, enabled: false },
]

const activeId = computed(() => {
  if (route.path === '/') return 'home'
  if (route.path.startsWith('/cities') || route.path.startsWith('/weather')) return 'cities'
  if (route.path.startsWith('/guide')) return 'guide'
  return ''
})

function onSelect(tool) {
  if (!tool.enabled || !tool.to) return
  router.push(tool.to)
}
</script>

<template>
  <aside class="side-rail" aria-label="부가 기능">
    <div class="side-rail__brand">
      <span class="side-rail__logo" aria-hidden="true">☁</span>
      <div>
        <p class="side-rail__name">AeroCast</p>
        <p class="side-rail__sub">Tools</p>
      </div>
    </div>

    <p class="side-rail__section">Menu</p>

    <ul class="side-rail__list">
      <li v-for="tool in TOOLS" :key="tool.id">
        <button
          type="button"
          class="side-rail__btn"
          :class="{
            'is-active': activeId === tool.id,
            'is-disabled': !tool.enabled,
          }"
          :title="tool.enabled ? tool.label : `${tool.label} (준비 중)`"
          :disabled="!tool.enabled"
          @click="onSelect(tool)"
        >
          <span class="side-rail__icon" aria-hidden="true">{{ tool.icon }}</span>
          <span class="side-rail__label">{{ tool.label }}</span>
        </button>
      </li>
    </ul>

    <div class="side-rail__foot">
      <p class="side-rail__hint">기능을 정하면<br />여기에 추가됩니다</p>
    </div>
  </aside>
</template>

<style scoped>
.side-rail {
  width: 280px;
  flex-shrink: 0;
  min-height: 100vh;
  height: 100vh;
  position: sticky;
  top: 0;
  box-sizing: border-box;
  padding: 28px 20px 24px;
  background: rgba(255, 255, 255, 0.82);
  border-right: 1px solid rgba(90, 110, 140, 0.12);
  backdrop-filter: blur(20px);
  display: flex;
  flex-direction: column;
  gap: 18px;
  overflow: auto;
  z-index: 30;
}

.side-rail__brand {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 4px 8px 12px;
}

.side-rail__logo {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  font-size: 1.5rem;
  background: rgba(90, 140, 200, 0.16);
}

.side-rail__name {
  margin: 0;
  font-size: 1.45rem;
  font-weight: 800;
  color: #2a3340;
  letter-spacing: -0.02em;
}

.side-rail__sub {
  margin: 2px 0 0;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(42, 51, 64, 0.42);
}

.side-rail__section {
  margin: 8px 10px 0;
  font-size: 0.9rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(42, 51, 64, 0.38);
}

.side-rail__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.side-rail__btn {
  width: 100%;
  border: none;
  background: transparent;
  border-radius: 16px;
  padding: 16px 14px;
  cursor: pointer;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 14px;
  color: rgba(42, 51, 64, 0.72);
  text-align: left;
}

.side-rail__btn:hover:not(:disabled) {
  background: rgba(140, 168, 184, 0.14);
  color: #2a3340;
}

.side-rail__btn.is-active {
  background: rgba(90, 140, 200, 0.95);
  color: #fff;
  box-shadow: 0 10px 22px rgba(70, 110, 150, 0.22);
}

.side-rail__btn.is-disabled {
  opacity: 0.42;
  cursor: not-allowed;
}

.side-rail__icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  font-size: 1.45rem;
  flex-shrink: 0;
  background: rgba(140, 168, 184, 0.18);
}

.side-rail__btn.is-active .side-rail__icon {
  background: rgba(255, 255, 255, 0.22);
}

.side-rail__label {
  font-size: 1.3rem;
  font-weight: 800;
  line-height: 1.2;
}

.side-rail__foot {
  margin-top: auto;
  padding-top: 12px;
}

.side-rail__hint {
  margin: 0;
  padding: 16px 14px;
  border-radius: 16px;
  text-align: center;
  font-size: 1rem;
  line-height: 1.45;
  color: rgba(42, 51, 64, 0.48);
  font-weight: 600;
  background: rgba(140, 168, 184, 0.12);
}

@media (max-width: 900px) {
  .side-rail {
    width: 100%;
    height: auto;
    min-height: 0;
    position: static;
    border-right: none;
    border-bottom: 1px solid rgba(90, 110, 140, 0.12);
  }

  .side-rail__list {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .side-rail__btn {
    flex: 1 1 140px;
  }

  .side-rail__foot {
    margin-top: 0;
  }
}
</style>
