/**
 * 불쾌지수(DI) + 날씨 무드 판정
 * DI ≈ 0.81T + 0.01H(0.99T − 14.3) + 46.3
 */
export function discomfortIndex(tempC, humidityPct) {
  const T = Number(tempC)
  const H = Number(humidityPct)
  if (Number.isNaN(T) || Number.isNaN(H)) return null
  return Math.round((0.81 * T + 0.01 * H * (0.99 * T - 14.3) + 46.3) * 10) / 10
}

export function diLabel(di) {
  if (di == null) return '—'
  if (di >= 80) return '매우 높음'
  if (di >= 75) return '높음'
  if (di >= 70) return '보통~주의'
  if (di >= 68) return '쾌적 경계'
  return '쾌적'
}

/**
 * 8가지 오리지널 캐릭터 상태
 * @returns {{ id, title, caption, motion }}
 */
export function resolveWeatherMood({ tempC, humidityPct, status = '', weatherCode }) {
  const T = Number(tempC)
  const H = Number(humidityPct)
  const di = discomfortIndex(T, H)
  const s = String(status || '')
  const code = Number(weatherCode)

  const rainy =
    /비|소나기|이슬비|뇌우|눈|안개/.test(s) ||
    [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 99].includes(
      code,
    )
  const stormy = /뇌우|태풍|강풍/.test(s) || [95, 96, 99].includes(code)
  const snowy = /눈/.test(s) || [71, 73, 75, 77, 85, 86].includes(code)

  if (stormy) {
    return {
      id: 'storm',
      title: '폭풍 주의',
      caption: '바람과 비에 기울어졌어요. 외출은 신중히!',
      motion: 'sway-hard',
    }
  }
  if (snowy || T <= 0) {
    return {
      id: 'freeze',
      title: '꽁꽁 추위',
      caption: '덜덜… 귀마개와 패딩이 필수예요.',
      motion: 'shiver',
    }
  }
  if (rainy) {
    return {
      id: 'rain',
      title: '비 오는 날',
      caption: '우산을 꼭 잡았어요. 미끄러운 길 조심!',
      motion: 'lean-rain',
    }
  }
  if (T >= 33 || (di != null && di >= 80)) {
    return {
      id: 'melt',
      title: '녹는 폭염',
      caption: '너무 더워서 녹아내리는 중… 그늘과 수분 보충!',
      motion: 'melt',
    }
  }
  if (T >= 28 || (di != null && di >= 75)) {
    return {
      id: 'hot',
      title: '무더위',
      caption: '너무 더워요! 한낮 야외 활동은 짧게.',
      motion: 'sweat',
    }
  }
  if ((di != null && di >= 70 && H >= 70) || (H >= 85 && T >= 22)) {
    return {
      id: 'muggy',
      title: '끈적 습도',
      caption: '불쾌지수가 올라갔어요. 통풍이 중요해요.',
      motion: 'sticky',
    }
  }
  if (T <= 8) {
    return {
      id: 'chilly',
      title: '쌀쌀한 날',
      caption: '따뜻하게 입고 호호~ 입김이 나와요.',
      motion: 'bundle',
    }
  }
  if (T >= 22 && T < 28 && (di == null || di < 70)) {
    return {
      id: 'sunny',
      title: '포근 맑음',
      caption: '기분 좋은 날씨! 가볍게 산책하기 좋아요아요.',
      motion: 'bounce',
    }
  }
  return {
    id: 'mild',
    title: '잔잔한 하루',
    caption: '무난한 날씨예요. 누비가 여유롭게 쉬고 있어요.',
    motion: 'idle',
  }
}
