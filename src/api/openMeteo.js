import axios from 'axios'
import { interpretWeatherCode } from '@/utils/weatherCode'

/** [Axios] Open-Meteo — 무료 · API 키 없음 · 월간(과거+예보) 지원 */
const forecastClient = axios.create({
  baseURL: 'https://api.open-meteo.com/v1',
  timeout: 15000,
})

const archiveClient = axios.create({
  baseURL: 'https://archive-api.open-meteo.com/v1',
  timeout: 15000,
})

/** [기타 외부 API] 대기질 */
const airClient = axios.create({
  baseURL: 'https://air-quality-api.open-meteo.com/v1',
  timeout: 12000,
})

const wttrClient = axios.create({
  timeout: 15000,
  headers: { Accept: 'application/json' },
})

const CACHE_PREFIX = 'aerocast_wx_'
const CACHE_TTL_MS = 30 * 60 * 1000
const memoryCache = new Map()

function toDateKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function daysBetween(a, b) {
  const ms =
    Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) -
    Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())
  return Math.round(ms / 86400000)
}

function cacheGet(key) {
  const mem = memoryCache.get(key)
  if (mem && Date.now() - mem.ts < CACHE_TTL_MS) return mem.data

  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.ts || Date.now() - parsed.ts > CACHE_TTL_MS) return null
    memoryCache.set(key, parsed)
    return parsed.data
  } catch {
    return null
  }
}

function cacheSet(key, data) {
  const entry = { ts: Date.now(), data }
  memoryCache.set(key, entry)
  try {
    sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry))
  } catch {
    /* quota ignore */
  }
}

function isRateLimited(err) {
  const status = err?.response?.status
  const reason = String(err?.response?.data?.reason || err?.message || '').toLowerCase()
  return status === 429 || reason.includes('limit exceeded') || reason.includes('rate')
}

function assertOpenMeteoOk(data) {
  if (data?.error) {
    const err = new Error(data.reason || 'Open-Meteo error')
    err.response = { status: 429, data }
    throw err
  }
  return data
}

function roundCoord(n) {
  return Math.round(Number(n) * 1000) / 1000
}

function dashKey(lat, lon) {
  return `dash:${roundCoord(lat)},${roundCoord(lon)}`
}

function citiesKey(cities) {
  return `cities:${cities.map((c) => c.id).join(',')}`
}

function parseCurrentFromOpenMeteo(cur) {
  const wx = interpretWeatherCode(cur.weather_code)
  const visibilityKm =
    cur.visibility == null ? null : Math.round((Number(cur.visibility) / 1000) * 10) / 10
  return {
    temp: Math.round(cur.temperature_2m),
    humidity: Math.round(cur.relative_humidity_2m),
    wind: Number(cur.wind_speed_10m).toFixed(1),
    visibilityKm,
    precipitation: Number(cur.precipitation ?? 0),
    status: wx.label,
    emoji: wx.emoji,
    weatherCode: cur.weather_code,
    observedAt: cur.time,
  }
}

function parseDashboardFromOpenMeteo(data) {
  const current = parseCurrentFromOpenMeteo(data.current)
  const daily = (data.daily?.time || []).map((date, i) => {
    const code = data.daily.weather_code[i]
    const info = interpretWeatherCode(code)
    return {
      date,
      weekday: new Date(`${date}T12:00:00`).toLocaleDateString('ko-KR', { weekday: 'short' }),
      high: Math.round(data.daily.temperature_2m_max[i]),
      low: Math.round(data.daily.temperature_2m_min[i]),
      precipMm: Math.round((data.daily.precipitation_sum?.[i] ?? 0) * 10) / 10,
      precipProb: Math.round(data.daily.precipitation_probability_max?.[i] ?? 0),
      emoji: info.emoji,
      label: info.label,
    }
  })
  const hourly = (data.hourly?.time || []).slice(0, 24).map((time, i) => ({
    time,
    hour: time.slice(11, 16),
    temp: Math.round(data.hourly.temperature_2m[i]),
    humidity: Math.round(data.hourly.relative_humidity_2m[i]),
    precip: Number(data.hourly.precipitation[i] ?? 0),
  }))
  return { current, daily, hourly, source: 'open-meteo' }
}

