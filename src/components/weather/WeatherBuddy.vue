<script setup>
import { computed } from 'vue'
import { discomfortIndex, diLabel, resolveWeatherMood } from '@/utils/weatherMood'

const props = defineProps({
  tempC: { type: Number, default: 20 },
  humidity: { type: Number, default: 50 },
  status: { type: String, default: '' },
  weatherCode: { type: [Number, String], default: null },
  cityName: { type: String, default: '' },
})

const mood = computed(() =>
  resolveWeatherMood({
    tempC: props.tempC,
    humidityPct: props.humidity,
    status: props.status,
    weatherCode: props.weatherCode,
  }),
)

const di = computed(() => discomfortIndex(props.tempC, props.humidity))
</script>

<template>
  <section class="buddy" :class="[`is-${mood.id}`, `motion-${mood.motion}`]" aria-live="polite">
    <header class="buddy__meta">
      <div>
        <p class="buddy__name">누비 Nubi</p>
        <h3>{{ mood.title }}</h3>
        <p class="buddy__caption">{{ mood.caption }}</p>
      </div>
      <div class="buddy__stats">
        <span>불쾌지수 {{ di ?? '—' }} · {{ diLabel(di) }}</span>
        <span>습도 {{ humidity }}%</span>
      </div>
    </header>

    <div class="buddy__stage" role="img" :aria-label="`날씨 캐릭터 누비 · ${mood.title}`">
      <!-- 배경 소품/이펙트 -->
      <div class="fx fx-rain" aria-hidden="true">
        <i v-for="n in 12" :key="`r${n}`" />
      </div>
      <div class="fx fx-snow" aria-hidden="true">
        <i v-for="n in 10" :key="`s${n}`" />
      </div>
      <div class="fx fx-heat" aria-hidden="true" />
      <div class="prop prop-steam" aria-hidden="true">♨</div>

      <svg class="buddy__svg" viewBox="0 -10 300 280" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="nubiBody" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#dbeafe" />
            <stop offset="55%" stop-color="#93c5fd" />
            <stop offset="100%" stop-color="#60a5fa" />
          </linearGradient>
          <linearGradient id="nubiCheek" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#fda4af" />
            <stop offset="100%" stop-color="#fb7185" />
          </linearGradient>
          <linearGradient id="umbrellaCanopy" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#7dd3fc" />
            <stop offset="100%" stop-color="#2563eb" />
          </linearGradient>
        </defs>

        <!-- 그림자 -->
        <ellipse class="nubi-shadow" cx="140" cy="248" rx="64" ry="10" fill="rgba(15,23,42,0.22)" />

        <g class="nubi-root">
          <!-- 몸통 -->
          <g class="nubi-body">
            <path
              d="M70 166c0-48 32-86 70-86s70 38 70 86c8 4 14 14 14 26 0 20-16 36-36 36H92c-20 0-36-16-36-36 0-12 6-22 14-26z"
              fill="url(#nubiBody)"
            />
            <circle cx="96" cy="134" r="28" fill="url(#nubiBody)" />
            <circle cx="184" cy="134" r="28" fill="url(#nubiBody)" />
            <circle cx="140" cy="118" r="34" fill="url(#nubiBody)" />
            <ellipse cx="118" cy="128" rx="14" ry="10" fill="rgba(255,255,255,0.45)" />
          </g>

          <!-- 얼굴 -->
          <g class="nubi-face">
            <ellipse class="cheek L" cx="108" cy="174" rx="10" ry="7" fill="url(#nubiCheek)" opacity="0.55" />
            <ellipse class="cheek R" cx="172" cy="174" rx="10" ry="7" fill="url(#nubiCheek)" opacity="0.55" />
            <g class="eyes">
              <ellipse class="eye L" cx="118" cy="164" rx="7" ry="9" fill="#0f172a" />
              <ellipse class="eye R" cx="162" cy="164" rx="7" ry="9" fill="#0f172a" />
              <circle class="shine L" cx="115" cy="161" r="2.2" fill="#fff" />
              <circle class="shine R" cx="159" cy="161" r="2.2" fill="#fff" />
            </g>
            <path
              class="mouth mouth-smile"
              d="M128 186c6 8 18 8 24 0"
              fill="none"
              stroke="#0f172a"
              stroke-width="3.5"
              stroke-linecap="round"
            />
            <path
              class="mouth mouth-sad"
              d="M132 192c8-6 16-6 24 0"
              fill="none"
              stroke="#0f172a"
              stroke-width="3.5"
              stroke-linecap="round"
            />
            <path
              class="mouth mouth-flat"
              d="M132 188h24"
              fill="none"
              stroke="#0f172a"
              stroke-width="3.5"
              stroke-linecap="round"
            />
            <g class="sweat">
              <ellipse cx="192" cy="148" rx="5" ry="8" fill="#7dd3fc" opacity="0.9" />
              <ellipse cx="202" cy="160" rx="3.5" ry="6" fill="#7dd3fc" opacity="0.75" />
            </g>
          </g>

          <!-- 우산: 머리 위·옆으로 들어 올린 형태 (얼굴 가리지 않음) -->
          <g class="gear umbrella">
            <!-- 손잡이 + 대 -->
            <path
              d="M198 188c8 4 14 14 12 24"
              fill="none"
              stroke="#78350f"
              stroke-width="5"
              stroke-linecap="round"
            />
            <line x1="198" y1="188" x2="168" y2="42" stroke="#57534e" stroke-width="4.5" stroke-linecap="round" />
            <!-- 우산 살 -->
            <path d="M92 78 Q168 8 244 78" fill="url(#umbrellaCanopy)" stroke="#1d4ed8" stroke-width="2" />
            <path d="M100 78 Q168 28 236 78" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="2" />
            <line x1="168" y1="42" x2="112" y2="78" stroke="rgba(15,23,42,0.35)" stroke-width="2" />
            <line x1="168" y1="42" x2="140" y2="78" stroke="rgba(15,23,42,0.35)" stroke-width="2" />
            <line x1="168" y1="42" x2="196" y2="78" stroke="rgba(15,23,42,0.35)" stroke-width="2" />
            <line x1="168" y1="42" x2="224" y2="78" stroke="rgba(15,23,42,0.35)" stroke-width="2" />
            <!-- 손 -->
            <circle cx="198" cy="188" r="9" fill="#93c5fd" stroke="#60a5fa" stroke-width="2" />
          </g>

          <!-- 귀마개 -->
          <g class="gear earmuffs">
            <path
              d="M96 134c0-28 20-46 44-46s44 18 44 46"
              fill="none"
              stroke="#fb7185"
              stroke-width="10"
              stroke-linecap="round"
            />
            <circle cx="96" cy="144" r="16" fill="#fb7185" />
            <circle cx="184" cy="144" r="16" fill="#fb7185" />
          </g>

          <!-- 선글라스 -->
          <g class="gear shades">
            <rect x="104" y="156" width="28" height="16" rx="6" fill="#0f172a" />
            <rect x="148" y="156" width="28" height="16" rx="6" fill="#0f172a" />
            <path d="M132 164h16" stroke="#0f172a" stroke-width="3" />
          </g>

          <!-- 목도리 -->
          <g class="gear scarf">
            <path
              d="M100 194c20 16 60 16 80 0"
              fill="none"
              stroke="#f97316"
              stroke-width="14"
              stroke-linecap="round"
            />
            <path d="M168 202v36" stroke="#f97316" stroke-width="10" stroke-linecap="round" />
          </g>
        </g>
      </svg>

      <p v-if="cityName" class="buddy__city">{{ cityName }}의 지금</p>
    </div>
  </section>
