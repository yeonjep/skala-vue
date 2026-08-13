import axios from 'axios'
import { fetchAirQuality, aqiLabel } from '@/api/openMeteo'

const wger = axios.create({
  baseURL: 'https://wger.de/api/v2',
  timeout: 15000,
})

/**
 * wger.de — 오픈소스 운동 DB (키 없음)
 * language=2 → English descriptions
 */
export async function fetchExercises({ limit = 16, offset = 0, category } = {}) {
  const params = { language: 2, limit, offset }
  if (category) params.category = category
  const { data } = await wger.get('/exerciseinfo/', { params })
  return {
    count: data.count || 0,
    next: data.next,
    results: (data.results || []).map((ex) => {
      const en =
        (ex.translations || []).find((t) => t.language === 2) ||
        (ex.translations || [])[0] ||
        {}
      const desc = String(en.description || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      return {
        id: ex.id,
        name: en.name || `Exercise #${ex.id}`,
        description: desc.slice(0, 280),
        category: ex.category?.name || 'General',
        muscles: (ex.muscles || []).map((m) => m.name_en || m.name).filter(Boolean),
        equipment: (ex.equipment || []).map((e) => e.name).filter(Boolean),
        image:
          ex.images?.find((img) => img.is_main)?.image ||
          ex.images?.[0]?.image ||
          '',
      }
    }),
  }
}

export async function fetchExerciseCategories() {
  const { data } = await wger.get('/exercisecategory/')
  return (data.results || []).map((c) => ({ id: c.id, name: c.name }))
}

/** 건강 팁용 대기질 (Open-Meteo) */
export async function fetchHealthAir({ lat, lon }) {
  try {
    const air = await fetchAirQuality({ lat, lon })
    return {
      ...air,
      label: aqiLabel(air.aqi),
      tip: airTip(air.aqi),
    }
  } catch {
    return null
  }
}

function airTip(aqi) {
  if (aqi == null) return '대기질 정보를 불러오지 못했습니다. 실내 환기를 규칙적으로 하세요.'
  if (aqi <= 20) return '대기질이 좋아요습니다. 야외 가벼운 유산소에 좋은 날이에요.'
  if (aqi <= 40) return '보통 수준입니다. 장시간 야외 운동 시 페이스를 조절하세요.'
  if (aqi <= 60) return '다소 나쁩니다. 마스크를 고려하고 실내 운동을 권장합니다.'
  return '매우 나쁩니다. 야외 운동은 피하고 실내 스트레칭·홈트레이닝을 하세요.'
}

/** BMI 계산 (로컬) */
export function calcBmi(heightCm, weightKg) {
  const h = Number(heightCm) / 100
  const w = Number(weightKg)
  if (!h || !w || h <= 0 || w <= 0) return null
  const bmi = w / (h * h)
  let category = '정상'
  let tip = '현재 체중을 유지하며 주 150분 유산소를 목표로 하세요.'
  if (bmi < 18.5) {
    category = '저체중'
    tip = '균형 식사와 근력 운동으로 건강한 체중 증가를 권장합니다.'
  } else if (bmi < 23) {
    category = '정상'
  } else if (bmi < 25) {
    category = '과체중 주의'
    tip = '식사량과 야식을 줄이고 걷기·자전거를 늘려 보세요.'
  } else if (bmi < 30) {
    category = '비만 1단계'
    tip = '주 3회 이상 유산소 + 근력 병행을 권장합니다. 필요 시 전문가 상담.'
  } else {
    category = '비만 고위험'
    tip = '급격한 다이어트보다 의사·영양사 상담 후 계획을 세우세요.'
  }
  return { bmi: Math.round(bmi * 10) / 10, category, tip }
}

export const WATER_TIPS = [
  '일어나서 물 한 컵으로 하루를 시작해 보세요.',
  '운동 전후 200~300ml씩 나눠 마시면 부담이 적습니다.',
  '갈증을 느끼기 전에 규칙적으로 수분 섭취하세요.',
  '카페인 음료만으로는 수분이 부족할 수 있어요.',
]