/** wttr.in WMO-ish / legacy codes → 화면용 */
function interpretWttrCode(code, desc = '') {
  const n = Number(code)
  const d = String(desc).toLowerCase()
  if ([113].includes(n) || d.includes('sunny') || d.includes('clear'))
    return { emoji: '☀️', label: '맑음' }
  if ([116].includes(n) || d.includes('partly')) return { emoji: '⛅️', label: '구름조금' }
  if ([119, 122].includes(n) || d.includes('cloud') || d.includes('overcast'))
    return { emoji: '☁️', label: '흐림' }
  if ([143, 248, 260].includes(n) || d.includes('fog') || d.includes('mist'))
    return { emoji: '🌫', label: '안개' }
  if ([176, 263, 266, 281, 284, 293, 296].includes(n) || d.includes('drizzle'))
    return { emoji: '🌦', label: '이슬비' }
  if (
    [200, 302, 308, 311, 314, 353, 356, 359, 386, 389].includes(n) ||
    d.includes('rain') ||
    d.includes('shower')
  )
    return { emoji: '🌧', label: '비' }
  if ([179, 182, 185, 227, 230, 323, 326, 329, 332, 335, 338, 368, 371].includes(n) || d.includes('snow'))
    return { emoji: '❄️', label: '눈' }
  if ([389, 392, 395].includes(n) || d.includes('thunder')) return { emoji: '⛈', label: '뇌우' }
  return interpretWeatherCode(n) || { emoji: '🌤', label: desc || '알 수 없음' }
}

function kmhToMs(kmh) {
  return (Number(kmh) / 3.6).toFixed(1)
}

async function fetchWttrJson(lat, lon) {
  const { data } = await wttrClient.get(`https://wttr.in/${lat},${lon}`, {
    params: { format: 'j1' },
  })
  if (!data?.current_condition?.[0]) throw new Error('wttr.in 응답이 비었습니다.')
  return data
}

function parseDashboardFromWttr(data) {
  const cur = data.current_condition[0]
  const desc = cur.weatherDesc?.[0]?.value || ''
  const wx = interpretWttrCode(cur.weatherCode, desc)
  const current = {
    temp: Math.round(Number(cur.temp_C)),
    humidity: Math.round(Number(cur.humidity)),
    wind: kmhToMs(cur.windspeedKmph),
    visibilityKm: cur.visibility != null ? Number(cur.visibility) : null,
    precipitation: Number(cur.precipMM ?? 0),
    status: wx.label,
    emoji: wx.emoji,
    weatherCode: Number(cur.weatherCode),
    observedAt: cur.localObsDateTime || cur.observation_time,
  }

  const daily = (data.weather || []).map((day) => {
    const noon = day.hourly?.find((h) => Number(h.time) === 1200) || day.hourly?.[0]
    const dDesc = noon?.weatherDesc?.[0]?.value || day.hourly?.[0]?.weatherDesc?.[0]?.value || ''
    const info = interpretWttrCode(noon?.weatherCode ?? day.hourly?.[0]?.weatherCode, dDesc)
    const chance =
      noon?.chanceofrain != null
        ? Number(noon.chanceofrain)
        : Math.round(
            (day.hourly || []).reduce((s, h) => s + Number(h.chanceofrain || 0), 0) /
              Math.max((day.hourly || []).length, 1),
          )
    return {
      date: day.date,
      weekday: new Date(`${day.date}T12:00:00`).toLocaleDateString('ko-KR', { weekday: 'short' }),
      high: Math.round(Number(day.maxtempC)),
      low: Math.round(Number(day.mintempC)),
      precipMm: Math.round(Number(day.totalSnow_cm || 0) * 10) / 10,
      precipProb: chance,
      emoji: info.emoji,
      label: info.label,
    }
  })

  const todayHourly = data.weather?.[0]?.hourly || []
  const hourly = todayHourly.map((h) => {
    const t = String(h.time).padStart(4, '0')
    const hour = `${t.slice(0, -2).padStart(2, '0')}:${t.slice(-2)}`
    return {
      time: `${data.weather[0].date}T${hour}`,
      hour,
      temp: Math.round(Number(h.tempC)),
      humidity: Math.round(Number(h.humidity)),
      precip: Number(h.precipMM ?? 0),
    }
  })

  return { current, daily, hourly, source: 'wttr' }
}

