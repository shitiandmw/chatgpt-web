<script setup lang='ts'>
import { computed } from 'vue'
import { NLayout, NLayoutContent } from 'naive-ui'
import { useRouter } from 'vue-router'
import Sider from './sider/index.vue'
import Permission from './Permission.vue'
import Share from './Share.vue'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { useAppStore, useAuthStore, useChatStore } from '@/store'

const router = useRouter()
const appStore = useAppStore()
const chatStore = useChatStore()
const authStore = useAuthStore()

router.replace({ name: 'Chat', params: { uuid: chatStore.active } })

const { isMobile } = useBasicLayout()

const collapsed = computed(() => appStore.siderCollapsed)

const needPermission = computed(() => !authStore.token || !authStore.token.is_use)
const needUpdToken = computed(() => authStore.need_upd_token)
const needShare = computed(() => authStore.need_share)

// const needPermission = true

const getMobileClass = computed(() => {
  if (isMobile.value)
    return ['rounded-none', 'shadow-none']
  return ['border', 'rounded-md', 'shadow-md', 'dark:border-neutral-800']
})

const getContainerClass = computed(() => {
  return [
    'h-full',
    { 'pl-[260px]': !isMobile.value && !collapsed.value },
  ]
})
</script>

<template>
  <div class="h-full dark:bg-[#24272e] transition-all" :class="[isMobile ? 'p-0' : 'p-4']">
    <div class="h-full overflow-hidden" :class="getMobileClass">
      <NLayout class="z-40 transition" :class="getContainerClass" has-sider>
        <Sider />
        <NLayoutContent class="h-full">
          <RouterView v-slot="{ Component, route }">
            <component :is="Component" :key="route.fullPath" />
          </RouterView>
        </NLayoutContent>
      </NLayout>
    </div>
    <Permission :visible="needPermission" :mode="1" />
    <Permission :visible="needUpdToken" :mode="2" />
    <Share v-if="needShare" :visible="needShare" />
  </div>
</template>
