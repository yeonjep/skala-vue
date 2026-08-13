import axios from 'axios'

/** RainViewer — 무료 레이더 타일 (개인/교육용, API 키 없음) */
const META_URL = 'https://api.rainviewer.com/public/weather-maps.json'

/**
 * 최신 레이더 프레임 메타데이터
 * @returns {Promise<{ host: string, frames: Array<{ time: number, path: string, label: string }> }>}
 */
export async function fetchRadarFrames() {
  const { data } = await axios.get(META_URL, { timeout: 12000 })
  const past = data?.radar?.past || []
  const frames = past.slice(-8).map((f) => ({
    time: f.time,
    path: f.path,
    label: new Date(f.time * 1000).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  }))
  return {
    host: data.host,
    frames,
    generated: data.generated,
  }
}

/**
 * 좌표 중심 레이더 이미지 URL (위젯용)
 * color=2 Universal Blue · options=1_1 smooth+snow
 */
export function buildRadarImageUrl({ host, path, lat, lon, zoom = 5, size = 512 }) {
  return `${host}${path}/${size}/${zoom}/${lat}/${lon}/2/1_1.png`
}
