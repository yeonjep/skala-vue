import axios from 'axios'

/**
 * ESPN soccer API
 * - 로컬(dev): Vite 프록시 `/api/espn` 로 라이브 호출, 실패 시 public 스냅샷 폴백
 * - 배포(prod): 빌드 시 생성한 `data/espn/{league}.json` 스냅샷
 */
const isDev = import.meta.env.DEV

const site = axios.create({
  baseURL: '/api/espn/apis',
  timeout: 20000,
})

export const FOOTBALL_LEAGUES = [
  { id: 'eng.1', name: '프리미어리그', short: 'EPL' },
  { id: 'esp.1', name: '라리가', short: 'LaLiga' },
  { id: 'ita.1', name: '세리에 A', short: 'Serie A' },
  { id: 'ger.1', name: '분데스리가', short: 'Bundesliga' },
  { id: 'uefa.champions', name: '챔피언스리그', short: 'UCL' },
]

const bundleCache = new Map()

function snapshotUrl(leagueId) {
  return `${import.meta.env.BASE_URL}data/espn/${leagueId}.json`
}

async function loadSnapshotBundle(leagueId) {
  const { data } = await axios.get(snapshotUrl(leagueId), { timeout: 15000 })
  return {
    standings: data.standings,
    scoreboard: data.scoreboard,
    news: data.news,
    source: 'snapshot',
    fetchedAt: data.fetchedAt,
  }
}

async function loadLiveBundle(leagueId) {
  const [standings, scoreboard, news] = await Promise.all([
    fetchStandingsLive(leagueId),
    fetchScoreboardLive(leagueId),
    fetchNewsLive(leagueId),
  ])
  return { standings, scoreboard, news, source: 'live' }
}

async function loadBundle(leagueId) {
  if (bundleCache.has(leagueId)) return bundleCache.get(leagueId)

  const promise = (async () => {
    if (!isDev) return loadSnapshotBundle(leagueId)

    try {
      return await loadLiveBundle(leagueId)
    } catch (err) {
      console.warn('[ESPN] live failed → snapshot', err?.message || err)
      return loadSnapshotBundle(leagueId)
    }
  })()

  bundleCache.set(leagueId, promise)
  return promise
}

function statMap(stats = []) {
  const map = {}
  stats.forEach((s) => {
    map[s.name] = s.value ?? s.displayValue
  })
  return map
}

function parseStandings(data) {
  const child = data.children?.[0]
  const seasonName = child?.name || data.name || ''
  const seasonAbbr = child?.abbreviation || ''
  const entries = (child?.standings?.entries || []).map((row, i) => {
    const s = statMap(row.stats)
    return {
      rank: Number(s.rank ?? row.note?.rank ?? i + 1),
      team: row.team?.displayName || row.team?.name || '—',
      short: row.team?.shortDisplayName || row.team?.abbreviation || '',
      logo: row.team?.logos?.[0]?.href || '',
      played: Number(s.gamesPlayed ?? 0),
      won: Number(s.wins ?? 0),
      draw: Number(s.ties ?? 0),
      lost: Number(s.losses ?? 0),
      gf: Number(s.pointsFor ?? s.goalsFor ?? 0),
      ga: Number(s.pointsAgainst ?? s.goalsAgainst ?? 0),
      gd: Number(s.pointDifferential ?? s.goalDifference ?? 0),
      pts: Number(s.points ?? 0),
      note: row.note?.description || '',
    }
  })
  const totalPlayed = entries.reduce((sum, r) => sum + (r.played || 0), 0)
  return { seasonName, seasonAbbr, entries, totalPlayed }
}

function previousSeasonYear(seasonAbbr = '') {
  const m = String(seasonAbbr).match(/^(\d{4})/)
  if (m) return Number(m[1]) - 1
  return new Date().getFullYear() - 1
}

function parseEvents(events = []) {
  return events.map((ev) => {
    const comp = ev.competitions?.[0]
    const rivals = (comp?.competitors || []).map((c) => ({
      name: c.team?.displayName || c.team?.name || '—',
      short: c.team?.shortDisplayName || c.team?.abbreviation || '',
      logo: c.team?.logos?.[0]?.href || '',
      score: c.score ?? '—',
      homeAway: c.homeAway,
      winner: Boolean(c.winner),
    }))
    const home = rivals.find((r) => r.homeAway === 'home') || rivals[0]
    const away = rivals.find((r) => r.homeAway === 'away') || rivals[1]
    const completed = Boolean(ev.status?.type?.completed)
    return {
      id: ev.id,
      name: ev.name,
      status: ev.status?.type?.description || ev.status?.type?.name || '',
      shortStatus: ev.status?.type?.shortDetail || '',
      date: ev.date,
      completed,
      home,
      away,
    }
  })
}

