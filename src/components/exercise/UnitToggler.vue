<script setup>
import { useConfigStore } from '@/stores/configStore'

const configStore = useConfigStore()
</script>

<template>
  <div class="unit-toggler">
    <span class="unit-label">날씨단위: <strong>{{ configStore.unitLabel }}</strong></span>
    <button type="button" class="toggle-btn" @click="configStore.toggleUnit">단위변경</button>
  </div>
</template>

<style scoped>
.unit-toggler {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.unit-label {
  font-size: 1.2rem;
  color: rgba(42, 51, 64, 0.75);
}

.unit-label strong {
  color: #2a3340;
}

.toggle-btn {
  padding: 12px 18px;
  background-color: rgba(255, 255, 255, 0.72);
  color: #2a3340;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  font-weight: 700;
  font-size: 1.15rem;
  transition: all 0.18s ease;
  box-shadow: 0 4px 12px rgba(90, 110, 140, 0.12);
}

.toggle-btn:hover {
  background-color: rgba(255, 255, 255, 0.95);
}
</style>
