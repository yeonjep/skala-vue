import { createRouter, createWebHistory } from 'vue-router'
import HubHomeView from '../views/HubHomeView.vue'

const routes = [
  {
    path: '/',
    name: 'HubHome',
    component: HubHomeView,
  },
  {
    // [4·5일차] 전국 날씨 대시보드 — 컴포넌트·검색·스토어 통합 화면
    path: '/cities',
    name: 'WeatherHome',
    component: () => import('../views/WeatherHomeView.vue'),
  },
  {
    path: '/about',
    name: 'WeatherAbout',
    component: () => import('../views/WeatherAboutView.vue'),
  },
  {
    // [4일차] 동적 경로 상세
    path: '/weather/:cityId',
    name: 'WeatherDetail',
    component: () => import('../views/WeatherDetailView.vue'),
  },
  {
    path: '/guide',
    name: 'WeatherGuide',
    component: () => import('../views/WeatherGuideView.vue'),
  },
  {
    path: '/lab/:day',
    name: 'LabDay',
    component: () => import('../views/AssignmentDayView.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFoundView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
