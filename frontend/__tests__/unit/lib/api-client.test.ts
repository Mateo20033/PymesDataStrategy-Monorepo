import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '@/lib/api-client'

const mockFetch = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch)
  mockFetch.mockReset()
})

describe('apiClient', () => {
  describe('get', () => {
    it('sends GET request with x-user-id header', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [] }),
      })

      await apiClient.get('http://localhost:3000/api/v1/datasets', 'user-001')

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/datasets',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({ 'x-user-id': 'user-001' }),
        })
      )
    })

    it('uses default user-id when none provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [] }),
      })

      await apiClient.get('http://localhost:3000/api/v1/datasets')

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/datasets',
        expect.objectContaining({
          headers: expect.objectContaining({ 'x-user-id': 'user-001' }),
        })
      )
    })

    it('throws on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Not Found', message: 'Dataset not found', statusCode: 404 }),
      })

      await expect(
        apiClient.get('http://localhost:3000/api/v1/datasets/999')
      ).rejects.toThrow('Dataset not found')
    })

    it('throws statusText when error body has no message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => { throw new Error('bad json') },
      })

      await expect(
        apiClient.get('http://localhost:3000/api/v1/datasets')
      ).rejects.toThrow('Internal Server Error')
    })
  })

  describe('post', () => {
    it('sends POST with JSON body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ id: 'abc' }),
      })

      const body = { transformationType: 'CLEAN_NULLS' }
      await apiClient.post('http://localhost:3000/api/v1/datasets/abc/transform', body)

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/datasets/abc/transform',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(body),
        })
      )
    })

    it('includes Content-Type application/json for POST', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ id: 'abc' }),
      })

      await apiClient.post('http://localhost:3000/api/v1/datasets/abc/transform', {})

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        })
      )
    })
  })

  describe('delete', () => {
    it('sends DELETE request', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 204 })

      await apiClient.delete('http://localhost:3000/api/v1/datasets/abc')

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/datasets/abc',
        expect.objectContaining({ method: 'DELETE' })
      )
    })

    it('returns undefined for 204 No Content', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 204 })

      const result = await apiClient.delete('http://localhost:3000/api/v1/datasets/abc')

      expect(result).toBeUndefined()
    })
  })
})
