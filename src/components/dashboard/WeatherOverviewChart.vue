<script setup>
import { computed, ref } from 'vue'
import { convertTemp } from '@/utils/temperature'
import { useConfigStore } from '@/stores/configStore'

const props = defineProps({
  hourly: { type: Array, default: () => [] },
  daily: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  interactive: { type: Boolean, default: true },
})

const emit = defineEmits(['show-detail'])

function onOpen() {
  if (props.interactive) emit('show-detail')
}

const configStore = useConfigStore()
const metric = ref('temp')

const gradientId = `areaFill-${Math.random().toString(36).slice(2, 9)}`

const series = computed(() => {
  if (metric.value === 'precip') {
    return props.daily.map((d) => ({
      label: d.weekday,
      value: Number(d.precipMm) || 0,
      tick: true,
    }))
  }
  if (metric.value === 'humidity') {
    return props.hourly.map((h, i) => ({
      label: h.hour,
      value: Number(h.humidity) || 0,
      tick: shouldShowHourTick(h.hour, i, props.hourly.length),
    }))
  }
  return props.hourly.map((h, i) => ({
    label: h.hour,
    value: convertTemp(h.temp, configStore.unit),
    tick: shouldShowHourTick(h.hour, i, props.hourly.length),
  }))
})

/** 약 6시간 간격 눈금 (1시간 데이터면 6칸, 3시간 데이터면 2칸) */
function shouldShowHourTick(hour, index, total) {
  const h = String(hour || '')
  if (/^(00|06|12|18):00$/.test(h)) return true
  if (total <= 5) return true
  // 24포인트(1h) → 6시간마다 / 8포인트(3h) → 6시간마다
  const step = total >= 20 ? 6 : total >= 8 ? 2 : 1
  return index % step === 0
}

const unitLabel = computed(() => {
  if (metric.value === 'humidity') return '%'
  if (metric.value === 'precip') return 'mm'
  return configStore.unitSymbol
})

const maxVal = computed(() => {
  const vals = series.value.map((s) => s.value)
  if (!vals.length) return 1
  const raw = Math.max(...vals)
  if (metric.value === 'humidity') return 100
  if (metric.value === 'precip') return Math.max(raw, 1)
  return Math.ceil(raw + 1)
})

const minVal = computed(() => {
  const vals = series.value.map((s) => s.value)
  if (!vals.length) return 0
  if (metric.value === 'humidity' || metric.value === 'precip') return 0
  return Math.floor(Math.min(...vals) - 1)
})

const yTicks = computed(() => {
  const min = minVal.value
  const max = maxVal.value
  const mid = (min + max) / 2
  return [
    { value: max, y: 8 },
    { value: mid, y: 50 },
    { value: min, y: 92 },
  ].map((t) => ({
    ...t,
    text:
      metric.value === 'precip'
        ? `${Number(t.value).toFixed(t.value < 10 ? 1 : 0)}`
        : `${Math.round(t.value)}`,
  }))
})

const plot = computed(() => {
  const list = series.value
  if (!list.length) {
    return { points: '', area: '', xTicks: [], gridYs: [8, 50, 92] }
  }
  const span = Math.max(maxVal.value - minVal.value, 1)
  const padL = 3
  const padR = 3
  const pts = list.map((s, i) => {
    const x =
      list.length === 1 ? 50 : padL + (i / (list.length - 1)) * (100 - padL - padR)
    const y = 92 - ((s.value - minVal.value) / span) * 84
    return { x, y, ...s }
  })
  const points = pts.map((p) => `${p.x},${p.y}`).join(' ')
  const area = `${pts[0].x},100 ${points} ${pts[pts.length - 1].x},100`
  const xTicks = pts
    .map((p, i) => ({
      ...p,
      index: i,
      align: i === 0 ? 'start' : i === pts.length - 1 ? 'end' : 'center',
    }))
    .filter((p) => p.tick || p.index === 0 || p.index === pts.length - 1)
  return { points, area, xTicks, gridYs: [8, 50, 92] }
})
</script>