function parseCityFromWttr(city, data) {
  const cur = data.current_condition[0]
  const desc = cur.weatherDesc?.[0]?.value || ''
  const wx = interpretWttrCode(cur.weatherCode, desc)
  return {
    id: city.id,
    name: city.name,
    temp: Math.round(Number(cur.temp_C)),
    status: wx.label,
    humidity: Math.round(Number(cur.humidity)),
    wind: kmhToMs(cur.windspeedKmph),
    emoji: wx.emoji,
  }
}

async function withCache(key, loader) {
  const cached = cacheGet(key)
  try {
    const data = await loader()
    cacheSet(key, data)
    return data
  } catch (err) {
    if (cached) {
      console.warn('[weather] 캐시 사용:', key, err?.message || err)
      return { ...cached, fromCache: true }
    }
    throw err
  }
}

/**
 * 도시 현재 날씨 (온도·습도·풍속·가시거리·강수·상태)
 */
export async function fetchCurrentWeather({ lat, lon }) {
  const bundle = await fetchDashboardBundle({ lat, lon })
  return bundle.current
}

/**
 * 대시보드용: 현재 + 7일 + 시간별(온도/습도/강수)
 * Open-Meteo 우선, 한도/실패 시 wttr.in + 캐시
 */
export async function fetchDashboardBundle({ lat, lon }) {
  const key = dashKey(lat, lon)
  return withCache(key, async () => {
    try {
      const { data } = await forecastClient.get('/forecast', {
        params: {
          latitude: lat,
          longitude: lon,
          current:
            'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,visibility,precipitation',
          daily:
            'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max',
          hourly: 'temperature_2m,relative_humidity_2m,precipitation',
          forecast_days: 7,
          timezone: 'Asia/Seoul',
          wind_speed_unit: 'ms',
        },
      })
      assertOpenMeteoOk(data)
      return parseDashboardFromOpenMeteo(data)
    } catch (err) {
      console.warn('[Open-Meteo] dashboard fallback → wttr.in', err?.response?.data || err.message)
      const wttr = await fetchWttrJson(lat, lon)
      return parseDashboardFromWttr(wttr)
    }
  })
}

/** Open-Meteo Geocoding — 도시 검색 (키 없음) */
export async function searchCitiesByName(name, count = 6) {
  const q = String(name || '').trim()
  if (!q) return []
  const key = `geo:${q}:${count}`
  return withCache(key, async () => {
    try {
      const { data } = await axios.get('https://geocoding-api.open-meteo.com/v1/search', {
        params: { name: q, count, language: 'ko', format: 'json' },
        timeout: 10000,
      })
      return (data.results || []).map((r) => ({
        id: `geo_${r.id}`,
        name: r.name,
        english: r.name,
        label: [r.admin1, r.country].filter(Boolean).join(', '),
        lat: r.latitude,
        lon: r.longitude,
        country: r.country_code,
      }))
    } catch (err) {
      // 간단 폴백: 좌표 검색은 로컬 카탈로그만으로는 부족 → 재throw
      if (isRateLimited(err)) throw err
      throw err
    }
  })
}

/**
 * 여러 도시 현재 날씨 — 1회 배치 요청 (한도 절약)
 */
