<script setup>
// 최근검색, 즐겨찾기 목록 컴포넌트
import { computed } from 'vue'
import { useWeatherStore } from '@/stores/weatherStore'

const props = defineProps({
  cities: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['apply-search', 'jump-city'])

const weatherStore = useWeatherStore()

const favoriteCities = computed(() => {
  return props.cities.filter((city) => weatherStore.isFavorite(city.id))
})

function applySearch(query) {
  emit('apply-search', query)
}

function jumpCity(cityId) {
  emit('jump-city', cityId)
}
</script>

<template>
  <section class="store-panel">
    <div v-if="weatherStore.hasRecentSearches" class="store-block">
      <div class="store-block__head">
        <h4>최근 검색어</h4>
        <button type="button" class="text-btn" @click="weatherStore.clearRecentSearches">전체 삭제</button>
      </div>
      <div class="chip-row">
        <button
          v-for="query in weatherStore.recentSearches"
          :key="query"
          type="button"
          class="chip"
          @click="applySearch(query)"
        >
          {{ query }}
        </button>
      </div>
    </div>

    <div v-if="weatherStore.hasFavorites" class="store-block">
      <div class="store-block__head">
        <h4>즐겨찾기 도시 ({{ weatherStore.favoriteCount }})</h4>
      </div>
      <div class="chip-row">
        <button
          v-for="city in favoriteCities"
          :key="city.id"
          type="button"
          class="chip chip--favorite"
          @click="jumpCity(city.id)"
        >
          ★ {{ city.name }}
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.store-panel {
  display: grid;
  gap: 12px;
  margin-bottom: 16px;
}

.store-block {
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.5);
  border: none;
  box-shadow: 0 6px 16px rgba(90, 110, 140, 0.08);
}

.store-block__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.store-block h4 {
  margin: 0;
  font-size: 1.2rem;
  color: #2a3340;
  font-weight: 700;
}

.text-btn {
  border: none;
  background: transparent;
  color: rgba(42, 51, 64, 0.5);
  font-size: 1rem;
  cursor: pointer;
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  border: none;
  background: rgba(255, 255, 255, 0.75);
  color: #2a3340;
  border-radius: 999px;
  padding: 8px 14px;
  font-size: 1.05rem;
  cursor: pointer;
  transition: all 0.18s ease;
  box-shadow: 0 2px 8px rgba(90, 110, 140, 0.08);
}

.chip:hover {
  background: rgba(255, 255, 255, 0.95);
}

.chip--favorite {
  color: #b45309;
}

:global(.hub-app--light) .store-block {
  background: rgba(255, 255, 255, 0.82);
  border-color: rgba(15, 23, 42, 0.08);
}

:global(.hub-app--light) .store-block h4,
:global(.hub-app--light) .chip {
  color: #0f172a;
}

:global(.hub-app--light) .chip {
  background: #f8fafc;
  border-color: rgba(15, 23, 42, 0.1);
}

:global(.hub-app--light) .text-btn {
  color: #64748b;
}
</style>
