/** 섭씨 원본 → 현재 단위에 맞는 표시 온도 */
export function convertTemp(rawTemp, unit) {
  if (unit === 'fahrenheit') {
    return Math.round((rawTemp * 9) / 5 + 32)
  }
  return rawTemp
}