export async function fetchCitiesCurrent(cities) {
  if (!cities?.length) return []
  const key = citiesKey(cities)
  return withCache(key, async () => {
    try {
      const { data } = await forecastClient.get('/forecast', {
        params: {
          latitude: cities.map((c) => c.lat).join(','),
          longitude: cities.map((c) => c.lon).join(','),
          current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation',
          timezone: 'auto',
          wind_speed_unit: 'ms',
        },
      })
      assertOpenMeteoOk(data)
      const rows = Array.isArray(data) ? data : [data]
      return cities.map((city, i) => {
        const row = rows[i] || rows[0]
        const cur = row?.current
        if (!cur) {
          return {
            id: city.id,
            name: city.name,
            temp: null,
            status: '—',
            humidity: null,
            wind: null,
            emoji: '☁',
          }
        }
        const wx = interpretWeatherCode(cur.weather_code)
        return {
          id: city.id,
          name: city.name,
          temp: Math.round(cur.temperature_2m),
          status: wx.label,
          humidity: Math.round(cur.relative_humidity_2m),
          wind: Number(cur.wind_speed_10m).toFixed(1),
          emoji: wx.emoji,
        }
      })
    } catch (err) {
      console.warn('[Open-Meteo] cities fallback → wttr.in', err?.response?.data || err.message)
      const results = []
      for (const city of cities) {
        try {
          const wttr = await fetchWttrJson(city.lat, city.lon)
          results.push(parseCityFromWttr(city, wttr))
        } catch (inner) {
          console.warn('[wttr] city fail', city.name, inner?.message)
          results.push({
            id: city.id,
            name: city.name,
            temp: null,
            status: '일시 오류',
            humidity: null,
            wind: null,
            emoji: '☁',
          })
        }
      }
      return results
    }
  })
}

/**
 * 이번 달 일별 최고/최저 + 날씨코드
 * - Archive / Climate는 한도가 비교적 여유로워 우선 사용
 * - Forecast 한도 초과 시에도 이미 받은 데이터를 버리지 않음
 */
export async function fetchMonthDaily({ lat, lon, year, monthIndex }) {
  const key = `month:v2:${roundCoord(lat)},${roundCoord(lon)}:${year}-${monthIndex}`
  return withCache(key, async () => {
    const today = new Date()
    const monthStart = new Date(year, monthIndex, 1)
    const monthEnd = new Date(year, monthIndex + 1, 0)
    const byDate = {}

    const archiveEnd = today < monthStart ? null : today > monthEnd ? monthEnd : today

    // 1) 과거~오늘: Archive (별도 try — 실패해도 계속)
    if (archiveEnd && archiveEnd >= monthStart) {
      try {
        const { data } = await archiveClient.get('/archive', {
          params: {
            latitude: lat,
            longitude: lon,
            start_date: toDateKey(monthStart),
            end_date: toDateKey(archiveEnd),
            daily: 'weather_code,temperature_2m_max,temperature_2m_min',
            timezone: 'Asia/Seoul',
          },
        })
        assertOpenMeteoOk(data)
        mergeDaily(byDate, data.daily)
      } catch (err) {
        console.warn('[month] archive skip', err?.response?.data || err.message)
      }
    }

    // 2) 오늘 이후: Forecast (한도 걸려도 무시하고 진행)
    if (today <= monthEnd) {
      try {
        const remaining = daysBetween(today, monthEnd) + 1
        const forecastDays = Math.min(16, Math.max(1, remaining))
        const pastDays = Math.min(
          92,
          Math.max(0, daysBetween(monthStart, today)),
        )
        const { data } = await forecastClient.get('/forecast', {
          params: {
            latitude: lat,
            longitude: lon,
            daily: 'weather_code,temperature_2m_max,temperature_2m_min',
            forecast_days: forecastDays,
            past_days: pastDays,
            timezone: 'Asia/Seoul',
          },
        })
        assertOpenMeteoOk(data)
        mergeDaily(byDate, data.daily)
      } catch (err) {
        console.warn('[month] forecast skip', err?.response?.data || err.message)
      }
    }

    // 3) 빈 날짜: Climate (평년)로 채우기
    let missing = []
    for (let d = 1; d <= monthEnd.getDate(); d += 1) {
      const keyDate = toDateKey(new Date(year, monthIndex, d))
      if (!byDate[keyDate]) missing.push(keyDate)
    }

    if (missing.length) {
      try {
        const { data } = await axios.get('https://climate-api.open-meteo.com/v1/climate', {
          params: {
            latitude: lat,
            longitude: lon,
            start_date: toDateKey(monthStart),
            end_date: toDateKey(monthEnd),
            models: 'EC_Earth3P_HR',
            daily: 'temperature_2m_max,temperature_2m_min',
          },
          timeout: 15000,
        })
        assertOpenMeteoOk(data)
        const times = data.daily?.time || []
        times.forEach((dateKey, i) => {
          if (!byDate[dateKey]) {
            byDate[dateKey] = {
              high: Math.round(data.daily.temperature_2m_max[i]),
              low: Math.round(data.daily.temperature_2m_min[i]),
              emoji: '🌤',
              label: '평년 경향',
              source: 'climate',
            }
          }
        })
      } catch (err) {
        console.warn('[month] climate skip', err?.response?.data || err.message)
      }
    }

    // 4) 그래도 부족하면 wttr (최근 2~3일)
    missing = []
    for (let d = 1; d <= monthEnd.getDate(); d += 1) {
      const keyDate = toDateKey(new Date(year, monthIndex, d))
      if (!byDate[keyDate]) missing.push(keyDate)
    }
    if (missing.length) {
      try {
        const wttr = await fetchWttrJson(lat, lon)
        ;(wttr.weather || []).forEach((day) => {
          const noon = day.hourly?.find((h) => Number(h.time) === 1200) || day.hourly?.[0]
          const info = interpretWttrCode(
            noon?.weatherCode,
            noon?.weatherDesc?.[0]?.value || '',
          )
          byDate[day.date] = {
            high: Math.round(Number(day.maxtempC)),
            low: Math.round(Number(day.mintempC)),
            emoji: info.emoji,
            label: info.label,
            source: 'wttr',
          }
        })
      } catch (err) {
        console.warn('[month] wttr skip', err?.response?.data || err.message)
      }
    }

    // 5) 최후: 계절 추정값으로라도 칸을 채움 (빈 달력 방지)
    const seasonal = seasonalMonthTemps(lat, monthIndex)
    for (let d = 1; d <= monthEnd.getDate(); d += 1) {
      const keyDate = toDateKey(new Date(year, monthIndex, d))
      if (!byDate[keyDate]) {
        const wave = Math.sin((d / monthEnd.getDate()) * Math.PI)
        byDate[keyDate] = {
          high: Math.round(seasonal.high + wave * 2),
          low: Math.round(seasonal.low + wave * 1.5),
          emoji: seasonal.emoji,
          label: '추정',
          source: 'estimate',
        }
      }
    }

    return byDate
  })
}

