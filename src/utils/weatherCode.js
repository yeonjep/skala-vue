/** WMO Weather interpretation codes → 화면용 이모지·라벨 */
const CODE_MAP = [
  { codes: [0], emoji: '☀️', label: '맑음' },
  { codes: [1], emoji: '🌤', label: '대체로 맑음' },
  { codes: [2], emoji: '⛅️', label: '구름조금' },
  { codes: [3], emoji: '☁️', label: '흐림' },
  { codes: [45, 48], emoji: '🌫', label: '안개' },
  { codes: [51, 53, 55, 56, 57], emoji: '🌦', label: '이슬비' },
  { codes: [61, 63, 65, 66, 67], emoji: '🌧', label: '비' },
  { codes: [71, 73, 75, 77], emoji: '❄️', label: '눈' },
  { codes: [80, 81, 82], emoji: '🌦', label: '소나기' },
  { codes: [85, 86], emoji: '🌨', label: '눈소나기' },
  { codes: [95, 96, 99], emoji: '⛈', label: '뇌우' },
]

export function interpretWeatherCode(code) {
  const n = Number(code)
  for (const row of CODE_MAP) {
    if (row.codes.includes(n)) return { emoji: row.emoji, label: row.label, code: n }
  }
  return { emoji: '🌤', label: '알 수 없음', code: n }
}
