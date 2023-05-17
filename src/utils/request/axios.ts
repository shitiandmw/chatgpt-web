import axios, { type AxiosResponse } from 'axios'
import { useAuthStore } from '@/store'
import { ss } from '@/utils/storage'

const service = axios.create({
  baseURL: import.meta.env.VITE_GLOB_API_URL,
})

service.interceptors.request.use(
  async (config) => {
    const deviceId = await useAuthStore().getDeviceId()
    const token = await useAuthStore().getToken(config.url)
    const share = ss.get('SHARE')
    if (share)
      config.headers.Share = share

    if (deviceId)
      config.headers.DeviceId = deviceId
    if (token)
      config.headers.Authorization = `${token.token}`
    return config
  },
  (error) => {
    return Promise.reject(error.response)
  },
)

service.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => {
    if (response.status === 200)
      return response

    throw new Error(response.status.toString())
  },
  (error) => {
    return Promise.reject(error)
  },
)

export default service
