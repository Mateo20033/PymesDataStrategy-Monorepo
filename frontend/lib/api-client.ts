import type { ApiError } from '@/types/api'

const DEFAULT_USER_ID = 'user-001' // temporal — fallback para tests sin auth

async function request<T>(
  url: string,
  options: RequestInit = {},
  tokenOrUserId?: string
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  }

  // Si el valor parece un JWT (contiene puntos), lo enviamos como Bearer token
  // Si no, lo tratamos como x-user-id (compatibilidad hacia atrás y tests)
  if (tokenOrUserId && tokenOrUserId.includes('.')) {
    headers['Authorization'] = `Bearer ${tokenOrUserId}`
  } else {
    headers['x-user-id'] = tokenOrUserId ?? DEFAULT_USER_ID
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(url, { ...options, headers })

  if (!res.ok) {
    let errorBody: ApiError
    try {
      errorBody = await res.json()
    } catch {
      errorBody = { error: 'Unknown error', message: res.statusText, statusCode: res.status }
    }
    throw new Error(errorBody.message ?? res.statusText)
  }

  // 204 No Content
  if (res.status === 204) return undefined as T

  return res.json() as Promise<T>
}

export const apiClient = {
  get: <T>(url: string, accessToken?: string) =>
    request<T>(url, { method: 'GET' }, accessToken),

  post: <T>(url: string, body: unknown, accessToken?: string) =>
    request<T>(url, { method: 'POST', body: JSON.stringify(body) }, accessToken),

  postForm: <T>(url: string, formData: FormData, accessToken?: string) =>
    request<T>(url, { method: 'POST', body: formData }, accessToken),

  patch: <T>(url: string, body: unknown, accessToken?: string) =>
    request<T>(url, { method: 'PATCH', body: JSON.stringify(body) }, accessToken),

  delete: <T>(url: string, accessToken?: string) =>
    request<T>(url, { method: 'DELETE' }, accessToken),
}
