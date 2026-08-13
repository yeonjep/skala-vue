import axios from 'axios'

/** ESPN public soccer endpoints — API 키 불필요 */
const site = axios.create({
  baseURL: 'https://site.api.espn.com/apis',
  timeout: 15000,
})

export const FOOTBALL_LEAGUES = [
  { id: 'eng.1', name: '프리미어리그', short: 'EPL' },
  { id: 'esp.1', name: '라리가', short: 'LaLiga' },
  { id: 'ita.1', name: '세리에 A', short: 'Serie A' },
  { id: 'ger.1', name: '분데스리가', short: 'Bundesliga' },
  { id: 'uefa.champions', name: '챔피언스리그', short: 'UCL' },
]

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
  // "2026-2027" → 2025
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

/**
 * 리그 순위표
 * - 현재 시즌 경기가 아직 없으면(전부 0) 직전 시즌으로 자동 폴백
 */
export async function fetchLeagueStandings(leagueId = 'eng.1') {
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

/**
 * 최근 종료 경기 + 예정 경기
 */
export async function fetchLeagueScoreboard(leagueId = 'eng.1') {
  const upcomingRes = await site.get(`/site/v2/sports/soccer/${leagueId}/scoreboard`)
  const upcoming = parseEvents(upcomingRes.data.events || [])

  const finished = []
  const seen = new Set(upcoming.map((e) => e.id))
  const cursor = new Date()

  const dayStamps = Array.from({ length: 14 }, (_, i) => {
    const day = new Date(cursor)
    day.setDate(cursor.getDate() - i)
    return ymd(day)
  })

  const dayResults = await Promise.all(
    dayStamps.map(async (stamp) => {
      try {
        const { data } = await site.get(`/site/v2/sports/soccer/${leagueId}/scoreboard`, {
          params: { dates: stamp },
        })
        return parseEvents(data.events || [])
      } catch {
        return []
      }
    }),
  )

  dayResults.flat().forEach((ev) => {
    if (!ev.completed || seen.has(ev.id)) return
    seen.add(ev.id)
    finished.push(ev)
  })

  // 시즌 초라 최근 결과가 비면 직전 시즌 말(5월) 결과 보강
  if (finished.length < 3) {
    const year = new Date().getFullYear()
    const fallbackDates = [`${year}0518`, `${year - 1}0518`, `${year}0511`, `${year - 1}0511`]
    const extra = await Promise.all(
      fallbackDates.map(async (stamp) => {
        try {
          const { data } = await site.get(`/site/v2/sports/soccer/${leagueId}/scoreboard`, {
            params: { dates: stamp },
          })
          return parseEvents(data.events || [])
        } catch {
          return []
        }
      }),
    )
    extra.flat().forEach((ev) => {
      if (!ev.completed || seen.has(ev.id)) return
      seen.add(ev.id)
      finished.push(ev)
    })
  }

  finished.sort((a, b) => new Date(b.date) - new Date(a.date))
  const schedule = upcoming.filter((e) => !e.completed)

  return {
    matches: [...finished.slice(0, 8), ...schedule.slice(0, 6)],
    finishedCount: finished.length,
    upcomingCount: schedule.length,
  }
}

/**
 * 리그 뉴스/기사
 */
export async function fetchLeagueNews(leagueId = 'eng.1', limit = 10) {
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
