/** WMO Weather interpretation codes → 화면용 이모지·라벨·아이콘 id */
const CODE_MAP = [
  { codes: [0], emoji: '☀️', label: '맑음', icon: 'clear' },
  { codes: [1], emoji: '🌤', label: '대체로 맑음', icon: 'mostly' },
  { codes: [2], emoji: '⛅️', label: '구름조금', icon: 'partly' },
  { codes: [3], emoji: '☁️', label: '흐림', icon: 'cloudy' },
  { codes: [45, 48], emoji: '🌫', label: '안개', icon: 'fog' },
  { codes: [51, 53, 55, 56, 57], emoji: '🌦', label: '이슬비', icon: 'drizzle' },
  { codes: [61, 63, 65, 66, 67], emoji: '🌧', label: '비', icon: 'rain' },
  { codes: [71, 73, 75, 77], emoji: '❄️', label: '눈', icon: 'snow' },
  { codes: [80, 81, 82], emoji: '🌦', label: '소나기', icon: 'showers' },
  { codes: [85, 86], emoji: '🌨', label: '눈소나기', icon: 'snowShowers' },
  { codes: [95, 96, 99], emoji: '⛈', label: '뇌우', icon: 'thunder' },
]

const EMOJI_TO_ICON = {
  '☀️': 'clear',
  '🌤': 'mostly',
  '⛅️': 'partly',
  '⛅': 'partly',
  '☁️': 'cloudy',
  '☁': 'cloudy',
  '🌫': 'fog',
  '🌦': 'drizzle',
  '🌧': 'rain',
  '❄️': 'snow',
  '❄': 'snow',
  '🌨': 'snowShowers',
  '⛈': 'thunder',
  '⚡': 'thunder',
}

export function interpretWeatherCode(code) {
  const n = Number(code)
  for (const row of CODE_MAP) {
    if (row.codes.includes(n)) {
      return { emoji: row.emoji, label: row.label, icon: row.icon, code: n }
    }
  }
  return { emoji: '🌤', label: '알 수 없음', icon: 'mostly', code: n }
}

export function weatherIconFromEmoji(emoji) {
  if (!emoji || emoji === '·') return 'empty'
  return EMOJI_TO_ICON[emoji] || 'mostly'
}
