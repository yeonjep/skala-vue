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
  font-size: 0.88rem;
  color: rgba(232, 238, 248, 0.7);
}

.unit-label strong {
  color: #fff;
}

.toggle-btn {
  appearance: none;
  -webkit-appearance: none;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.08) !important;
  color: #fff !important;
  border: 1px solid rgba(255, 255, 255, 0.18) !important;
  border-radius: 999px;
  cursor: pointer;
  font-weight: 750;
  font-size: 0.88rem;
  backdrop-filter: blur(12px);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
  transition: all 0.18s ease;
}

.toggle-btn:hover {
  background: rgba(255, 255, 255, 0.14) !important;
  border-color: rgba(125, 211, 252, 0.45) !important;
}
</style>
