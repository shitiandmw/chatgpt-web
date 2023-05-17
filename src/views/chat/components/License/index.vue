<script lang="ts" setup>
import { computed, nextTick } from "vue";
import { useAuthStore} from "@/store";

defineProps<Props>();
const authStore = useAuthStore();
const tokenInfo = computed(() => authStore.token);
interface Props {
}

function updNeedStatus() {
  authStore.updNeedStatus(true)
}
function updNeedShare() {
  authStore.updNeedShare(true)
}
</script>

<template>
  <div v-if="tokenInfo" class="border-gray-100 p-4 -mt-5">
    <div
      class="w-full text-gray-500 text-sm mt-2 border-t border-gray-300 py-2"
    >
      当前激活码:<b
        >{{ tokenInfo.type === 0 ? "赠" : "" }}{{ tokenInfo.code }}</b
      >
    </div>
    <div class="h-2 rounded-xl bg-gray-200 w-full relative">
      <div
        class="h-2 rounded-xl bg-green-500 absolute left-0 top-0 text-sm text-white text-center z-0"
        :style="{
          width: `${
            ((tokenInfo.total - tokenInfo.used) / tokenInfo.total) * 100
          }%`,
        }"
      />
    </div>
    <div class="w-full text-gray-500 text-xs flex justify-between">
      <div>
        ￥{{ ((tokenInfo.total - tokenInfo.used) / 100000).toFixed(2) }}/{{
          (tokenInfo.total / 100000).toFixed(2)
        }}
      </div>
      <div>
        剩余额度:{{
          (
            ((tokenInfo.total - tokenInfo.used) / tokenInfo.total) *
            100
          ).toFixed(2)
        }}%
      </div>
    </div>
    <div class="flex justify-between mt-3">
      <div
        class="h-6 bg-green-600 rounded text-xs flex items-center justify-center px-2 text-white cursor-pointer"
        @click="updNeedStatus"
      >
        修改
      </div>
      <a
        href="https://www.houfaka.com/links/18D1CB7C"
        target="_blank"
        class="h-6 bg-orange-600 rounded text-xs flex items-center justify-center px-2 text-white cursor-pointer"
      >
        购买
      </a>
      <div @click="updNeedShare" target="_blank" class="h-6 bg-rose-600 rounded text-xs flex items-center justify-center px-2 text-white cursor-pointer">
        分享赚额度
      </div>
    </div>
    <!-- <h2 class="overflow-hidden font-bold text-md text-ellipsis whitespace-nowrap">
      {{ tokenInfo.code ?? '--' }}
    </h2> -->
  </div>
</template>