function ymd(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}${m}${d}`
}

async function fetchStandingsLive(leagueId = 'eng.1') {
  const { data } = await site.get(`/v2/sports/soccer/${leagueId}/standings`)
  let parsed = parseStandings(data)
  let isFallback = false

  if (!parsed.entries.length || parsed.totalPlayed === 0) {
    const season = previousSeasonYear(parsed.seasonAbbr)
    const { data: prev } = await site.get(`/v2/sports/soccer/${leagueId}/standings`, {
      params: { season },
    })
    const fallback = parseStandings(prev)
    if (fallback.totalPlayed > 0) {
      parsed = fallback
      isFallback = true
    }
  }

  return {
    seasonName: parsed.seasonName,
    seasonAbbr: parsed.seasonAbbr,
    isFallback,
    note: isFallback
      ? '새 시즌 경기가 아직 없어 직전 시즌 최종 순위를 보여줍니다.'
      : '현재 시즌 순위입니다.',
    rows: parsed.entries,
  }
}

async function fetchScoreboardLive(leagueId = 'eng.1') {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - 21)
  const dates = `${ymd(start)}-${ymd(end)}`
  const year = end.getFullYear()
  const enrichDates = [`${year - 1}0501-${year - 1}0525`, `${year}0501-${year}0525`]

  const results = await Promise.all([
    site.get(`/site/v2/sports/soccer/${leagueId}/scoreboard`, { params: { dates } }),
    site.get(`/site/v2/sports/soccer/${leagueId}/scoreboard`),
    ...enrichDates.map((d) =>
      site
        .get(`/site/v2/sports/soccer/${leagueId}/scoreboard`, { params: { dates: d } })
        .catch(() => ({ data: { events: [] } })),
    ),
  ])

  const seen = new Set()
  const finished = []
  const schedule = []

  results
    .flatMap((r) => parseEvents(r.data.events || []))
    .forEach((ev) => {
      if (seen.has(ev.id)) return
      seen.add(ev.id)
      if (ev.completed) finished.push(ev)
      else schedule.push(ev)
    })

  finished.sort((a, b) => new Date(b.date) - new Date(a.date))
  schedule.sort((a, b) => new Date(a.date) - new Date(b.date))

  return {
    matches: [...finished.slice(0, 8), ...schedule.slice(0, 6)],
    finishedCount: finished.length,
    upcomingCount: schedule.length,
  }
}

async function fetchNewsLive(leagueId = 'eng.1', limit = 10) {
  const { data } = await site.get(`/site/v2/sports/soccer/${leagueId}/news`)
  return (data.articles || []).slice(0, limit).map((a) => ({
    id: a.id,
    headline: a.headline || a.description || 'Untitled',
    description: a.description || '',
    published: a.published || a.lastModified || '',
    image: a.images?.[0]?.url || '',
    link: a.links?.web?.href || a.links?.mobile?.href || a.link?.href || '',
    byline: a.byline || a.source || 'ESPN',
  }))
}

function parseStandingsFromRaw(data) {
  const parsed = parseStandings(data)
  const thisYear = String(new Date().getFullYear())
  const isFallback =
    parsed.totalPlayed > 0 &&
    Boolean(parsed.seasonAbbr) &&
    !String(parsed.seasonAbbr).startsWith(thisYear)
  return {
    seasonName: parsed.seasonName,
    seasonAbbr: parsed.seasonAbbr,
    isFallback,
    note:
      parsed.totalPlayed === 0
        ? '시즌 데이터가 아직 없습니다.'
        : isFallback
          ? '새 시즌 경기가 아직 없어 직전 시즌 최종 순위를 보여줍니다.'
          : '현재 시즌 순위입니다.',
    rows: parsed.entries,
  }
}

function parseScoreboardFromRaw(data) {
  const events = parseEvents(data.events || [])
  const finished = events
    .filter((e) => e.completed)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
  const schedule = events
    .filter((e) => !e.completed)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
  return {
    matches: [...finished.slice(0, 8), ...schedule.slice(0, 6)],
    finishedCount: finished.length,
    upcomingCount: schedule.length,
  }
}

function parseNewsFromRaw(data, limit = 12) {
  return (data.articles || []).slice(0, limit).map((a) => ({
    id: a.id,
    headline: a.headline || a.description || 'Untitled',
    description: a.description || '',
    published: a.published || a.lastModified || '',
    image: a.images?.[0]?.url || '',
    link: a.links?.web?.href || a.links?.mobile?.href || a.link?.href || '',
    byline: a.byline || a.source || 'ESPN',
  }))
}

/**
 * Unified league payload (standings / scores / news)
 * Sports view should prefer this to avoid triple parallel cache misses.
 */
export async function fetchLeaguePack(leagueId = 'eng.1', newsLimit = 12) {
  const bundle = await loadBundle(leagueId)

  if (bundle.source === 'live') {
    return {
      standings: bundle.standings,
      scores: bundle.scoreboard,
      news: bundle.news.slice(0, newsLimit),
      source: 'live',
    }
  }

  return {
    standings: parseStandingsFromRaw(bundle.standings),
    scores: parseScoreboardFromRaw(bundle.scoreboard),
    news: parseNewsFromRaw(bundle.news, newsLimit),
    source: 'snapshot',
    fetchedAt: bundle.fetchedAt,
  }
}

export async function fetchLeagueStandings(leagueId = 'eng.1') {
  const pack = await fetchLeaguePack(leagueId)
  return pack.standings
}

export async function fetchLeagueScoreboard(leagueId = 'eng.1') {
  const pack = await fetchLeaguePack(leagueId)
  return pack.scores
}

export async function fetchLeagueNews(leagueId = 'eng.1', limit = 10) {
  const pack = await fetchLeaguePack(leagueId, limit)
  return pack.news
}
