const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

export const API_ENDPOINTS = {
  auth: {
    register: () => `${BASE}/api/v1/auth/register`,
    login: () => `${BASE}/api/v1/auth/login`,
    me: () => `${BASE}/api/v1/users/me`,
    updateMe: () => `${BASE}/api/v1/users/me`,
  },
  datasets: {
    list: () => `${BASE}/api/v1/datasets`,
    create: () => `${BASE}/api/v1/datasets`,
    get: (id: string) => `${BASE}/api/v1/datasets/${id}`,
    delete: (id: string) => `${BASE}/api/v1/datasets/${id}`,
    transform: (id: string) => `${BASE}/api/v1/datasets/${id}/transform`,
    download: (id: string) => `${BASE}/api/v1/datasets/${id}/download`,
    stream: (id: string, token: string) => `${BASE}/api/v1/datasets/${id}/stream?token=${encodeURIComponent(token)}`,
  },
  jobs: {
    get: (jobId: string) => `${BASE}/api/v1/jobs/${jobId}`,
    events: (jobId: string) => `${BASE}/api/v1/jobs/${jobId}/events`,
  },
  anomalies: {
    list: (datasetId: string) => `${BASE}/api/v1/datasets/${datasetId}/anomalies`,
    submitDecisions: (datasetId: string) => `${BASE}/api/v1/datasets/${datasetId}/decisions`,
    parseInstruction: (datasetId: string, anomalyId: string) =>
      `${BASE}/api/v1/datasets/${datasetId}/anomalies/${anomalyId}/parse-instruction`,
  },
  stats: {
    list: () => `${BASE}/api/v1/stats`,
  },
} as const
