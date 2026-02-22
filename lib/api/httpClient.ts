import axios from 'axios'
import { getToken, clearAuth } from './tokenStorage'

const httpClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Добавляем токен к каждому запросу
httpClient.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Обрабатываем ошибки глобально
httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status

    if (status === 401) {
      clearAuth()
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }

    // 403 и 500 пробрасываем дальше — обработка на уровне компонентов/сервисов
    return Promise.reject(error)
  }
)

export default httpClient