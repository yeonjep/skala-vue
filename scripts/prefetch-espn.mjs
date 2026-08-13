/**
 * GitHub Pages(정적 호스팅)용 ESPN 스냅샷 생성
 * ESPN은 브라우저 CORS가 막혀서, 빌드 시 Node에서 받아 public/data/espn 에 저장합니다.
 */
import axios from 'axios'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '../public/data/espn')

const site = axios.create({
  // CI/로컬 모두 Node에서 직접 호출. 403이면 VITE_ESPN_PROXY 로 우회 가능
  baseURL: process.env.VITE_ESPN_PROXY || 'https://site.api.espn.com/apis',
  timeout: 25000,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    Accept: 'application/json',
  },
})

const LEAGUES = ['eng.1', 'esp.1', 'ita.1', 'ger.1', 'uefa.champions']

function ymd(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}${m}${d}`
}

async function fetchStandingsRaw(leagueId) {
  const { data } = await site.get(`/v2/sports/soccer/${leagueId}/standings`)
  const child = data.children?.[0]
  const seasonAbbr = child?.abbreviation || ''
  const entries = child?.standings?.entries || []
  const totalPlayed = entries.reduce((sum, row) => {
    const gp = row.stats?.find((s) => s.name === 'gamesPlayed')
    return sum + Number(gp?.value ?? 0)
  }, 0)

  if (entries.length && totalPlayed > 0) return data

  const m = String(seasonAbbr).match(/^(\d{4})/)
  const season = m ? Number(m[1]) - 1 : new Date().getFullYear() - 1
  const { data: prev } = await site.get(`/v2/sports/soccer/${leagueId}/standings`, {
    params: { season },
  })
  return prev
}

async function fetchScoreboardRaw(leagueId) {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - 21)
  const dates = `${ymd(start)}-${ymd(end)}`
  const year = end.getFullYear()
  // 시즌 초에는 최근 경기가 거의 없음 → 직전 시즌 말(5월) 결과도 함께 수집
  const enrichDates = [`${year - 1}0501-${year - 1}0525`, `${year}0501-${year}0525`]

  const requests = [
    site.get(`/site/v2/sports/soccer/${leagueId}/scoreboard`, { params: { dates } }),
    site.get(`/site/v2/sports/soccer/${leagueId}/scoreboard`),
    ...enrichDates.map((d) =>
      site.get(`/site/v2/sports/soccer/${leagueId}/scoreboard`, { params: { dates: d } }).catch(() => ({ data: { events: [] } })),
    ),
  ]
  const results = await Promise.all(requests)
  const byId = new Map()
  results.forEach(({ data }) => {
    ;(data.events || []).forEach((ev) => {
      if (ev?.id) byId.set(ev.id, ev)
    })
  })

  return {
    leagues: results[1].data.leagues || results[0].data.leagues,
    events: [...byId.values()],
  }
}

async function fetchNewsRaw(leagueId) {
  const { data } = await site.get(`/site/v2/sports/soccer/${leagueId}/news`)
  return data
}

await mkdir(outDir, { recursive: true })

for (const leagueId of LEAGUES) {
  try {
    const [standings, scoreboard, news] = await Promise.all([
      fetchStandingsRaw(leagueId),
      fetchScoreboardRaw(leagueId),
      fetchNewsRaw(leagueId),
    ])
    const payload = {
      fetchedAt: new Date().toISOString(),
      leagueId,
      standings,
      scoreboard,
      news,
    }
    const file = join(outDir, `${leagueId}.json`)
    await writeFile(file, JSON.stringify(payload))
    console.log(
      'ok',
      leagueId,
      'standings',
      standings.children?.[0]?.standings?.entries?.length ?? 0,
      'events',
      scoreboard.events?.length ?? 0,
      'news',
      news.articles?.length ?? 0,
    )
  } catch (err) {
    console.error('fail', leagueId, err?.response?.status || err.message)
    process.exitCode = 1
  }
}

console.log('prefetch done →', outDir)
