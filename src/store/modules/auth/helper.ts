import { ss } from '@/utils/storage'

const LOCAL_NAME = 'SECRET_TOKEN'

export function getToken() {
  let token = ss.get(LOCAL_NAME)
  if (token && typeof token === 'object')
    token = token.token
  return token
}

export function setToken(token: any) {
  if (token) {
    const code = token.token
    if (code)
      ss.set(LOCAL_NAME, code)
  }
}

export function removeToken() {
  return ss.remove(LOCAL_NAME)
}
