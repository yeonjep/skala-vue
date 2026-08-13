<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  FOOTBALL_LEAGUES,
  fetchLeagueNews,
  fetchLeagueScoreboard,
  fetchLeagueStandings,
} from '@/api/espnFootball'

const leagueId = ref('eng.1')
const loading = ref(false)
const errorMsg = ref('')
const standings = ref([])
const seasonMeta = ref({ seasonName: '', note: '', isFallback: false })
const scores = ref([])
const news = ref([])

const pageIndex = ref(0)
const perPage = 4
const hovering = ref(false)
let timer = null

const pageCount = computed(() => Math.max(1, Math.ceil(news.value.length / perPage)))
const newsPages = computed(() => {
  const pages = []
  for (let i = 0; i < news.value.length; i += perPage) {
    pages.push(news.value.slice(i, i + perPage))
  }
  return pages.length ? pages : [[]]
})

function nextPage() {
  if (pageCount.value <= 1) return
  pageIndex.value = (pageIndex.value + 1) % pageCount.value
}

function goPage(i) {
  pageIndex.value = i
}

function startAuto() {
  stopAuto()
  timer = window.setInterval(() => {
    if (!hovering.value && !loading.value) nextPage()
  }, 4200)
}

function stopAuto() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

async function load() {
  loading.value = true
  errorMsg.value = ''
  pageIndex.value = 0
  stopAuto()
  try {
    const [table, board, articles] = await Promise.all([
      fetchLeagueStandings(leagueId.value),
      fetchLeagueScoreboard(leagueId.value),
      fetchLeagueNews(leagueId.value, 12),
    ])
    standings.value = table.rows
    seasonMeta.value = {
      seasonName: table.seasonName,
      note: table.note,
      isFallback: table.isFallback,
    }
    scores.value = board.matches
    news.value = articles
  } catch (err) {
    console.error('[Sports]', err)
    errorMsg.value = '축구 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
  } finally {
    loading.value = false
    startAuto()
  }
}

watch(leagueId, load)
onMounted(load)
onUnmounted(stopAuto)

function formatDate(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}
</script>

