<script setup>
import { convertTemp } from '@/utils/temperature'
import { useConfigStore } from '@/stores/configStore'

const props = defineProps({
  days: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  interactive: { type: Boolean, default: true },
})

const emit = defineEmits(['show-detail'])

const configStore = useConfigStore()

function onOpen() {
  if (props.interactive) emit('show-detail')
}
</script>

<template>
  <section
    class="forecast glass-card"
    :class="{ 'is-clickable': interactive }"
    @click="onOpen"
  >
    <header class="forecast__head">
      <h3>Next 7 Days</h3>
      <p>강수확률 · Open-Meteo</p>
    </header>

    <el-skeleton v-if="loading" :rows="6" animated />
    <ul v-else class="forecast__list">
      <li
        v-for="(day, i) in days"
        :key="day.date"
        class="forecast__row"
        :class="{ 'is-today': i === 0 }"
      >
        <span class="forecast__day">{{ i === 0 ? 'Today' : day.weekday }}</span>
        <span class="forecast__wx">
          <span aria-hidden="true">{{ day.emoji }}</span>
          {{ day.label }}
        </span>
        <span class="forecast__precip">{{ day.precipProb }}%</span>
        <span class="forecast__temps">
          {{ convertTemp(day.high, configStore.unit) }}°
          <em>/ {{ convertTemp(day.low, configStore.unit) }}°</em>
        </span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.forecast {
  padding: 16px 14px;
  box-sizing: border-box;
  height: 100%;
}

.forecast__head {
  margin-bottom: 10px;
  padding: 0 6px;
}

.forecast__head h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 800;
  color: #fff;
}

.forecast__head p {
  margin: 4px 0 0;
  font-size: 0.88rem;
  font-weight: 600;
  color: rgba(232, 238, 248, 0.55);
}

.forecast__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.forecast__row {
  display: grid;
  grid-template-columns: 72px 1fr 56px 88px;
  gap: 8px;
  align-items: center;
  padding: 9px 10px;
  border-radius: 12px;
  font-size: 1.05rem;
  font-weight: 700;
  color: rgba(232, 238, 248, 0.88);
}

.forecast__row.is-today {
  background: linear-gradient(90deg, rgba(56, 189, 248, 0.28), rgba(129, 140, 248, 0.18));
  border: 1px solid rgba(56, 189, 248, 0.3);
}

.forecast__wx {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-weight: 600;
}

.forecast__precip {
  text-align: right;
  color: #7dd3fc;
  font-weight: 800;
}

.forecast__temps {
  text-align: right;
  font-weight: 800;
  color: #fff;
}

.forecast__temps em {
  font-style: normal;
  color: rgba(232, 238, 248, 0.45);
  font-weight: 700;
}
</style>
