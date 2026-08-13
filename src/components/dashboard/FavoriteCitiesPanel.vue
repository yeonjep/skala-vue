<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { convertTemp } from '@/utils/temperature'
import { useConfigStore } from '@/stores/configStore'
import { useWeatherStore } from '@/stores/weatherStore'
import { CITY_CATALOG } from '@/data/cities'

const props = defineProps({
  cityWeather: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  interactive: { type: Boolean, default: true },
})

const emit = defineEmits(['select', 'show-detail'])

function onOpen() {
  if (props.interactive) emit('show-detail')
}

const router = useRouter()
const configStore = useConfigStore()
const weatherStore = useWeatherStore()

const favorites = computed(() => {
  const ids = weatherStore.favoriteCityIds
  const list = ids.length
    ? CITY_CATALOG.filter((c) => ids.includes(c.id))
    : CITY_CATALOG.slice(0, 3)
  return list.map((city) => {
    const wx = props.cityWeather.find((w) => w.id === city.id)
    return { ...city, wx }
  })
})

function tempOf(city) {
  if (!city.wx || city.wx.temp == null || Number.isNaN(Number(city.wx.temp))) return '—'
  return `${convertTemp(city.wx.temp, configStore.unit)}${configStore.unitSymbol}`
}
</script>

<template>
  <section
    class="fav glass-card"
    :class="{ 'is-clickable': interactive }"
    @click="onOpen"
  >
    <header class="fav__head">
      <h3>즐겨찾기 도시</h3>
      <button type="button" class="ac-btn ac-btn--sm ac-btn--ghost" @click.stop="router.push('/cities')">
        Add
      </button>
    </header>

    <el-skeleton v-if="loading" :rows="3" animated />
    <div v-else class="fav__list">
      <button
        v-for="city in favorites"
        :key="city.id"
        type="button"
        class="fav__item"
        @click.stop="emit('select', city)"
      >
        <span class="fav__emoji">{{ city.wx?.emoji || '☁' }}</span>
        <span class="fav__meta">
          <strong>{{ city.name }}</strong>
          <small>{{ city.wx?.status || '…' }}</small>
        </span>
        <span class="fav__temp">{{ tempOf(city) }}</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.fav {
  padding: 18px;
  box-sizing: border-box;
  height: 100%;
}

.fav__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.fav__head h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 800;
  color: #fff;
}

.fav__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.fav__item {
  display: grid;
  grid-template-columns: 40px 1fr auto;
  gap: 10px;
  align-items: center;
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-align: left;
  cursor: pointer;
  padding: 12px 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.06);
  color: #e8eef8;
}

.fav__item:hover {
  border-color: rgba(56, 189, 248, 0.4);
}

.fav__emoji {
  font-size: 1.45rem;
}

.fav__meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.fav__meta strong {
  font-size: 1.15rem;
  font-weight: 800;
}

.fav__meta small {
  color: rgba(232, 238, 248, 0.5);
  font-weight: 600;
  font-size: 0.95rem;
}

.fav__temp {
  font-size: 1.2rem;
  font-weight: 800;
  color: #fff;
}
</style>
