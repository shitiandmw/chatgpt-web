import type { Router } from 'vue-router'
import { useAuthStoreWithout } from '@/store/modules/auth'
import { ss } from '@/utils/storage'

export function setupPageGuard(router: Router) {
  router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStoreWithout()
    try {
      if (to.query.share)
        ss.set('SHARE', to.query.share)

      await authStore.getToken('/chat-process')
      next()
    }
    catch (error) {
      if (to.path !== '/500')
        next({ name: '500' })
      else
        next()
    }
  })
}
