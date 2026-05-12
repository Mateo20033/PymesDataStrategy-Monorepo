import { describe, it, expect } from 'vitest'
import { API_ENDPOINTS } from '@/lib/api-endpoints'

describe('API_ENDPOINTS', () => {
  describe('datasets', () => {
    it('list returns correct URL', () => {
      expect(API_ENDPOINTS.datasets.list()).toContain('/api/v1/datasets')
    })

    it('create returns correct URL', () => {
      expect(API_ENDPOINTS.datasets.create()).toContain('/api/v1/datasets')
    })

    it('get returns URL with id', () => {
      expect(API_ENDPOINTS.datasets.get('abc123')).toContain('/api/v1/datasets/abc123')
    })

    it('delete returns URL with id', () => {
      expect(API_ENDPOINTS.datasets.delete('abc123')).toContain('/api/v1/datasets/abc123')
    })

    it('transform returns URL with id', () => {
      expect(API_ENDPOINTS.datasets.transform('abc123')).toContain('/api/v1/datasets/abc123/transform')
    })

    it('download returns URL with id', () => {
      expect(API_ENDPOINTS.datasets.download('abc123')).toContain('/api/v1/datasets/abc123/download')
    })
  })

  describe('jobs', () => {
    it('get returns URL with jobId', () => {
      expect(API_ENDPOINTS.jobs.get('job-xyz')).toContain('/api/v1/jobs/job-xyz')
    })
  })

  describe('anomalies', () => {
    it('list returns URL with datasetId', () => {
      expect(API_ENDPOINTS.anomalies.list('ds-123')).toContain('/api/v1/datasets/ds-123/anomalies')
    })

    it('submitDecisions returns URL with datasetId', () => {
      expect(API_ENDPOINTS.anomalies.submitDecisions('ds-123')).toContain('/api/v1/datasets/ds-123/decisions')
    })
  })
})