/** 위도·월 기준 대략 기온 (API 전부 실패 시) */
function seasonalMonthTemps(lat, monthIndex) {
  const absLat = Math.abs(Number(lat) || 35)
  const mid = 18 - absLat * 0.15
  const amp = 12
  const phase = (monthIndex - 6) / 12
  const base = mid + Math.cos(phase * Math.PI * 2) * amp
  return {
    high: Math.round(base + 4),
    low: Math.round(base - 5),
    emoji: monthIndex >= 5 && monthIndex <= 8 ? '☀️' : monthIndex <= 1 || monthIndex === 11 ? '❄️' : '🌤',
  }
}

function mergeDaily(target, daily) {
  if (!daily?.time) return
  daily.time.forEach((dateKey, i) => {
    const wx = interpretWeatherCode(daily.weather_code?.[i] ?? 1)
    target[dateKey] = {
      high: Math.round(daily.temperature_2m_max[i]),
      low: Math.round(daily.temperature_2m_min[i]),
      emoji: wx.emoji,
      label: wx.label,
      source: 'forecast',
    }
  })
}

/**
 * [기타 외부 API] 대기질 (유럽 AQI · PM2.5)
 */
export async function fetchAirQuality({ lat, lon }) {
  const key = `air:${roundCoord(lat)},${roundCoord(lon)}`
  return withCache(key, async () => {
    const { data } = await airClient.get('/air-quality', {
      params: {
        latitude: lat,
        longitude: lon,
        current: 'european_aqi,pm2_5,pm10',
        timezone: 'Asia/Seoul',
      },
    })
    assertOpenMeteoOk(data)
    const cur = data.current
    return {
      aqi: cur.european_aqi ?? null,
      pm25: cur.pm2_5 ?? null,
      pm10: cur.pm10 ?? null,
      observedAt: cur.time,
    }
  })
}

export function aqiLabel(aqi) {
  if (aqi == null) return '정보 없음'
  if (aqi <= 20) return '좋음'
  if (aqi <= 40) return '보통'
  if (aqi <= 60) return '나쁨'
  if (aqi <= 80) return '매우 나쁨'
  return '위험'
}
