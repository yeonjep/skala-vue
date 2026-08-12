import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'

const UNIT_KEY = 'skala-weather-unit'

function loadUnit() {
  try {
    const saved = localStorage.getItem(UNIT_KEY)
    return saved === 'fahrenheit' ? 'fahrenheit' : 'celsius'
  } catch {
    return 'celsius'
  }
}

export const useConfigStore = defineStore('config', () => {
  // 1. state: 단위를 저장하는 변수 (초기값은 'celsius')
  const unit = ref(loadUnit())

  // 2. getters: 현재 단위 상태에 맞춰 화면에 뿌릴 기호(℃ / ℉)를 실시간 리턴
  const unitSymbol = computed(() => {
    return unit.value === 'celsius' ? '℃' : '℉'
  })

  const unitLabel = computed(() => {
    return unit.value === 'celsius' ? '섭씨(℃)' : '화씨(℉)'
  })

  // 3. actions: 버튼 클릭 시 'celsius'와 'fahrenheit'를 토글(스위칭)하는 함수
  function toggleUnit() {
    unit.value = unit.value === 'celsius' ? 'fahrenheit' : 'celsius'
  }

  watch(unit, (value) => {
    localStorage.setItem(UNIT_KEY, value)
  })

  // 라이트모드 잔여 class 제거
  if (typeof document !== 'undefined') {
    document.documentElement.classList.remove('theme-light')
    try {
      localStorage.removeItem('skala-weather-dark-mode')
    } catch {
      /* ignore */
    }
  }

  return {
    unit,
    unitSymbol,
    unitLabel,
    toggleUnit,
  }
})