<template>
  <div class="sports">
    <header class="sports__head">
      <div>
        <p class="sports__eyebrow">SPORTS · ESPN (무료 공개 API)</p>
        <h2>운동 뉴스 · 축구</h2>
        <p class="sports__lead">리그 순위 · 경기 스코어 · 최신 기사</p>
        <p v-if="seasonMeta.seasonName" class="sports__season">
          {{ seasonMeta.seasonName }}
          <span v-if="seasonMeta.isFallback" class="sports__season-tag">직전 시즌</span>
        </p>
      </div>
      <div class="sports__leagues" role="tablist" aria-label="리그 선택">
        <button
          v-for="lg in FOOTBALL_LEAGUES"
          :key="lg.id"
          type="button"
          class="sports__chip"
          :class="{ 'is-active': leagueId === lg.id }"
          @click="leagueId = lg.id"
        >
          {{ lg.short }}
        </button>
      </div>
    </header>

    <p v-if="errorMsg" class="sports__error">{{ errorMsg }}</p>
    <p v-else-if="loading" class="sports__loading">리그 데이터 불러오는 중…</p>

    <div v-else class="sports__grid">
      <section class="sports-card">
        <header class="sports-card__head">
          <h3>순위 · 득점 상황</h3>
          <span>{{ standings.length }} teams</span>
        </header>
        <p v-if="seasonMeta.note" class="sports-note">{{ seasonMeta.note }}</p>
        <div class="sports-table-wrap">
          <table class="sports-table">
            <thead>
              <tr>
                <th>#</th>
                <th>팀</th>
                <th>경기</th>
                <th>승</th>
                <th>무</th>
                <th>패</th>
                <th>득실</th>
                <th>승점</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in standings" :key="`${row.rank}-${row.team}`">
                <td>{{ row.rank }}</td>
                <td class="sports-table__team">
                  <img v-if="row.logo" :src="row.logo" :alt="row.short" width="32" height="32" />
                  <span>{{ row.short || row.team }}</span>
                </td>
                <td>{{ row.played }}</td>
                <td>{{ row.won }}</td>
                <td>{{ row.draw }}</td>
                <td>{{ row.lost }}</td>
                <td>{{ row.gd > 0 ? `+${row.gd}` : row.gd }}</td>
                <td class="is-pts">{{ row.pts }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="sports-card">
        <header class="sports-card__head">
          <h3>경기 · 스코어</h3>
          <span>{{ scores.length || 0 }}</span>
        </header>
        <ul v-if="scores.length" class="score-list">
          <li v-for="m in scores" :key="m.id" class="score-item">
            <p class="score-item__meta">{{ m.shortStatus || m.status }} · {{ formatDate(m.date) }}</p>
            <div class="score-item__row">
              <span>{{ m.home?.short || m.home?.name }}</span>
              <strong>{{ m.home?.score }} : {{ m.away?.score }}</strong>
              <span>{{ m.away?.short || m.away?.name }}</span>
            </div>
          </li>
        </ul>
        <p v-else class="sports-empty">오늘 표시할 경기가 없습니다.</p>
      </section>

      <section class="sports-card sports-card--news">
        <header class="sports-card__head">
          <h3>리그 소식 · 기사</h3>
          <span>ESPN News</span>
        </header>

        <div
          class="news-carousel"
          @mouseenter="hovering = true"
          @mouseleave="hovering = false"
        >
          <div class="news-track" :style="{ transform: `translateX(-${pageIndex * 100}%)` }">
            <div v-for="(page, pi) in newsPages" :key="`np-${pi}`" class="news-page">
              <a
                v-for="a in page"
                :key="a.id"
                class="news-card"
                :href="a.link || '#'"
                target="_blank"
                rel="noreferrer"
              >
                <div
                  class="news-card__img"
                  :style="a.image ? { backgroundImage: `url(${a.image})` } : undefined"
                />
                <div class="news-card__body">
                  <strong>{{ a.headline }}</strong>
                  <p v-if="a.description">{{ a.description }}</p>
                  <small>{{ a.byline }} · {{ formatDate(a.published) }}</small>
                </div>
              </a>
            </div>
          </div>

          <div class="news-controls">
            <button
              type="button"
              class="news-nav"
              aria-label="이전"
              @click="goPage((pageIndex - 1 + pageCount) % pageCount)"
            >
              ‹
            </button>
            <div class="news-dots">
              <button
                v-for="(_, i) in newsPages"
                :key="`nd-${i}`"
                type="button"
                class="news-dot"
                :class="{ 'is-active': pageIndex === i }"
                :aria-label="`${i + 1}번째 페이지`"
                @click="goPage(i)"
              />
            </div>
            <button type="button" class="news-nav" aria-label="다음" @click="nextPage">›</button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.sports {
  display: flex;
  flex-direction: column;
  gap: 22px;
  width: 100%;
  min-height: 0;
}

.sports__head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  align-items: flex-end;
}

.sports__eyebrow {
  margin: 0 0 10px;
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: rgba(125, 211, 252, 0.85);
}

.sports__head h2 {
  margin: 0;
  font-size: clamp(2.6rem, 4.5vw, 3.4rem);
  font-weight: 800;
  color: #e8eef8;
}

.sports__lead {
  margin: 10px 0 0;
  font-size: 1.45rem;
  color: rgba(232, 238, 248, 0.62);
  font-weight: 600;
}

.sports__season {
  margin: 12px 0 0;
  font-size: 1.25rem;
  font-weight: 750;
  color: rgba(125, 211, 252, 0.9);
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.sports__season-tag {
  font-size: 1rem;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(251, 191, 36, 0.18);
  color: #fbbf24;
  font-weight: 800;
}

.sports-note {
  margin: 0 0 14px;
  padding: 14px 16px;
  border-radius: 14px;
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.25);
  color: #fde68a;
  font-size: 1.2rem;
  font-weight: 700;
  line-height: 1.4;
}

.sports__leagues {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.sports__chip {
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(232, 238, 248, 0.78);
  border-radius: 999px;
  padding: 14px 22px;
  min-height: 52px;
  font-weight: 750;
  font-size: 1.25rem;
  cursor: pointer;
}

.sports__chip.is-active {
  background: rgba(56, 189, 248, 0.22);
  border-color: rgba(56, 189, 248, 0.55);
  color: #fff;
}

.sports__error,
.sports__loading {
  margin: 0;
  padding: 18px 20px;
  border-radius: 18px;
  font-weight: 700;
  font-size: 1.35rem;
}

.sports__error {
  background: rgba(180, 35, 24, 0.18);
  color: #fecaca;
}

.sports__loading {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(232, 238, 248, 0.7);
}

.sports__grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 18px;
}

