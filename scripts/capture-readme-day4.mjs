/**
 * 4일차 README용 스크린샷 캡처
 * 사용: BASE_URL=http://localhost:3000 node scripts/capture-readme-day4.mjs
 */
import { chromium } from 'playwright'

const base = process.env.BASE_URL || 'http://localhost:3000'
const out = 'screenshots'

const browser = await chromium.launch({
  channel: 'chrome', // 로컬 Chrome 사용 (playwright browser 설치 불필요)
})
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })

async function shot(path, file, waitMs = 1000) {
  await page.goto(base + path, { waitUntil: 'networkidle', timeout: 45000 })
  await page.waitForTimeout(waitMs)
  await page.screenshot({ path: `${out}/${file}`, fullPage: true })
  console.log('ok', file)
}

await shot('/', 'd4-01-home.png', 2500)
await shot('/cities', 'd4-02-cities.png', 1200)

await page.goto(base + '/cities', { waitUntil: 'networkidle' })
await page.waitForTimeout(600)
await page.locator('input[placeholder*="검색"]').fill('부산')
await page.waitForTimeout(800)
await page.screenshot({ path: `${out}/d4-03-search.png`, fullPage: true })
console.log('ok d4-03-search.png')

await shot('/weather/city_01', 'd4-04-detail-nubi.png', 1800)
await shot('/about', 'd4-05-about.png')
await shot('/guide', 'd4-06-guide.png')
await shot('/sports', 'd4-07-sports.png', 2500)
await shot('/health', 'd4-08-health.png', 2500)
await shot('/chat', 'd4-09-chat.png', 1000)
await shot('/kk', 'd4-10-404.png')

await page.goto(base + '/cities', { waitUntil: 'networkidle' })
await page.waitForTimeout(500)
const unitBtn = page.getByRole('button', { name: /단위/ })
if (await unitBtn.count()) {
  await unitBtn.first().click()
  await page.waitForTimeout(600)
}
await page.screenshot({ path: `${out}/d4-11-unit.png`, fullPage: true })
console.log('ok d4-11-unit.png')

await browser.close()
console.log('done')