</template>

<style scoped>
.buddy {
  --buddy-accent: #38bdf8;
  border-radius: 28px;
  padding: 20px 18px 8px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.1), rgba(15, 23, 42, 0.35));
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.28);
  overflow: hidden;
}

.buddy__meta {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.buddy__name {
  margin: 0 0 4px;
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: rgba(125, 211, 252, 0.85);
  text-transform: uppercase;
}

.buddy__meta h3 {
  margin: 0;
  font-size: 2rem;
  font-weight: 800;
  color: #fff;
}

.buddy__caption {
  margin: 8px 0 0;
  font-size: 1.35rem;
  font-weight: 600;
  color: rgba(232, 238, 248, 0.72);
}

.buddy__stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
  font-size: 1.2rem;
  font-weight: 750;
  color: rgba(232, 238, 248, 0.6);
}

.buddy__stage {
  position: relative;
  min-height: 280px;
  display: grid;
  place-items: center;
}

.buddy__svg {
  width: min(100%, 340px);
  height: auto;
  overflow: visible;
}

.buddy__city {
  margin: 0 0 12px;
  text-align: center;
  font-size: 1.4rem;
  font-weight: 750;
  color: rgba(232, 238, 248, 0.65);
}

/* 기본: 소품 숨김 */
.gear,
.sweat,
.fx,
.prop {
  display: none;
}

