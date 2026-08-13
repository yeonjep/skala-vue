<script setup>
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { fetchRadarFrames } from '@/api/rainViewer'

const props = defineProps({
  lat: { type: Number, required: true },
  lon: { type: Number, required: true },
  cityName: { type: String, default: '' },
  compact: { type: Boolean, default: false },
})

const mapEl = ref(null)
const loading = ref(false)
const errorMsg = ref('')
const frameLabel = ref('')
const playing = ref(true)
const host = ref('')
const frames = ref([])
const frameIndex = ref(0)

let map = null
let marker = null
let frontLayer = null
let backLayer = null
let timer = null
let fading = false
let fadeRaf = 0
let resizeObserver = null

function refreshMapSize() {
  if (!map) return
  requestAnimationFrame(() => {
    map?.invalidateSize({ animate: false })
    setTimeout(() => map?.invalidateSize({ animate: false }), 120)
  })
}

function tileUrl(frame) {
  return `${host.value}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`
}

function makeRadarLayer(url, opacity = 0) {
  return L.tileLayer(url, {
    opacity,
    zIndex: 10,
    maxZoom: 7,
    maxNativeZoom: 7,
    className: 'radar-tiles',
    // 타일 페이드로 빈 타일 깜빡임 완화
    updateWhenIdle: true,
    updateWhenZooming: false,
  })
}

function cancelFade() {
  if (fadeRaf) {
    cancelAnimationFrame(fadeRaf)
    fadeRaf = 0
  }
  fading = false
}

function fadeSwap(fromLayer, toLayer, duration = 450) {
  return new Promise((resolve) => {
    cancelFade()
    fading = true
    const start = performance.now()
    const fromStart = fromLayer?.options?.opacity ?? 0.7
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = t * (2 - t)
      if (toLayer) toLayer.setOpacity(0.7 * eased)
      if (fromLayer) fromLayer.setOpacity(fromStart * (1 - eased))
      if (t < 1) {
        fadeRaf = requestAnimationFrame(step)
      } else {
        fading = false
        fadeRaf = 0
        resolve()
      }
    }
    fadeRaf = requestAnimationFrame(step)
  })
}

async function setRadarFrame(index, { instant = false } = {}) {
  if (!map || !frames.value.length) return
  const next = ((index % frames.value.length) + frames.value.length) % frames.value.length
  frameIndex.value = next
  const frame = frames.value[next]
  frameLabel.value = frame.label
  const url = tileUrl(frame)

  // 첫 프레임 또는 강제 즉시 전환
  if (!frontLayer || instant) {
    if (frontLayer) map.removeLayer(frontLayer)
    if (backLayer) map.removeLayer(backLayer)
    frontLayer = makeRadarLayer(url, 0.7)
    backLayer = null
    frontLayer.addTo(map)
    return
  }

  if (fading) return

  // 새 프레임을 뒤에 깔고 → 페이드 인 후 이전 제거 (깜빡임 방지)
  const incoming = makeRadarLayer(url, 0)
  incoming.addTo(map)
  const outgoing = frontLayer

  await new Promise((resolve) => {
    let done = false
    const finish = () => {
      if (done) return
      done = true
      incoming.off('load', finish)
      resolve()
    }
    incoming.on('load', finish)
    // 타일 로드가 늦어도 잠깐만 기다림
    setTimeout(finish, 700)
  })

  await fadeSwap(outgoing, incoming, 480)

  if (outgoing) map.removeLayer(outgoing)
  frontLayer = incoming
  backLayer = null
}

async function loadFrames() {
  loading.value = true
  errorMsg.value = ''
  try {
    const data = await fetchRadarFrames()
    host.value = data.host
    frames.value = data.frames
    if (!frames.value.length) {
      errorMsg.value = '레이더 프레임이 없습니다.'
      return
    }
    await nextTick()
    ensureMap()
    await setRadarFrame(frames.value.length - 1, { instant: true })
  } catch (err) {
    console.error('[RainViewer]', err)
    errorMsg.value = '레이더를 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

function ensureMap() {
  if (map || !mapEl.value) return
  map = L.map(mapEl.value, {
    zoomControl: true,
    attributionControl: true,
    fadeAnimation: true,
  }).setView([props.lat, props.lon], 5)

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    maxZoom: 18,
  }).addTo(map)

  marker = L.circleMarker([props.lat, props.lon], {
    radius: 7,
    color: '#38bdf8',
    fillColor: '#38bdf8',
    fillOpacity: 0.9,
    weight: 2,
  }).addTo(map)
}