<template>
  <section
    class="chart glass-card"
    :class="{ 'is-clickable': interactive }"
    @click="onOpen"
  >
    <header class="chart__head">
      <div>
        <h3>Overview</h3>
        <p class="chart__sub">
          {{ metric === 'precip' ? '일별 강수량' : '시간별 · 6시간 간격 표시' }}
          · {{ unitLabel }}
        </p>
      </div>
      <div class="ac-seg" @click.stop>
        <button
          type="button"
          class="ac-seg__btn"
          :class="{ 'is-active': metric === 'temp' }"
          @click="metric = 'temp'"
        >
          Temp
        </button>
        <button
          type="button"
          class="ac-seg__btn"
          :class="{ 'is-active': metric === 'humidity' }"
          @click="metric = 'humidity'"
        >
          Humidity
        </button>
        <button
          type="button"
          class="ac-seg__btn"
          :class="{ 'is-active': metric === 'precip' }"
          @click="metric = 'precip'"
        >
          Rain
        </button>
      </div>
    </header>

    <el-skeleton v-if="loading" :rows="4" animated />
    <div v-else class="chart__body">
      <div class="chart__plot">
        <div class="chart__y" aria-hidden="true">
          <span v-for="t in yTicks" :key="`y-${t.text}`" :style="{ top: `${t.y}%` }">
            {{ t.text }}{{ unitLabel }}
          </span>
        </div>

        <div class="chart__canvas">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="chart__svg" aria-hidden="true">
            <defs>
              <linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="rgba(56,189,248,0.55)" />
                <stop offset="100%" stop-color="rgba(56,189,248,0.02)" />
              </linearGradient>
            </defs>

            <line
              v-for="gy in plot.gridYs"
              :key="`g-${gy}`"
              x1="0"
              :y1="gy"
              x2="100"
              :y2="gy"
              class="chart__grid"
            />
            <line
              v-for="xt in plot.xTicks"
              :key="`vg-${xt.label}-${xt.x}`"
              :x1="xt.x"
              y1="0"
              :x2="xt.x"
              y2="100"
              class="chart__grid chart__grid--v"
            />

            <polygon v-if="plot.area" :points="plot.area" :fill="`url(#${gradientId})`" />
            <polyline
              v-if="plot.points"
              :points="plot.points"
              fill="none"
              stroke="#38bdf8"
              stroke-width="2.4"
              stroke-linejoin="round"
              stroke-linecap="round"
              vector-effect="non-scaling-stroke"
            />
            <circle
              v-for="xt in plot.xTicks"
              :key="`dot-${xt.label}-${xt.x}`"
              :cx="xt.x"
              :cy="xt.y"
              r="1.4"
              class="chart__dot"
              vector-effect="non-scaling-stroke"
            />
          </svg>

          <div class="chart__x">
            <span
              v-for="xt in plot.xTicks"
              :key="`x-${xt.label}-${xt.x}`"
              class="chart__x-tick"
              :class="`is-${xt.align}`"
              :style="{ left: `${xt.x}%` }"
            >
              {{ xt.label }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.chart {
  padding: 18px 20px 16px 18px;
  box-sizing: border-box;
  height: auto;
  max-height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: visible;
}

.chart__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 14px;
  flex-shrink: 0;
}

.chart__head h3 {
  margin: 0;
  font-size: 1.55rem;
  font-weight: 800;
  color: #fff;
}

.chart__sub {
  margin: 6px 0 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: rgba(232, 238, 248, 0.5);
}

.chart__body {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.chart__plot {
  display: grid;
  grid-template-columns: 58px 1fr;
  gap: 8px;
  height: 188px;
}

.chart__y {
  position: relative;
  height: calc(100% - 32px);
  margin-top: 0;
}

.chart__y span {
  position: absolute;
  right: 0;
  transform: translateY(-50%);
  font-size: 0.92rem;
  font-weight: 750;
  color: rgba(232, 238, 248, 0.55);
  white-space: nowrap;
}

.chart__canvas {
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100%;
  overflow: visible;
  padding-right: 4px;
}

.chart__svg {
  width: 100%;
  height: 156px;
  flex: 0 0 156px;
  border-radius: 16px;
  background: rgba(0, 0, 0, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow: visible;
}

.chart__x {
  position: relative;
  height: 32px;
  margin-top: 2px;
  overflow: visible;
}

.chart__x-tick {
  position: absolute;
  top: 6px;
  font-size: 1.05rem;
  font-weight: 750;
  color: rgba(232, 238, 248, 0.62);
  white-space: nowrap;
}

.chart__x-tick.is-center {
  transform: translateX(-50%);
}

.chart__x-tick.is-start {
  transform: translateX(0);
}

.chart__x-tick.is-end {
  transform: translateX(-100%);
}

.chart__grid {
  stroke: rgba(255, 255, 255, 0.1);
  stroke-width: 0.35;
  vector-effect: non-scaling-stroke;
}

.chart__grid--v {
  stroke: rgba(125, 211, 252, 0.14);
  stroke-dasharray: 1.2 1.6;
}

.chart__dot {
  fill: #7dd3fc;
  stroke: #0b1220;
  stroke-width: 0.35;
}
</style>
