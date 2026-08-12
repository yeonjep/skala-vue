import { chromium } from 'playwright'

const base = process.env.BASE_URL || 'http://localhost:3001'
const out = 'screenshots'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

async function shot(path, file, waitMs = 800) {
  await page.goto(base + path, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(waitMs)
  await page.screenshot({ path: `${out}/${file}`, fullPage: true })
  console.log('ok', file)
}

await shot('/', 'd345-01-home.png', 1200)
await shot('/cities', 'd345-02-cities.png')

await page.goto(base + '/cities', { waitUntil: 'networkidle' })
await page.waitForTimeout(500)
await page.locator('input[placeholder*="검색"]').fill('부산')
await page.waitForTimeout(700)
await page.screenshot({ path: `${out}/d345-03-search-query.png`, fullPage: true })
console.log('ok d345-03-search-query.png')

await shot('/weather/city_01', 'd345-04-detail.png')
await shot('/about', 'd345-05-about.png')
await shot('/guide', 'd345-06-guide.png')
await shot('/kk', 'd345-07-404.png')

await page.goto(base + '/cities', { waitUntil: 'networkidle' })
await page.waitForTimeout(500)
await page.getByRole('button', { name: '단위변경' }).click()
await page.waitForTimeout(600)
await page.screenshot({ path: `${out}/d345-08-unit-fahrenheit.png`, fullPage: true })
console.log('ok d345-08-unit-fahrenheit.png')

await page.goto(base + '/cities', { waitUntil: 'networkidle' })
await page.waitForTimeout(500)
await page.locator('.favorite-btn').first().click()
await page.waitForTimeout(500)
await page.screenshot({ path: `${out}/d345-09-favorite.png`, fullPage: true })
console.log('ok d345-09-favorite.png')

await browser.close()