.fx {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.prop {
  position: absolute;
  font-size: 2rem;
  opacity: 0.9;
}

.prop-steam {
  left: 12%;
  bottom: 28%;
}

/* 상태별 소품 */
.is-rain .umbrella,
.is-storm .umbrella {
  display: inline;
}
.is-freeze .earmuffs,
.is-chilly .scarf,
.is-chilly .earmuffs {
  display: inline;
}
.is-sunny .shades {
  display: inline;
}
.is-hot .sweat,
.is-melt .sweat {
  display: inline;
}
.is-chilly .prop-steam,
.is-freeze .prop-steam {
  display: block;
}

.is-rain .fx-rain,
.is-storm .fx-rain {
  display: block;
}
.is-freeze .fx-snow {
  display: block;
}
.is-hot .fx-heat,
.is-melt .fx-heat {
  display: block;
}

.fx-rain i {
  position: absolute;
  top: -10%;
  width: 2px;
  height: 18px;
  background: linear-gradient(transparent, rgba(125, 211, 252, 0.85));
  animation: rainFall 0.9s linear infinite;
}
.fx-rain i:nth-child(odd) {
  animation-duration: 1.15s;
}
.fx-rain i:nth-child(1) {
  left: 8%;
}
.fx-rain i:nth-child(2) {
  left: 16%;
  animation-delay: 0.2s;
}
.fx-rain i:nth-child(3) {
  left: 24%;
}
.fx-rain i:nth-child(4) {
  left: 34%;
  animation-delay: 0.4s;
}
.fx-rain i:nth-child(5) {
  left: 44%;
}
.fx-rain i:nth-child(6) {
  left: 52%;
  animation-delay: 0.1s;
}
.fx-rain i:nth-child(7) {
  left: 62%;
}
.fx-rain i:nth-child(8) {
  left: 70%;
  animation-delay: 0.35s;
}
.fx-rain i:nth-child(9) {
  left: 78%;
}
.fx-rain i:nth-child(10) {
  left: 86%;
  animation-delay: 0.15s;
}
.fx-rain i:nth-child(11) {
  left: 92%;
}
.fx-rain i:nth-child(12) {
  left: 40%;
  animation-delay: 0.5s;
}

.fx-snow i {
  position: absolute;
  top: -8%;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.85);
  animation: snowFall 3.2s linear infinite;
}
.fx-snow i:nth-child(1) {
  left: 10%;
}
.fx-snow i:nth-child(2) {
  left: 22%;
  animation-delay: 0.4s;
}
.fx-snow i:nth-child(3) {
  left: 34%;
}
.fx-snow i:nth-child(4) {
  left: 48%;
  animation-delay: 0.8s;
}
.fx-snow i:nth-child(5) {
  left: 58%;
}
.fx-snow i:nth-child(6) {
  left: 68%;
  animation-delay: 0.2s;
}
.fx-snow i:nth-child(7) {
  left: 78%;
}
.fx-snow i:nth-child(8) {
  left: 88%;
  animation-delay: 1s;
}
.fx-snow i:nth-child(9) {
  left: 40%;
  animation-delay: 1.4s;
}
.fx-snow i:nth-child(10) {
  left: 15%;
  animation-delay: 1.8s;
}

