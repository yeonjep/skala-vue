import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

const RECENT_KEY = 'skala-weather-recent'
const FAVORITE_KEY = 'skala-weather-favorites'
const MAX_RECENT = 5

function loadList(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveList(key, list) {
  localStorage.setItem(key, JSON.stringify(list))
}

// [5일차 과제] 나만의 Store — 최근 검색어·즐겨찾기 도시
export const useWeatherStore = defineStore('weather', () => {
  const recentSearches = ref(loadList(RECENT_KEY))
  const favoriteCityIds = ref(loadList(FAVORITE_KEY))

  const favoriteCount = computed(() => favoriteCityIds.value.length)

  const hasFavorites = computed(() => favoriteCityIds.value.length > 0)

  const hasRecentSearches = computed(() => recentSearches.value.length > 0)

  function addRecentSearch(query) {
    const trimmed = query.trim()
    if (!trimmed) return

    const next = [trimmed, ...recentSearches.value.filter((item) => item !== trimmed)].slice(0, MAX_RECENT)
    recentSearches.value = next
    saveList(RECENT_KEY, next)
  }

  function clearRecentSearches() {
    recentSearches.value = []
    localStorage.removeItem(RECENT_KEY)
  }

  function isFavorite(cityId) {
    return favoriteCityIds.value.includes(cityId)
  }

  function toggleFavorite(cityId) {
    if (isFavorite(cityId)) {
      favoriteCityIds.value = favoriteCityIds.value.filter((id) => id !== cityId)
    } else {
      favoriteCityIds.value = [...favoriteCityIds.value, cityId]
    }
    saveList(FAVORITE_KEY, favoriteCityIds.value)
  }

  function removeFavorite(cityId) {
    favoriteCityIds.value = favoriteCityIds.value.filter((id) => id !== cityId)
    saveList(FAVORITE_KEY, favoriteCityIds.value)
  }

  return {
    recentSearches,
    favoriteCityIds,
    favoriteCount,
    hasFavorites,
    hasRecentSearches,
    addRecentSearch,
    clearRecentSearches,
    isFavorite,
    toggleFavorite,
    removeFavorite,
  }
})
