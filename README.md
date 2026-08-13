# 울산4반 Vue 4일차 종합실습 제출 — 박연제

## 제출 개요

| 항목    | 내용                                                                 |
| ------- | -------------------------------------------------------------------- |
| 반      | 울산4반                                                              |
| 제출자  | 박연제 (U116)                                                        |
| 제출일  | 2026-08-13                                                           |
| 과제    | Vue 종합실습 (Component · Router · Pinia · Axios · UI 고도화 · 배포) |
| 앱 이름 | **AeroCast**                                                         |

---

## 배포 주소

- **배포 URL:** https://yeonjep.github.io/skala-vue/
- **소스 레포:** https://github.com/yeonjep/skala-vue
- 배포 방식: GitHub Pages (`main` 푸시 → Actions 자동 빌드/배포)
- 챗봇 API Key(그록)는 로컬 .env 파일에 기록되어 제출 과제에는 공개되지 않았습니다. (로컬에서는 정상동작)

---

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

---

## 주요 URL

| 화면                          | 주소                |
| ----------------------------- | ------------------- |
| 홈 대시보드                   | `/`                 |
| 전국 날씨 (과제 3·4·5 실사용) | `/cities`           |
| 도시 상세 + 누비 캐릭터       | `/weather/:cityId`  |
| 날씨 가이드                   | `/guide`            |
| 서비스 소개                   | `/about`            |
| Groq 챗봇                     | `/chat`             |
| 운동 뉴스 (ESPN)              | `/sports`           |
| 건강 관리 (wger)              | `/health`           |
| 404                           | `/kk` 등 없는 주소  |
| Lab                           | `/lab/1` ~ `/lab/3` |

---

## 4일차 구현

**Axios 실연동 · UI 프레임워크(Element Plus) · 배포 · 추가 아이디어 페이지**를 구현했습니다.

### 1) UI 프레임워크 — Element Plus

교안의 UI 라이브러리 활용에 맞춰 **Element Plus**를 import 해 전역 등록했습니다.

- `main.js`에서 `import ElementPlus from 'element-plus'` + `app.use(ElementPlus)`
- 스타일: `element-plus/dist/index.css`
- 실제 사용 예
  - `ElMessage` — 홈 검색·즐겨찾기·에러 토스트
  - `el-skeleton` — 7일 예보 · Overview · 즐겨찾기 로딩 UI
- Lab: `/lab` 계열 `ElementPlus.vue` 연습 컴포넌트 (`ElMessageBox`, `el-card`, `el-button` 등)

### 2) 홈 대시보드 (`HubHomeView`)

- Open-Meteo 연동 **현재 날씨 · 7일 예보 · Overview 차트 · 세계 지도 · 즐겨찾기 · 강수 레이더**
- 대시보드 카드 **드래그로 자리 교체** (`localStorage`에 배치 저장)
- 카드 클릭 시 macOS 스타일 **상세 팝업** (닫기 / 최소화 / 최대화)

### 3) 월간 캘린더 · 날씨 아이콘

- 홈 하단 **월간 날씨 캘린더**에 SVG 날씨 아이콘 (`WeatherGlyph`) 적용

### 4) 날씨 상세 + 캐릭터 누비 (`WeatherBuddy`)

- `/weather/:cityId` 상세에서 기온·습도·강수 등에 따라 표정·모션이 바뀌는 **누비** 캐릭터

### 5) Axios + 외부 API

| API        | 용도                                             |
| ---------- | ------------------------------------------------ |
| Open-Meteo | 현재/예보 · 월간 · 대기질 · 지오코딩 · 기후      |
| wttr.in    | Open-Meteo 실패 시 폴백                          |
| RainViewer | 홈 대시보드 강수 레이더                          |
| CartoCDN   | Leaflet 지도 타일 (세계 지도 · 레이더 배경)      |
| ESPN       | `/sports` 축구 순위·스코어·뉴스 (배포 시 스냅샷) |
| wger.de    | `/health` 운동 라이브러리 · BMI                  |
| Groq       | `/chat` AI 챗봇 (`VITE_GROQ_API_KEY`)            |

### 6) 사이드 레일 (`HubSideRail`)

- 홈 / 챗봇 / 운동 뉴스 / 건강 관리 바로가기
- 호버 펼침 · 드래그로 상·하·좌·우 도킹

### 7) 지도 라이브러리

- **Leaflet**으로 세계 지도 · 강수 레이더 표시

### 8) 배포

- `npm run build` + **GitHub Pages** 자동 배포 (`main` 푸시 → Actions)

---

## 프로젝트 구조 (핵심)

```
src/
├─ App.vue / HubSideRail.vue
├─ api/          openMeteo · rainViewer · espnFootball · healthApi · groq
├─ components/
│  ├─ dashboard/   CurrentWeatherHero · SevenDayForecast · Overview …
│  ├─ weather/     WeatherBuddy · WeatherGlyph
│  └─ exercise/    WeatherParent · SearchBar · WeatherCard …
├─ stores/       configStore · weatherStore
├─ views/        HubHome · Weather* · Chatbot · Sports · Health …
└─ router/index.js
```

---

## 스크린샷

> `screenshots/d4-*.png`

### 1. 홈 대시보드

![홈](./screenshots/d4-01-home.png)

### 2. 전국 날씨 (`/cities`)

![날씨](./screenshots/d4-02-cities.png)

### 3. 검색 + URL 쿼리

![검색](./screenshots/d4-03-search.png)

### 4. 도시 상세 + 누비

![상세](./screenshots/d4-04-detail-nubi.png)

### 5. 소개 / 가이드

![소개](./screenshots/d4-05-about.png)

![가이드](./screenshots/d4-06-guide.png)

### 6. 운동 뉴스

![운동](./screenshots/d4-07-sports.png)

### 7. 건강 관리

![건강](./screenshots/d4-08-health.png)

### 8. Groq 챗봇

![챗봇](./screenshots/d4-09-chat.png)

### 9. 404

![404](./screenshots/d4-10-404.png)

### 10. 단위 변경 (화씨)

![단위](./screenshots/d4-11-unit.png)

---

## 본인 아이디어

1. **사이드 레일 도킹 UI** — 드래그 + 호버 확장
2. **대시보드 카드 드래그 정렬** — localStorage 저장
3. **날씨 캐릭터 누비** — 상태에 따른 SVG 모션
4. **운동 뉴스 · 건강 허브** — ESPN / wger API + 캐러셀
5. **Groq 챗봇** — 환경변수 API 키 (`VITE_GROQ_API_KEY`)

---

## Vue 과정 과제 파일 위치

> 과제는 **2일차부터**입니다. 아래 파일은 구현 중 삭제하지 않았고 레포에 그대로 있습니다.

| 일차         | 내용                                 | 주요 파일                                                                                                           | 확인 경로                                      |
| ------------ | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| 2일차        | Mockup · Composition                 | `WeatherMockup.vue` · `WeatherComposition.vue`                                                                      | `/lab/1`, `/lab/2`                             |
| 3일차        | Component · Router · Pinia           | `WeatherParent` · SearchBar/WeatherCard · `router/index.js` · `configStore`/`weatherStore` · UnitToggler/StorePanel | `/lab/3`, `/cities`, `/weather/:cityId`, `/kk` |
| 4일차 (오늘) | Axios · Element Plus · 배포 · 보너스 | `src/api/*` · `main.js`(Element Plus) · sports/health/chat · GitHub Pages                                           | `/`, `/sports`, `/health`, `/chat`             |
