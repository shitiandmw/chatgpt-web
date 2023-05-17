import type { App } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHashHistory } from 'vue-router'
import { setupPageGuard } from './permission'
import { ChatLayout } from '@/views/chat/layout'

const routes: RouteRecordRaw[] = [
  {
    path: '/:share?',
    name: 'Root',
    component: ChatLayout,
    redirect: (to) => {
      // 方法接收目标路由作为参数
      // return 重定向的字符串路径/路径对象
      return { path: '/chat', query: { share: to.params.share } }
    },
    // redirect: (to) => {
    //   // 方法接收目标路由作为参数
    //   // return 重定向的字符串路径/路径对象
    //   return { path: '/chat', params: { share: '11111' } }

    // },
    children: [
      {
        path: '/chat/:uuid?',
        name: 'Chat',
        component: () => import('@/views/chat/index.vue'),
      },
    ],
  },

  {
    path: '/404',
    name: '404',
    component: () => import('@/views/exception/404/index.vue'),
  },

  {
    path: '/500',
    name: '500',
    component: () => import('@/views/exception/500/index.vue'),
  },

  {
    path: '/:pathMatch(.*)*',
    name: 'notFound',
    redirect: '/404',
  },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ left: 0, top: 0 }),
})

setupPageGuard(router)

export async function setupRouter(app: App) {
  app.use(router)
  await router.isReady()
}