.sports-card {
  border-radius: 26px;
  background: rgba(18, 24, 38, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.14);
  padding: 26px;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.28);
  min-width: 0;
}

.sports-card--news {
  grid-column: 1 / -1;
}

.sports-card__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}

.sports-card__head h3 {
  margin: 0;
  font-size: 1.85rem;
  font-weight: 800;
  color: #fff;
}

.sports-card__head span {
  font-size: 1.2rem;
  font-weight: 700;
  color: rgba(232, 238, 248, 0.5);
}

.sports-table-wrap {
  overflow: auto;
  max-height: 560px;
}

.sports-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 1.3rem;
}

.sports-table th,
.sports-table td {
  padding: 14px 10px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(232, 238, 248, 0.88);
}

.sports-table th {
  position: sticky;
  top: 0;
  background: rgba(11, 18, 32, 0.95);
  font-size: 1.1rem;
  color: rgba(232, 238, 248, 0.55);
  z-index: 1;
}

.sports-table__team {
  text-align: left !important;
  font-weight: 750;
  white-space: nowrap;
}

.sports-table__team img {
  vertical-align: middle;
  margin-right: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
}

.sports-table .is-pts {
  font-weight: 800;
  font-size: 1.4rem;
  color: #7dd3fc;
}

.score-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-height: 560px;
  overflow: auto;
}

.score-item {
  padding: 18px 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.score-item__meta {
  margin: 0 0 12px;
  font-size: 1.15rem;
  font-weight: 700;
  color: rgba(232, 238, 248, 0.5);
}

.score-item__row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 12px;
  align-items: center;
  font-size: 1.35rem;
  font-weight: 750;
  color: #e8eef8;
}

.score-item__row strong {
  font-size: 1.7rem;
  color: #7dd3fc;
}

.score-item__row span:last-child {
  text-align: right;
}

.sports-empty {
  margin: 0;
  color: rgba(232, 238, 248, 0.5);
  font-size: 1.25rem;
  font-weight: 650;
}

.news-carousel {
  overflow: hidden;
  border-radius: 18px;
}

.news-track {
  display: flex;
  transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;
}

.news-page {
  flex: 0 0 100%;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
  min-width: 0;
  padding: 2px;
  box-sizing: border-box;
}

.news-card {
  display: flex;
  flex-direction: column;
  border-radius: 22px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  text-decoration: none;
  color: inherit;
  min-height: 420px;
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.22);
  transition:
    transform 0.15s ease,
    border-color 0.15s ease;
}

.news-card:hover {
  transform: translateY(-3px);
  border-color: rgba(56, 189, 248, 0.45);
}

.news-card__img {
  height: 180px;
  background-size: cover;
  background-position: center;
  background-color: rgba(0, 0, 0, 0.35);
  background-image: linear-gradient(145deg, rgba(56, 189, 248, 0.25), rgba(129, 140, 248, 0.2));
}

.news-card__body {
  padding: 20px 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}

.news-card__body strong {
  font-size: 1.45rem;
  line-height: 1.3;
  color: #fff;
}

.news-card__body p {
  margin: 0;
  font-size: 1.2rem;
  line-height: 1.5;
  color: rgba(232, 238, 248, 0.68);
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.news-card__body small {
  font-size: 1.1rem;
  font-weight: 700;
  color: rgba(125, 211, 252, 0.8);
}

.news-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 18px;
}

.news-nav {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.08);
  color: #e8eef8;
  font-size: 1.8rem;
  font-weight: 700;
  cursor: pointer;
  line-height: 1;
}

.news-nav:hover {
  background: rgba(255, 255, 255, 0.14);
}

.news-dots {
  display: flex;
  gap: 8px;
}

.news-dot {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  border: none;
  background: rgba(255, 255, 255, 0.25);
  cursor: pointer;
  padding: 0;
}

.news-dot.is-active {
  width: 28px;
  background: #38bdf8;
}

@media (max-width: 1100px) {
  .news-page {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {
  .sports__grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .news-page {
    grid-template-columns: 1fr;
  }
}
</style>
