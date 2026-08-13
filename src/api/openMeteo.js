import axios from 'axios'
import { interpretWeatherCode } from '@/utils/weatherCode'

/** [Axios] Open-Meteo — 무료 · API 키 없음 · 월간(과거+예보) 지원 */
const forecastClient = axios.create({
  baseURL: 'https://api.open-meteo.com/v1',
  timeout: 12000,
})

const archiveClient = axios.create({
  baseURL: 'https://archive-api.open-meteo.com/v1',
  timeout: 12000,
})

/** [기타 외부 API] 대기질 */
const airClient = axios.create({
  baseURL: 'https://air-quality-api.open-meteo.com/v1',
  timeout: 12000,
})

function toDateKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function daysBetween(a, b) {
  const ms = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())
  return Math.round(ms / 86400000)
}

/**
 * 도시 현재 날씨 (온도·습도·풍속·상태)
 */
export async function fetchCurrentWeather({ lat, lon }) {
  const { data } = await forecastClient.get('/forecast', {
    params: {
      latitude: lat,
      longitude: lon,
      current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m',
      timezone: 'Asia/Seoul',
      wind_speed_unit: 'ms',
    },
  })

  const cur = data.current
  const wx = interpretWeatherCode(cur.weather_code)

  return {
    temp: Math.round(cur.temperature_2m),
    humidity: Math.round(cur.relative_humidity_2m),
    wind: Number(cur.wind_speed_10m).toFixed(1),
    status: wx.label,
    emoji: wx.emoji,
    weatherCode: cur.weather_code,
    observedAt: cur.time,
  }
}

/**
 * 여러 도시 현재 날씨 병렬 조회
 */
export async function fetchCitiesCurrent(cities) {
  const results = await Promise.all(
    cities.map(async (city) => {
      const weather = await fetchCurrentWeather({ lat: city.lat, lon: city.lon })
      return {
        id: city.id,
        name: city.name,
        temp: weather.temp,
        status: weather.status,
        humidity: weather.humidity,
        wind: weather.wind,
        emoji: weather.emoji,
      }
    }),
  )
  return results
}

/**
 * 이번 달 일별 최고/최저 + 날씨코드
 * - 과거: Archive API
 * - 오늘~최대 16일: Forecast API
 * (한 달 캘린더용 — OWM 무료 티어에는 월간이 없음)
 */
export async function fetchMonthDaily({ lat, lon, year, monthIndex }) {
  const today = new Date()
  const monthStart = new Date(year, monthIndex, 1)
  const monthEnd = new Date(year, monthIndex + 1, 0)
  const byDate = {}

  const archiveEnd = today < monthStart ? monthStart : today > monthEnd ? monthEnd : today

  if (archiveEnd >= monthStart) {
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
    mergeDaily(byDate, data.daily)
  }

  if (today <= monthEnd) {
    const remaining = daysBetween(today, monthEnd) + 1
    const forecastDays = Math.min(16, Math.max(1, remaining))
    const { data } = await forecastClient.get('/forecast', {
      params: {
        latitude: lat,
        longitude: lon,
        daily: 'weather_code,temperature_2m_max,temperature_2m_min',
        forecast_days: forecastDays,
        timezone: 'Asia/Seoul',
      },
    })
    mergeDaily(byDate, data.daily)
  }

  // forecast_days(16)로 못 채운 말일 → Climate API(평년 경향)로 보강
  const missing = []
  for (let d = 1; d <= monthEnd.getDate(); d += 1) {
    const key = toDateKey(new Date(year, monthIndex, d))
    if (!byDate[key]) missing.push(key)
  }

  if (missing.length) {
    try {
      const { data } = await axios.get('https://climate-api.open-meteo.com/v1/climate', {
        params: {
          latitude: lat,
          longitude: lon,
          start_date: missing[0],
          end_date: missing[missing.length - 1],
          models: 'EC_Earth3P_HR',
          daily: 'temperature_2m_max,temperature_2m_min',
        },
        timeout: 12000,
      })
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
    } catch {
      /* climate 실패 시 해당 날짜는 캘린더에서 — 표시 */
    }
  }

  return byDate
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
  const { data } = await airClient.get('/air-quality', {
    params: {
      latitude: lat,
      longitude: lon,
      current: 'european_aqi,pm2_5,pm10',
      timezone: 'Asia/Seoul',
    },
  })

  const cur = data.current
  return {
    aqi: cur.european_aqi ?? null,
    pm25: cur.pm2_5 ?? null,
    pm10: cur.pm10 ?? null,
    observedAt: cur.time,
  }
}

export function aqiLabel(aqi) {
  if (aqi == null) return '정보 없음'
  if (aqi <= 20) return '좋음'
  if (aqi <= 40) return '보통'
  if (aqi <= 60) return '나쁨'
  if (aqi <= 80) return '매우 나쁨'
  return '위험'
}