.fx-heat {
  background: radial-gradient(ellipse at 50% 80%, rgba(251, 146, 60, 0.28), transparent 60%);
}

/* 표정 변형 */
.mouth-sad,
.mouth-flat {
  display: none;
}
.mouth-smile {
  display: inline;
}

.is-melt .mouth-smile,
.is-hot .mouth-smile,
.is-muggy .mouth-smile,
.is-storm .mouth-smile,
.is-rain .mouth-smile {
  display: none;
}
.is-melt .mouth-sad,
.is-hot .mouth-sad,
.is-storm .mouth-sad {
  display: inline;
}
.is-muggy .mouth-flat,
.is-rain .mouth-flat {
  display: inline;
}

.is-freeze .eyes,
.is-chilly .eyes {
  transform: scaleY(0.45);
  transform-origin: 140px 164px;
}

/* 모션 */
.motion-idle .nubi-root {
  animation: floatY 3.2s ease-in-out infinite;
}
.motion-bounce .nubi-root {
  animation: bounceSoft 1.4s ease-in-out infinite;
}
.motion-shiver .nubi-root {
  animation: shiver 0.28s linear infinite;
}
.motion-bundle .nubi-root {
  animation: floatY 2.8s ease-in-out infinite;
}
.motion-sweat .nubi-root {
  animation: floatY 2.2s ease-in-out infinite;
}
.motion-melt .nubi-body {
  transform-origin: 140px 236px;
  animation: meltDown 2.4s ease-in-out infinite alternate;
}
.motion-melt .nubi-shadow {
  animation: shadowWide 2.4s ease-in-out infinite alternate;
}
.motion-lean-rain .nubi-root,
.motion-sway-hard .nubi-root {
  transform-origin: 140px 236px;
  animation: leanWind 1.1s ease-in-out infinite alternate;
}
.motion-sway-hard .nubi-root {
  animation-duration: 0.55s;
}
.motion-sticky .nubi-root {
  animation: stickyPulse 2s ease-in-out infinite;
}
.motion-sticky .cheek {
  opacity: 0.85;
}

@keyframes floatY {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}
@keyframes bounceSoft {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-14px) scale(1.03, 0.97);
  }
}
@keyframes shiver {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-3px);
  }
  75% {
    transform: translateX(3px);
  }
}
@keyframes leanWind {
  from {
    transform: rotate(-6deg) translateX(-4px);
  }
  to {
    transform: rotate(7deg) translateX(6px);
  }
}
@keyframes meltDown {
  from {
    transform: scale(1, 1);
  }
  to {
    transform: scale(1.08, 0.86) translateY(10px);
  }
}
@keyframes shadowWide {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(1.25);
  }
}
@keyframes stickyPulse {
  0%,
  100% {
    transform: scale(1);
    filter: saturate(1);
  }
  50% {
    transform: scale(1.02);
    filter: saturate(1.15);
  }
}
@keyframes rainFall {
  to {
    transform: translateY(320px);
  }
}
@keyframes snowFall {
  to {
    transform: translateY(300px) rotate(180deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .nubi-root,
  .nubi-body,
  .nubi-shadow,
  .fx-rain i,
  .fx-snow i {
    animation: none !important;
  }
}
</style>