function startPlay() {
  stopPlay()
  timer = window.setInterval(() => {
    if (!frames.value.length || fading) return
    setRadarFrame(frameIndex.value + 1)
  }, 1400)
}

function stopPlay() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

watch(playing, (on) => {
  if (on) startPlay()
  else stopPlay()
})

watch(
  () => [props.lat, props.lon],
  ([lat, lon]) => {
    if (!map) return
    map.setView([lat, lon], map.getZoom())
    if (marker) marker.setLatLng([lat, lon])
  },
)

onMounted(async () => {
  await loadFrames()
  if (playing.value) startPlay()
  refreshMapSize()
  await nextTick()
  if (mapEl.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => refreshMapSize())
    resizeObserver.observe(mapEl.value)
    const stage = mapEl.value.parentElement
    if (stage) resizeObserver.observe(stage)
  }
})

onUnmounted(() => {
  stopPlay()
  cancelFade()
  resizeObserver?.disconnect()
  resizeObserver = null
  if (map) {
    map.remove()
    map = null
  }
  frontLayer = null
  backLayer = null
  marker = null
})

defineExpose({ reload: loadFrames })
</script>

<template>
  <section class="radar" :class="{ 'radar--compact': compact }">
    <header class="radar__head">
      <div>
        <h3>Precipitation Radar</h3>
        <p>RainViewer · {{ cityName }}</p>
      </div>
      <div class="radar__actions" @click.stop>
        <button type="button" class="ac-btn ac-btn--sm" @click="playing = !playing">
          {{ playing ? 'Pause' : 'Play' }}
        </button>
        <button type="button" class="ac-btn ac-btn--sm ac-btn--ghost" @click="loadFrames">
          Refresh
        </button>
      </div>
    </header>

    <div class="radar__stage">
      <div v-show="!errorMsg" ref="mapEl" class="radar__map" />
      <p v-if="loading" class="radar__overlay">레이더 로딩…</p>
      <p v-else-if="errorMsg" class="radar__overlay is-error">{{ errorMsg }}</p>
      <span v-if="frameLabel && !errorMsg" class="radar__time">{{ frameLabel }}</span>
    </div>
    <p class="radar__credit">
      Radar by
      <a href="https://www.rainviewer.com/" target="_blank" rel="noreferrer">RainViewer</a>
    </p>
  </section>
</template>

<style scoped>
.radar {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 280px;
  padding: 18px;
  box-sizing: border-box;
}

.radar__head {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: flex-start;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.radar__head h3 {
  margin: 0;
  font-size: 1.55rem;
  font-weight: 800;
  color: #fff;
}

.radar__head p {
  margin: 4px 0 0;
  font-size: 1.15rem;
  font-weight: 600;
  color: rgba(232, 238, 248, 0.55);
}

.radar__actions {
  display: flex;
  gap: 6px;
}

.radar__stage {
  position: relative;
  flex: 1 1 auto;
  min-height: 240px;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.radar__map {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  min-height: 0;
  background: #0b1220;
}

.radar--compact .radar__stage {
  min-height: 320px;
}

.radar__overlay {
  position: absolute;
  inset: 0;
  margin: 0;
  display: grid;
  place-items: center;
  background: rgba(11, 18, 32, 0.55);
  font-weight: 700;
  color: #e8eef8;
  z-index: 500;
}

.radar__overlay.is-error {
  color: #fecaca;
}

.radar__time {
  position: absolute;
  right: 12px;
  bottom: 12px;
  z-index: 500;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(11, 18, 32, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.14);
  font-size: 0.95rem;
  font-weight: 800;
  color: #fff;
}

.radar__credit {
  margin: 10px 0 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(232, 238, 248, 0.45);
}

.radar__credit a {
  color: #38bdf8;
}

:deep(.radar-tiles) {
  transition: none;
}
</style>
