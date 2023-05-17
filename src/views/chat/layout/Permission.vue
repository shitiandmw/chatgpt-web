<script setup lang='ts'>
import { computed, ref } from 'vue'
import { NButton, NInput, NModal, useMessage } from 'naive-ui'
import { fetchVerify } from '@/api'
import { useAuthStore } from '@/store'
import Icon403 from '@/icons/403.vue'
import IconClose from '@/icons/close.vue'

interface Props {
  visible: boolean | undefined
  mode: number
}

defineProps<Props>()

const authStore = useAuthStore()

const ms = useMessage()

const loading = ref(false)
const token = ref('')

const disabled = computed(() => !token.value.trim() || loading.value)

async function handleVerify() {
  const secretKey = token.value.trim()

  if (!secretKey)
    return

  try {
    loading.value = true
    const { data } = await fetchVerify(secretKey) as any
    authStore.updToken(data)
    ms.success('success')
    window.location.reload()
  }
  catch (error: any) {
    ms.error(error.message ?? 'error')
    // authStore.removeToken()
    token.value = ''
  }
  finally {
    loading.value = false
  }
}

function handlePress(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    handleVerify()
  }
}
function updNeedStatus(status = true) {
  authStore.updNeedStatus(status)
}
function updNeedShare(status = true) {
  authStore.updNeedShare(status)
}
</script>

<template>
  <NModal :show="visible" style="width: 90%; max-width: 640px">
    <div class="p-10 bg-white rounded dark:bg-slate-800 relative">
      <IconClose v-if="mode === 2" class="absolute top-4 right-4 cursor-pointer w-5" @click="updNeedStatus(false)" />
      <div class="space-y-4">
        <header v-if="mode === 1" class="space-y-2">
          <Icon403 class="w-[200px] m-auto" />
          <h2 class="text-2xl font-bold text-center text-slate-800 dark:text-neutral-200">
            额度已用完
          </h2>
          <p class="text-base text-center text-slate-500 dark:text-slate-500">
            {{ $t('common.unauthorizedTips') }}
          </p>
        </header>
        <header v-else class="space-y-2">
          <h2 class="text-2xl font-bold text-center text-slate-800 dark:text-neutral-200">
            输入您的激活码
          </h2>
        </header>
        <NInput v-model:value="token" type="password" :placeholder="$t('common.tokenTips')" @keypress="handlePress" />
        <NButton
          block
          type="primary"
          :disabled="disabled"
          :loading="loading"
          @click="handleVerify"
        >
          {{ $t('common.verify') }}
        </NButton>
        <p class="text-base text-center text-slate-500 dark:text-slate-500">
          还没有激活码？<a class="text-orange-600 underline" href="https://www.houfaka.com/links/18D1CB7C" target="_blank">{{ $t('common.buy') }} </a>
          或 <span class=" text-rose-600 underline" href="javascript:void(0);" target="_blank" @click="updNeedShare"> 分享赚额度 </span>
        </p>
      </div>
    </div>
  </NModal>
</template>
