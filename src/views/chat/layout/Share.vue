<script setup lang='ts'>
import { onMounted, ref } from 'vue'
import { NModal, useMessage } from 'naive-ui'
import QRCode from 'qrcode'
import { fetchShare, fetchShareList } from '@/api'
import IconClose from '@/icons/close.vue'
import { useAuthStore } from '@/store'
interface Props {
  visible: boolean | undefined
}

defineProps<Props>()

const ms = useMessage()

const share_link = ref('')
const qrCodeCanvas = ref(null)

const authStore = useAuthStore()
const shareList = ref({
  firstLoading: true,
  loading: false,
  list: [],
  total: 0,
  page: 1,
})

onMounted(async () => {
  await handleVerify()
  await generateQRCode()
  await getShareList()
})
async function generateQRCode() {
  try {
    await QRCode.toCanvas(qrCodeCanvas.value, share_link.value)
  }
  catch (error) {
    console.error('Error generating QR code:', error)
  }
}
async function handleVerify() {
  try {
    const { data } = await fetchShare() as any
    share_link.value = `${window.location.protocol}//${window.location.host}/#/${data}`
  }
  catch (error: any) {
    ms.error(error.message ?? 'error')
  }
}
async function updNeedShare(status = true) {
  authStore.updNeedShare(status)
}

async function getShareList(action: string | null = null) {
  try {
    if (shareList.value.loading)
      return
    shareList.value.loading = true
    if (action === 'next')
      shareList.value.page++
    else if (action === 'prev')
      shareList.value.page--

    if (shareList.value.page < 1)
      shareList.value.page = 1
    const { data } = await fetchShareList(shareList.value.page) as any

    if (data) {
      shareList.value.list = data.list
      shareList.value.total = data.total
    }
  }
  catch (error: any) {
    ms.error(error.message ?? 'error')
  }
  finally {
    shareList.value.loading = false
    shareList.value.firstLoading = false
  }
}
</script>

<template>
  <NModal :show="visible" style="width: 90%; max-width: 640px">
    <div class="p-10 bg-white rounded dark:bg-slate-800 relative">
      <IconClose class="absolute top-4 right-4 cursor-pointer w-5" @click="updNeedShare(false)" />
      <div class="space-y-4">
        <header class="space-y-2">
          <h2 class="text-2xl font-bold text-center text-slate-800 dark:text-neutral-200">
            分享赚额度
          </h2>
          <p class="text-base text-center text-slate-700 dark:text-slate-500">
            将您的二维码或分享链接发送给好友，每增加1位好友通过您的二维码或分享链接成功体验chatgpt，您将获得<b class=" text-red-600">￥1</b>使用额度。
          </p>
        </header>
        <div class="flex border-t border-gray-100 mt-4 pt-6">
          <div class="w-28">
            分享链接：
          </div>
          <div class="flex-1">
            {{ share_link }}
          </div>
        </div>
        <div class="flex  border-gray-100 mt-4 pt-6 items-center">
          <div class="w-28">
            分享二维码：
          </div>
          <div class="flex-1">
            <canvas ref="qrCodeCanvas" />
          </div>
        </div>

        <div class="border-t border-gray-100 mt-4 pt-6 items-center">
          <div class="text-xl border-l-4 border-[#4b9e5f] pl-2 mb-3">
            分享列表
          </div>
          <div v-if="shareList.firstLoading || shareList.loading" class="loading text-center flex items-center justify-center text-gray-700">
            <div class="loading w-5 h-5 border-2 border-transparent border-t-gray-300 border-b-gray-300 rounded-full animate-spin mr-2" />
            &nbsp;加载中...
          </div>
          <template v-else>
            <div v-if="shareList.total <= 0" class="">
              <div class=" align-center">
                <!-- <img src="@/assets/no_share.png" alt="" class="w-[260px]" srcset=""> -->
                <div class="">
                  还没有分享记录哦~
                </div>
              </div>
            </div>
            <div v-else class=" space-y-3">
              <template v-for="(item, index) in shareList.list" :key="`row${index}`">
                <div class="flex">
                  <div class="flex-1">
                    <div class="text-md font-bold">
                      {{ item.code }}
                    </div>
                    <div class="text-xs text-gray-500">
                      {{ item.time }}
                    </div>
                  </div>
                  <span v-if="item.status == 0" class="text-gray-500">未完成体验</span>
                  <span v-else class="text-[#4b9e5f]">已发放奖励</span>
                </div>
              </template>
              <div class="page flex justify-between">
                <button v-if="shareList.page > 1" class="h-6 border border-gray-900 rounded text-xs flex items-center justify-center px-2 text-gray-900 cursor-pointer enabled" @click="getShareList('prev')">
                  上一页
                </button>
                <button v-else class="h-6 border border-gray-300 rounded text-xs flex items-center justify-center px-2 text-gray-300 cursor-pointer enabled">
                  上一页
                </button>
                <button v-if=" ((shareList.page - 1) * 10 + shareList.list.length) < shareList.total" class="h-6 border border-gray-900 rounded text-xs flex items-center justify-center px-2 text-gray-900 cursor-pointer" @click="getShareList('next')">
                  下一页
                </button>
                <button v-else class="h-6 border border-gray-300 rounded text-xs flex items-center justify-center px-2 text-gray-300 cursor-pointer">
                  下一页
                </button>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </NModal>
</template>
