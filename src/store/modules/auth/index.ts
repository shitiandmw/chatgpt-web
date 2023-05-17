import { defineStore } from 'pinia'
import { v4 as uuidv4 } from 'uuid'
import { getToken, removeToken, setToken } from './helper'
import { fetchToken } from '@/api'
import { store } from '@/store'
import { ss } from '@/utils/storage'

interface SessionResponse {
  auth: boolean
  model: 'ChatGPTAPI' | 'ChatGPTUnofficialProxyAPI'
}

interface TokenResponse {
  token: string | undefined
  total: number
  used: number
  code: string | undefined
  is_use: boolean
  type: number
}

export interface AuthState {
  code: string | undefined
  token: TokenResponse | null
  session: SessionResponse | null
  need_upd_token: boolean | undefined
  need_share: boolean | undefined
}

export const useAuthStore = defineStore('auth-store', {
  state: (): AuthState => ({
    code: getToken(),
    token: null,
    session: null,
    need_upd_token: false,
    need_share: false,
  }),

  getters: {
    isChatGPTAPI(state): boolean {
      return state.session?.model === 'ChatGPTAPI'
    },
  },

  actions: {
    async getDeviceId() {
      let deviceId = ss.get('deviceId')
      if (!deviceId) {
        deviceId = uuidv4()
        ss.set('deviceId', deviceId)
      }
      return deviceId
    },

    async updNeedStatus(status: boolean) {
      this.need_upd_token = status
    },
    async updNeedShare(status: boolean) {
      this.need_share = status
    },

    async getSession() {
      try {
        // const { data } = await fetchSession<SessionResponse>()
        // this.session = { ...data }
        const data = { auth: true, model: 'ChatGPTAPI' } as SessionResponse
        this.session = { ...data }
        return Promise.resolve(data)
      }
      catch (error) {
        return Promise.reject(error)
      }
    },
    async getToken(url: string | undefined) {
      if (!this.token && url && url !== '/token-ephemeral') {
        try {
          const res = await fetchToken(this.code)
          this.updToken(res.data)
          return Promise.resolve(res.data)
        }
        catch (error) {
          console.error('error', error)
          return Promise.reject(error)
        }
      }
      else { return Promise.resolve(this.token) }
    },

    updToken(token: TokenResponse | null) {
      this.token = token
      if (token)
        this.code = token.token
      setToken(token)
    },

    updUsed(used: number | undefined) {
      if (this.token) {
        this.token.used = used || 0
        this.token.is_use = (this.token.total - this.token.used > 0)
      }
    },

    removeToken() {
      this.token = null
      removeToken()
    },
  },
})

export function useAuthStoreWithout() {
  return useAuthStore(store)
}
