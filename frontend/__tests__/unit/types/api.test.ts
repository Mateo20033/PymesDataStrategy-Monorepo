import { describe, it, expect } from 'vitest'
import type { TransformationType, DatasetStatus, JobStatus, TransformDatasetDto, ApiAnomaly, SubmitDecisionsDto } from '@/types/api'

describe('API Types', () => {
  it('TransformationType includes all 6 valid values', () => {
    const validTypes: TransformationType[] = [
      'CLEAN_NULLS',
      'NORMALIZE',
      'AGGREGATE',
      'FILTER',
      'MERGE',
      'CUSTOM',
    ]
    expect(validTypes).toHaveLength(6)
  })

  it('DatasetStatus includes all valid values', () => {
    const validStatuses: DatasetStatus[] = ['PENDING', 'PROCESSING', 'READY', 'ERROR', 'ARCHIVED']
    expect(validStatuses).toHaveLength(5)
  })

  it('JobStatus includes all valid values', () => {
    const validStatuses: JobStatus[] = ['QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED']
    expect(validStatuses).toHaveLength(5)
  })

  it('TransformDatasetDto accepts valid shape', () => {
    const dto: TransformDatasetDto = {
      transformationType: 'CLEAN_NULLS',
      parameters: { column: 'name' },
      priority: 5,
    }
    expect(dto.transformationType).toBe('CLEAN_NULLS')
    expect(dto.priority).toBe(5)
  })

  it('TransformDatasetDto works without optional fields', () => {
    const dto: TransformDatasetDto = {
      transformationType: 'NORMALIZE',
    }
    expect(dto.transformationType).toBe('NORMALIZE')
    expect(dto.parameters).toBeUndefined()
    expect(dto.priority).toBeUndefined()
  })

  it('ApiAnomaly accepts all anomaly types', () => {
    const types: ApiAnomaly['type'][] = ['MISSING_VALUE', 'OUTLIER', 'FORMAT_ERROR', 'DUPLICATE']
    expect(types).toHaveLength(4)
  })

  it('ApiAnomaly status can be PENDING or RESOLVED', () => {
    const statuses: ApiAnomaly['status'][] = ['PENDING', 'RESOLVED']
    expect(statuses).toHaveLength(2)
  })

  it('ApiAnomaly accepts valid shape with all fields', () => {
    const anomaly: ApiAnomaly = {
      id: 'anom-1',
      datasetId: 'ds-1',
      column: 'email',
      row: 42,
      type: 'MISSING_VALUE',
      description: '5 missing values',
      originalValue: 'old@example.com',
      suggestedValue: 'default@example.com',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    expect(anomaly.id).toBe('anom-1')
    expect(anomaly.type).toBe('MISSING_VALUE')
    expect(anomaly.status).toBe('PENDING')
  })

  it('ApiAnomaly accepts optional decision field', () => {
    const anomaly: ApiAnomaly = {
      id: 'anom-2',
      datasetId: 'ds-1',
      column: 'phone',
      type: 'FORMAT_ERROR',
      description: 'Bad format',
      status: 'RESOLVED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      decision: {
        id: 'dec-1',
        anomalyId: 'anom-2',
        action: 'CORRECTED',
        correction: '+1-555-0100',
        userId: 'user-1',
        createdAt: new Date().toISOString(),
      },
    }
    expect(anomaly.decision?.action).toBe('CORRECTED')
  })

  it('SubmitDecisionsDto accepts decisions array', () => {
    const dto: SubmitDecisionsDto = {
      decisions: [
        { anomalyId: 'anom-1', action: 'APPROVED' },
        { anomalyId: 'anom-2', action: 'CORRECTED', correction: 'fix' },
        { anomalyId: 'anom-3', action: 'DISCARDED' },
      ],
    }
    expect(dto.decisions).toHaveLength(3)
    expect(dto.decisions[0]?.action).toBe('APPROVED')
    expect(dto.decisions[1]?.correction).toBe('fix')
  })
})

