/** Open-Meteo용 도시 좌표 (API 키 불필요) */
/** city_01 = 기본 대표 도시(울산) */
export const CITY_CATALOG = [
  {
    id: 'city_01',
    name: '울산',
    english: 'Ulsan',
    label: '울산광역시',
    lat: 35.5384,
    lon: 129.3114,
  },
  {
    id: 'city_02',
    name: '서울',
    english: 'Seoul',
    label: '대한민국 서울특별시',
    lat: 37.5665,
    lon: 126.978,
  },
  {
    id: 'city_03',
    name: '부산',
    english: 'Busan',
    label: '부산광역시',
    lat: 35.1796,
    lon: 129.0756,
  },
  {
    id: 'city_04',
    name: '수원',
    english: 'Suwon',
    label: '경기도 수원시',
    lat: 37.2636,
    lon: 127.0286,
  },
  {
    id: 'city_05',
    name: '강릉',
    english: 'Gangneung',
    label: '강원특별자치도 강릉시',
    lat: 37.7519,
    lon: 128.8761,
  },
]

/** 홈 자동 스와이프에 쓰는 5도시 (울산이 맨 앞 = 디폴트) */
export const HOME_CAROUSEL_CITIES = CITY_CATALOG

export const DEFAULT_CITY = CITY_CATALOG[0]

export function findCityById(cityId) {
  return CITY_CATALOG.find((c) => c.id === cityId) || null
}
