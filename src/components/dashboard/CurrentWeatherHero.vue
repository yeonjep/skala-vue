<script setup>
import { computed } from 'vue'
import { convertTemp } from '@/utils/temperature'
import { useConfigStore } from '@/stores/configStore'
import WeatherGlyph from '@/components/weather/WeatherGlyph.vue'

const props = defineProps({
  city: { type: Object, required: true },
  current: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  interactive: { type: Boolean, default: true },
})

const emit = defineEmits(['show-detail'])

function onOpen() {
  if (props.interactive) emit('show-detail')
}

const configStore = useConfigStore()

const dateLabel = computed(() =>
  new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }),
)

const temp = computed(() =>
  props.current ? convertTemp(props.current.temp, configStore.unit) : '—',
)
</script>

<template>
  <section
    class="hero glass-card"
    :class="{ 'is-clickable': interactive }"
    @click="onOpen"
  >
    <div class="hero__top">
      <div>
        <p class="hero__eyebrow">Current Weather</p>
        <h2 class="hero__city">{{ city.name }}</h2>
        <p class="hero__date">{{ dateLabel }}</p>
      </div>
      <WeatherGlyph
        class="hero__glyph"
        :emoji="current?.emoji || '☁'"
        :icon="current?.icon || ''"
        :label="current?.status || ''"
        :size="72"
      />
    </div>

    <div class="hero__temp-block">
      <div class="hero__temp">
        <template v-if="loading">…</template>
        <template v-else>{{ temp }}{{ configStore.unitSymbol }}</template>
      </div>
      <p class="hero__status">{{ loading ? '불러오는 중' : current?.status || '—' }}</p>
    </div>

    <div class="hero__metrics">
      <div class="metric">
        <span>Wind</span>
        <strong>{{ current?.wind ?? '—' }} m/s</strong>
      </div>
      <div class="metric">
        <span>Humidity</span>
        <strong>{{ current?.humidity ?? '—' }}%</strong>
      </div>
      <div class="metric">
        <span>Visibility</span>
        <strong>{{ current?.visibilityKm != null ? `${current.visibilityKm} km` : '—' }}</strong>
      </div>
      <div class="metric">
        <span>Precip</span>
        <strong>{{ current?.precipitation != null ? `${current.precipitation} mm` : '—' }}</strong>
      </div>
    </div>
    <p class="hero__hint">탭해서 자세히 보기</p>
  </section>
</template>

<style scoped>
.hero {
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 100%;
  box-sizing: border-box;
}

.hero__eyebrow {
  margin: 0 0 6px;
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(56, 189, 248, 0.9);
}

.hero__city {
  margin: 0;
  font-size: 2.4rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #fff;
}

.hero__date {
  margin: 6px 0 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: rgba(232, 238, 248, 0.55);
}

.hero__top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-shrink: 0;
}

.hero__glyph {
  flex-shrink: 0;
  margin-top: 4px;
}

.hero__temp-block {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  min-height: 180px;
  padding: 12px 0 8px;
}

.hero__temp {
  margin: 0;
  font-size: clamp(5.5rem, 11vw, 9.5rem);
  font-weight: 900;
  letter-spacing: -0.06em;
  line-height: 0.9;
  color: #fff;
  text-shadow: 0 12px 40px rgba(56, 189, 248, 0.3);
}

.hero__status {
  margin: 10px 0 0;
  font-size: 1.55rem;
  font-weight: 750;
  color: rgba(232, 238, 248, 0.78);
}

.hero__metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-top: auto;
  flex-shrink: 0;
}

.metric {
  padding: 14px 10px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
}

.metric span {
  display: block;
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(232, 238, 248, 0.55);
  margin-bottom: 6px;
}

.metric strong {
  font-size: 1.35rem;
  font-weight: 800;
  color: #fff;
}

.hero__hint {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: rgba(56, 189, 248, 0.8);
  flex-shrink: 0;
}

@media (max-width: 720px) {
  .hero__temp {
    font-size: clamp(4.2rem, 16vw, 6rem);
  }

  .hero__metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
