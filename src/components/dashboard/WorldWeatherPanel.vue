<script setup>
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { convertTemp } from '@/utils/temperature'
import { useConfigStore } from '@/stores/configStore'

const props = defineProps({
  cities: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  tall: { type: Boolean, default: false },
  interactive: { type: Boolean, default: true },
})

const emit = defineEmits(['show-detail'])

function onOpen() {
  if (props.interactive) emit('show-detail')
}

const configStore = useConfigStore()
const mapEl = ref(null)
let map = null
let layerGroup = null

function renderMarkers() {
  if (!map) return
  if (layerGroup) {
    layerGroup.clearLayers()
  } else {
    layerGroup = L.layerGroup().addTo(map)
  }

  props.cities.forEach((city) => {
    const temp =
      city.temp == null ? '—' : `${convertTemp(city.temp, configStore.unit)}${configStore.unitSymbol}`
    const html = `
      <div class="wm-pin">
        <span class="wm-pin__emoji">${city.emoji || '☁'}</span>
        <strong>${temp}</strong>
        <small>${city.ko || city.name}</small>
      </div>
    `
    const icon = L.divIcon({
      className: 'wm-pin-wrap',
      html,
      iconSize: [72, 64],
      iconAnchor: [36, 32],
    })
    L.marker([city.lat, city.lon], { icon }).addTo(layerGroup)
  })
}

function ensureMap() {
  if (map || !mapEl.value) return
  map = L.map(mapEl.value, {
    zoomControl: false,
    attributionControl: true,
    scrollingWheelZoom: false,
    dragging: true,
  }).setView([20, 15], 1.4)

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OSM &copy; CARTO',
    maxZoom: 8,
  }).addTo(map)

  renderMarkers()
  refreshMapSize()
}

function refreshMapSize() {
  if (!map) return
  requestAnimationFrame(() => {
    map?.invalidateSize({ animate: false })
    setTimeout(() => map?.invalidateSize({ animate: false }), 80)
    setTimeout(() => map?.invalidateSize({ animate: false }), 280)
  })
}

watch(
  () => [props.cities, configStore.unit],
  async () => {
    await nextTick()
    ensureMap()
    renderMarkers()
    refreshMapSize()
  },
  { deep: true },
)

watch(
  () => props.loading,
  async (loading) => {
    if (loading) return
    await nextTick()
    ensureMap()
    refreshMapSize()
  },
)

onMounted(async () => {
  await nextTick()
  ensureMap()
  refreshMapSize()
  window.addEventListener('resize', refreshMapSize)
})

onUnmounted(() => {
  window.removeEventListener('resize', refreshMapSize)
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<template>
  <section
    class="world glass-card"
    :class="{ 'world--tall': tall, 'is-clickable': interactive }"
    @click="onOpen"
  >
    <header class="world__head">
      <div>
        <h3>World Weather</h3>
        <p>Open-Meteo · 세계 지도</p>
      </div>
      <div class="world__actions" @click.stop>
        <span class="ac-chip ac-chip--live">Live</span>
        <button
          v-if="interactive"
          type="button"
          class="ac-btn ac-btn--primary ac-btn--sm"
          @click="onOpen"
        >
          확대
        </button>
      </div>
    </header>

    <div class="world__stage" @click.stop>
      <div ref="mapEl" class="world__map" />
      <p v-if="loading" class="world__loading">세계 날씨 로딩…</p>
    </div>
  </section>
</template>

<style scoped>
.world {
  padding: 20px;
  box-sizing: border-box;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.world__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.world__head h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 800;
  color: #fff;
}

.world__head p {
  margin: 4px 0 0;
  font-size: 0.88rem;
  font-weight: 600;
  color: rgba(232, 238, 248, 0.55);
}

.world__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.world__stage {
  position: relative;
  flex: 1;
  min-height: 180px;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.world--tall .world__stage {
  min-height: 420px;
}

.world__map {
  width: 100%;
  height: 100%;
  min-height: 280px;
  background: #0b1220;
}

.world--tall .world__map {
  min-height: 420px;
}

.world__loading {
  position: absolute;
  inset: 0;
  margin: 0;
  display: grid;
  place-items: center;
  background: rgba(11, 18, 32, 0.7);
  font-size: 1.15rem;
  font-weight: 700;
  color: #e8eef8;
  z-index: 5;
}
</style>

<style>
.wm-pin-wrap {
  background: transparent !important;
  border: none !important;
}

.wm-pin {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  min-width: 68px;
  padding: 8px 10px;
  border-radius: 14px;
  background: rgba(11, 18, 32, 0.88);
  border: 1px solid rgba(56, 189, 248, 0.45);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.4);
  color: #fff;
  text-align: center;
  line-height: 1.15;
}

.wm-pin__emoji {
  font-size: 1.15rem;
}

.wm-pin strong {
  font-size: 1rem;
  font-weight: 800;
}

.wm-pin small {
  font-size: 0.78rem;
  font-weight: 700;
  color: rgba(232, 238, 248, 0.65);
}
</style>
