import { computed, toValue } from 'vue'
import { useConfigStore } from '@/stores/configStore'
import { convertTemp } from '@/utils/temperature'

/* 스토어 단위에 따라 표시 온도를 계산하는 composable */
export function useDisplayTemp(rawTempSource) {
  const configStore = useConfigStore()

  return computed(() => {
    // toValue: ref / getter / 일반 값 모두 처리 (함수를 unref만 하면 NaN → 0℃ 버그)
    const raw = toValue(rawTempSource)
    if (raw == null || Number.isNaN(Number(raw))) return 0
    return convertTemp(Number(raw), configStore.unit)
  })
}
