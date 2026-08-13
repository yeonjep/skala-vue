import { createRouter, createWebHistory } from 'vue-router'
import HubHomeView from '../views/HubHomeView.vue'

const routes = [
  {
    path: '/',
    name: 'HubHome',
    component: HubHomeView,
  },
  {
    //  전국 날씨 대시보드 — 컴포넌트·검색·스토어 통합 화면
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
    //  동적 경로 상세
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
    path: '/chat',
    name: 'Chatbot',
    component: () => import('../views/ChatbotView.vue'),
  },
  {
    path: '/sports',
    name: 'SportsNews',
    component: () => import('../views/SportsNewsView.vue'),
  },
  {
    path: '/health',
    name: 'HealthHub',
    component: () => import('../views/HealthHubView.vue'),
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
