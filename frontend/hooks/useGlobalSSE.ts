import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useQueryClient } from '@tanstack/react-query'

const EVENTS_URL = '/api/v1/events'
const RECONNECT_DELAY_MS = 5_000

interface DatasetStatusChangedEvent {
  datasetId: string
  status: string
}

interface DatasetAnomaliesReadyEvent {
  datasetId: string
}

/**
 * Subscribes to the global workspace SSE stream at GET /api/v1/events.
 *
 * Reacts to:
 *   - `dataset:status_changed` → invalidates ['datasets'] and ['stats']
 *   - `dataset:anomalies_ready` → invalidates ['anomalies', datasetId]
 *
 * Reconnects automatically on error with a fixed delay.
 * Tears down the connection when the component unmounts.
 *
 * Usage: call once at the top of DashboardPage (or any layout component).
 */
export function useGlobalSSE(): void {
  const { data: session } = useSession()
  const token = session?.accessToken
  const queryClient = useQueryClient()
  // Stable ref so event handlers never go stale across re-renders
  const tokenRef = useRef(token)
  useEffect(() => {
    tokenRef.current = token
  }, [token])

  useEffect(() => {
    if (!token) return

    let es: EventSource | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let destroyed = false

    const connect = (): void => {
      if (destroyed) return

      const url = `${EVENTS_URL}?token=${token}`
      es = new EventSource(url)

      es.addEventListener('dataset:status_changed', (e: MessageEvent<string>) => {
        try {
          const data = JSON.parse(e.data) as DatasetStatusChangedEvent
          void queryClient.invalidateQueries({ queryKey: ['datasets'] })
          void queryClient.invalidateQueries({ queryKey: ['stats'] })
          console.debug('[GlobalSSE] dataset:status_changed', data)
        } catch {
          // Malformed frame — ignore
        }
      })

      es.addEventListener('dataset:anomalies_ready', (e: MessageEvent<string>) => {
        try {
          const data = JSON.parse(e.data) as DatasetAnomaliesReadyEvent
          void queryClient.invalidateQueries({ queryKey: ['anomalies', data.datasetId] })
          console.debug('[GlobalSSE] dataset:anomalies_ready', data)
        } catch {
          // Malformed frame — ignore
        }
      })

      es.addEventListener('timeout', () => {
        // Server closed the stream after the hard limit — reconnect
        es?.close()
        if (!destroyed) {
          reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS)
        }
      })

      es.addEventListener('error', () => {
        es?.close()
        if (!destroyed) {
          reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS)
        }
      })
    }

    connect()

    return () => {
      destroyed = true
      if (reconnectTimer !== null) clearTimeout(reconnectTimer)
      es?.close()
    }
  }, [token, queryClient])
}
