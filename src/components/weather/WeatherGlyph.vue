<script setup>
import { computed } from 'vue'
import { weatherIconFromEmoji } from '@/utils/weatherCode'

const props = defineProps({
  icon: { type: String, default: '' },
  emoji: { type: String, default: '' },
  label: { type: String, default: '' },
  size: { type: [Number, String], default: 42 },
})

const kind = computed(() => {
  if (props.icon) return props.icon
  return weatherIconFromEmoji(props.emoji)
})

const px = computed(() => `${Number(props.size) || 42}px`)
const uid = `wg-${Math.random().toString(36).slice(2, 9)}`
</script>

<template>
  <span
    class="wg"
    :style="{ width: px, height: px }"
    role="img"
    :aria-label="label || kind"
  >
    <!-- 맑음 -->
    <svg v-if="kind === 'clear'" viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <radialGradient :id="`${uid}-sun`" cx="38%" cy="34%" r="62%">
          <stop offset="0%" stop-color="#fff7ad" />
          <stop offset="45%" stop-color="#fbbf24" />
          <stop offset="100%" stop-color="#f59e0b" />
        </radialGradient>
        <filter :id="`${uid}-soft`" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="3" stdDeviation="2.2" flood-color="#b45309" flood-opacity="0.28" />
        </filter>
      </defs>
      <g :filter="`url(#${uid}-soft)`">
        <g stroke="#fbbf24" stroke-width="4" stroke-linecap="round" opacity="0.95">
          <line x1="32" y1="6" x2="32" y2="12" />
          <line x1="32" y1="52" x2="32" y2="58" />
          <line x1="6" y1="32" x2="12" y2="32" />
          <line x1="52" y1="32" x2="58" y2="32" />
          <line x1="13" y1="13" x2="17.5" y2="17.5" />
          <line x1="46.5" y1="46.5" x2="51" y2="51" />
          <line x1="51" y1="13" x2="46.5" y2="17.5" />
          <line x1="17.5" y1="46.5" x2="13" y2="51" />
        </g>
        <circle cx="32" cy="32" r="14" :fill="`url(#${uid}-sun)`" />
        <ellipse cx="27" cy="27" rx="5" ry="3.2" fill="rgba(255,255,255,0.55)" />
      </g>
    </svg>

    <!-- 대체로 맑음 -->
    <svg v-else-if="kind === 'mostly'" viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <radialGradient :id="`${uid}-ms`" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stop-color="#fff7ad" />
          <stop offset="100%" stop-color="#f59e0b" />
        </radialGradient>
        <linearGradient :id="`${uid}-mc`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="100%" stop-color="#cbd5e1" />
        </linearGradient>
        <filter :id="`${uid}-msoft`" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="2.5" stdDeviation="2" flood-color="#64748b" flood-opacity="0.28" />
        </filter>
      </defs>
      <g :filter="`url(#${uid}-msoft)`">
        <circle cx="40" cy="24" r="11" :fill="`url(#${uid}-ms)`" />
        <ellipse cx="37" cy="20" rx="3.5" ry="2.2" fill="rgba(255,255,255,0.5)" />
        <path
          d="M16 44c0-7.5 6-13.5 13.5-13.5 2.2 0 4.3.5 6.1 1.5C37.2 28 41.5 25.5 46.5 25.5 53.4 25.5 59 31 59 38c0 .7 0 1.3-.2 2H18.2C16.8 39.2 16 41.4 16 44z"
          :fill="`url(#${uid}-mc)`"
        />
        <ellipse cx="28" cy="36" rx="7" ry="3.5" fill="rgba(255,255,255,0.55)" />
      </g>
    </svg>

    <!-- 구름조금 -->
    <svg v-else-if="kind === 'partly'" viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <radialGradient :id="`${uid}-ps`" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stop-color="#fde68a" />
          <stop offset="100%" stop-color="#f59e0b" />
        </radialGradient>
        <linearGradient :id="`${uid}-pc`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#f8fafc" />
          <stop offset="100%" stop-color="#94a3b8" />
        </linearGradient>
        <filter :id="`${uid}-psoft`" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="2.5" stdDeviation="2" flood-color="#475569" flood-opacity="0.3" />
        </filter>
      </defs>
      <g :filter="`url(#${uid}-psoft)`">
        <circle cx="42" cy="22" r="12" :fill="`url(#${uid}-ps)`" />
        <path
          d="M12 46c0-8.5 6.8-15.2 15.2-15.2 2.4 0 4.7.6 6.8 1.6C36.5 28.2 41.4 25 47.2 25 54.8 25 61 31.2 61 38.8c0 .8-.1 1.5-.2 2.2H14.4C13 40.2 12 43 12 46z"
          :fill="`url(#${uid}-pc)`"
        />
        <ellipse cx="26" cy="38" rx="8" ry="4" fill="rgba(255,255,255,0.5)" />
      </g>
    </svg>

    <!-- 흐림 -->
    <svg v-else-if="kind === 'cloudy'" viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient :id="`${uid}-cc`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#e2e8f0" />
          <stop offset="55%" stop-color="#94a3b8" />
          <stop offset="100%" stop-color="#64748b" />
        </linearGradient>
        <filter :id="`${uid}-csoft`" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="3" stdDeviation="2.2" flood-color="#334155" flood-opacity="0.32" />
        </filter>
      </defs>
      <g :filter="`url(#${uid}-csoft)`">
        <ellipse cx="24" cy="34" rx="14" ry="12" :fill="`url(#${uid}-cc)`" />
        <ellipse cx="40" cy="30" rx="16" ry="13" :fill="`url(#${uid}-cc)`" />
        <ellipse cx="32" cy="40" rx="18" ry="11" :fill="`url(#${uid}-cc)`" />
        <ellipse cx="28" cy="28" rx="8" ry="4" fill="rgba(255,255,255,0.4)" />
      </g>
    </svg>

    <!-- 안개 -->
    <svg v-else-if="kind === 'fog'" viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient :id="`${uid}-fg`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#f1f5f9" />
          <stop offset="100%" stop-color="#94a3b8" />
        </linearGradient>
      </defs>
      <g opacity="0.95">
        <ellipse cx="32" cy="22" rx="18" ry="10" :fill="`url(#${uid}-fg)`" opacity="0.85" />
        <rect x="10" y="34" width="36" height="5" rx="2.5" fill="#cbd5e1" />
        <rect x="16" y="42" width="34" height="5" rx="2.5" fill="#94a3b8" opacity="0.85" />
        <rect x="12" y="50" width="30" height="4.5" rx="2.2" fill="#cbd5e1" opacity="0.75" />
      </g>
    </svg>

    <!-- 이슬비 -->
    <svg v-else-if="kind === 'drizzle'" viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient :id="`${uid}-dc`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#f8fafc" />
          <stop offset="100%" stop-color="#94a3b8" />
        </linearGradient>
        <linearGradient :id="`${uid}-dd`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#7dd3fc" />
          <stop offset="100%" stop-color="#0284c7" />
        </linearGradient>
        <filter :id="`${uid}-dsoft`" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="1.8" flood-color="#475569" flood-opacity="0.28" />
        </filter>
      </defs>
      <g :filter="`url(#${uid}-dsoft)`">
        <path
          d="M14 30c0-8 6.4-14.4 14.4-14.4 2.3 0 4.5.5 6.4 1.5C37.2 14 41.8 11 47.2 11 54.5 11 60.4 16.9 60.4 24.2c0 .7 0 1.4-.1 2H16.2C15 27.2 14 28.5 14 30z"
          :fill="`url(#${uid}-dc)`"
        />
        <path d="M22 38c0 0 1 8 1 10" stroke="url(#${uid}-dd)" stroke-width="3.2" stroke-linecap="round" />
        <path d="M32 40c0 0 1 7 1 9" stroke="url(#${uid}-dd)" stroke-width="3.2" stroke-linecap="round" opacity="0.85" />
        <path d="M42 38c0 0 1 8 1 10" stroke="url(#${uid}-dd)" stroke-width="3.2" stroke-linecap="round" />
      </g>
    </svg>

    <!-- 비 / 소나기 -->
    <svg v-else-if="kind === 'rain' || kind === 'showers'" viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient :id="`${uid}-rc`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#e2e8f0" />
          <stop offset="100%" stop-color="#64748b" />
        </linearGradient>
        <linearGradient :id="`${uid}-rd`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#38bdf8" />
          <stop offset="100%" stop-color="#0369a1" />
        </linearGradient>
        <filter :id="`${uid}-rsoft`" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2.5" stdDeviation="2" flood-color="#334155" flood-opacity="0.3" />
        </filter>
      </defs>
      <g :filter="`url(#${uid}-rsoft)`">
        <path
          d="M12 28c0-8.8 7-16 15.8-16 2.6 0 5 .6 7.2 1.8C38 10.4 43.2 7 49.2 7 57.2 7 63.6 13.4 63.6 21.4c0 .8-.1 1.6-.2 2.4H14.5C13 24.6 12 26.2 12 28z"
          :fill="`url(#${uid}-rc)`"
        />
        <path d="M20 36l2 14" :stroke="`url(#${uid}-rd)`" stroke-width="3.6" stroke-linecap="round" />
        <path d="M30 38l2 14" :stroke="`url(#${uid}-rd)`" stroke-width="3.6" stroke-linecap="round" />
        <path d="M40 36l2 14" :stroke="`url(#${uid}-rd)`" stroke-width="3.6" stroke-linecap="round" />
        <path d="M50 38l2 12" :stroke="`url(#${uid}-rd)`" stroke-width="3.4" stroke-linecap="round" opacity="0.8" />
      </g>
    </svg>

    <!-- 눈 -->
    <svg v-else-if="kind === 'snow'" viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <radialGradient :id="`${uid}-sn`" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="100%" stop-color="#bae6fd" />
        </radialGradient>
        <filter :id="`${uid}-snsoft`" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="1.8" flood-color="#0284c7" flood-opacity="0.22" />
        </filter>
      </defs>
      <g :filter="`url(#${uid}-snsoft)`" stroke="#7dd3fc" stroke-width="3.2" stroke-linecap="round">
        <line x1="32" y1="10" x2="32" y2="54" />
        <line x1="12" y1="32" x2="52" y2="32" />
        <line x1="18" y1="18" x2="46" y2="46" />
        <line x1="46" y1="18" x2="18" y2="46" />
        <circle cx="32" cy="32" r="5" :fill="`url(#${uid}-sn)`" stroke="none" />
        <circle cx="32" cy="14" r="3.2" fill="#e0f2fe" stroke="none" />
        <circle cx="32" cy="50" r="3.2" fill="#e0f2fe" stroke="none" />
        <circle cx="14" cy="32" r="3.2" fill="#e0f2fe" stroke="none" />
        <circle cx="50" cy="32" r="3.2" fill="#e0f2fe" stroke="none" />
      </g>
    </svg>

    <!-- 눈소나기 -->
    <svg v-else-if="kind === 'snowShowers'" viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient :id="`${uid}-sc`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#f8fafc" />
          <stop offset="100%" stop-color="#94a3b8" />
        </linearGradient>
        <filter :id="`${uid}-sssoft`" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="1.8" flood-color="#475569" flood-opacity="0.28" />
        </filter>
      </defs>
      <g :filter="`url(#${uid}-sssoft)`">
        <path
          d="M14 28c0-8 6.4-14.4 14.4-14.4 2.3 0 4.5.5 6.4 1.5C37.2 12 41.8 9 47.2 9 54.5 9 60.4 14.9 60.4 22.2c0 .7 0 1.4-.1 2H16.2C15 25.2 14 26.5 14 28z"
          :fill="`url(#${uid}-sc)`"
        />
        <circle cx="22" cy="42" r="3.5" fill="#e0f2fe" stroke="#7dd3fc" stroke-width="1.2" />
        <circle cx="34" cy="48" r="3.2" fill="#e0f2fe" stroke="#7dd3fc" stroke-width="1.2" />
        <circle cx="46" cy="40" r="3.5" fill="#e0f2fe" stroke="#7dd3fc" stroke-width="1.2" />
        <circle cx="40" cy="52" r="2.6" fill="#bae6fd" />
      </g>
    </svg>

    <!-- 뇌우 -->
    <svg v-else-if="kind === 'thunder'" viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient :id="`${uid}-tc`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#cbd5e1" />
          <stop offset="100%" stop-color="#475569" />
        </linearGradient>
        <linearGradient :id="`${uid}-tb`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#fde68a" />
          <stop offset="100%" stop-color="#f59e0b" />
        </linearGradient>
        <filter :id="`${uid}-tsoft`" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="2.5" stdDeviation="2" flood-color="#1e293b" flood-opacity="0.35" />
        </filter>
      </defs>
      <g :filter="`url(#${uid}-tsoft)`">
        <path
          d="M12 26c0-8.5 6.8-15.4 15.2-15.4 2.5 0 4.8.6 6.9 1.7C37.2 9 42.4 6 48.2 6 56 6 62.4 12.4 62.4 20.2c0 .8-.1 1.5-.2 2.2H14.4C13 23.2 12 24.5 12 26z"
          :fill="`url(#${uid}-tc)`"
        />
        <path
          d="M34 28l-10 14h8l-4 14 16-18h-8l6-10z"
          :fill="`url(#${uid}-tb)`"
          stroke="#d97706"
          stroke-width="1"
          stroke-linejoin="round"
        />
      </g>
    </svg>

    <!-- empty / fallback -->
    <svg v-else viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="6" fill="rgba(100,116,139,0.25)" />
    </svg>
  </span>
</template>

<style scoped>
.wg {
  display: inline-grid;
  place-items: center;
  flex: 0 0 auto;
  line-height: 0;
  filter: drop-shadow(0 4px 8px rgba(42, 51, 64, 0.16));
}

.wg svg {
  width: 100%;
  height: 100%;
  overflow: visible;
  display: block;
}
</style>
