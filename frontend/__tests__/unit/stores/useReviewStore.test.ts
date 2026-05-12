import { describe, it, expect, beforeEach } from 'vitest'
import { useReviewStore } from '@/store/useReviewStore'
import type { Anomaly } from '@/types/anomaly'
import { REVIEW_ACTION, ANOMALY_TYPE } from '@/types/anomaly'

const createMockAnomaly = (overrides: Partial<Anomaly> = {}): Anomaly => ({
  id: 'ano-1',
  datasetId: 'ds-1',
  type: ANOMALY_TYPE.FILL_NULLS,
  column: 'email',
  affectedRows: 10,
  sampleValues: ['null', '', 'undefined'],
  suggestedFix: 'Fill with default value',
  confidence: 0.95,
  action: REVIEW_ACTION.PENDING,
  ...overrides,
})

describe('useReviewStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useReviewStore.getState().resetReview()
  })

  describe('setAnomalies', () => {
    it('should set anomalies and reset index to 0', () => {
      // Arrange
      const anomalies = [
        createMockAnomaly({ id: 'ano-1' }),
        createMockAnomaly({ id: 'ano-2' }),
      ]
      // Set a non-zero index first
      useReviewStore.setState({ currentAnomalyIndex: 5 })

      // Act
      useReviewStore.getState().setAnomalies(anomalies)

      // Assert
      expect(useReviewStore.getState().anomalies).toHaveLength(2)
      expect(useReviewStore.getState().currentAnomalyIndex).toBe(0)
    })
  })

  describe('approveAnomaly', () => {
    it('should set action to APPROVED', () => {
      // Arrange
      const anomaly = createMockAnomaly({ id: 'ano-1' })
      useReviewStore.setState({ anomalies: [anomaly] })

      // Act
      useReviewStore.getState().approveAnomaly('ano-1')

      // Assert
      expect(useReviewStore.getState().anomalies[0].action).toBe(REVIEW_ACTION.APPROVED)
    })
  })

  describe('correctAnomaly', () => {
    it('should set action to CORRECTED and userCorrection', () => {
      // Arrange
      const anomaly = createMockAnomaly({ id: 'ano-1' })
      useReviewStore.setState({ anomalies: [anomaly] })

      // Act
      useReviewStore.getState().correctAnomaly('ano-1', 'Use N/A instead')

      // Assert
      expect(useReviewStore.getState().anomalies[0].action).toBe(REVIEW_ACTION.CORRECTED)
      expect(useReviewStore.getState().anomalies[0].userCorrection).toBe('Use N/A instead')
    })
  })

  describe('discardAnomaly', () => {
    it('should set action to DISCARDED', () => {
      // Arrange
      const anomaly = createMockAnomaly({ id: 'ano-1' })
      useReviewStore.setState({ anomalies: [anomaly] })

      // Act
      useReviewStore.getState().discardAnomaly('ano-1')

      // Assert
      expect(useReviewStore.getState().anomalies[0].action).toBe(REVIEW_ACTION.DISCARDED)
    })
  })

  describe('nextAnomaly', () => {
    it('should increment index within bounds', () => {
      // Arrange
      const anomalies = [
        createMockAnomaly({ id: 'ano-1' }),
        createMockAnomaly({ id: 'ano-2' }),
        createMockAnomaly({ id: 'ano-3' }),
      ]
      useReviewStore.setState({ anomalies, currentAnomalyIndex: 0 })

      // Act
      useReviewStore.getState().nextAnomaly()

      // Assert
      expect(useReviewStore.getState().currentAnomalyIndex).toBe(1)
    })

    it('should not exceed max index', () => {
      // Arrange
      const anomalies = [
        createMockAnomaly({ id: 'ano-1' }),
        createMockAnomaly({ id: 'ano-2' }),
      ]
      useReviewStore.setState({ anomalies, currentAnomalyIndex: 1 })

      // Act
      useReviewStore.getState().nextAnomaly()

      // Assert
      expect(useReviewStore.getState().currentAnomalyIndex).toBe(1)
    })
  })

  describe('previousAnomaly', () => {
    it('should decrement index within bounds', () => {
      // Arrange
      const anomalies = [
        createMockAnomaly({ id: 'ano-1' }),
        createMockAnomaly({ id: 'ano-2' }),
        createMockAnomaly({ id: 'ano-3' }),
      ]
      useReviewStore.setState({ anomalies, currentAnomalyIndex: 2 })

      // Act
      useReviewStore.getState().previousAnomaly()

      // Assert
      expect(useReviewStore.getState().currentAnomalyIndex).toBe(1)
    })

    it('should not go below 0', () => {
      // Arrange
      const anomalies = [
        createMockAnomaly({ id: 'ano-1' }),
        createMockAnomaly({ id: 'ano-2' }),
      ]
      useReviewStore.setState({ anomalies, currentAnomalyIndex: 0 })

      // Act
      useReviewStore.getState().previousAnomaly()

      // Assert
      expect(useReviewStore.getState().currentAnomalyIndex).toBe(0)
    })
  })

  describe('resetReview', () => {
    it('should clear all state', () => {
      // Arrange
      const anomalies = [createMockAnomaly({ id: 'ano-1' })]
      useReviewStore.setState({ 
        anomalies, 
        currentAnomalyIndex: 5, 
        isSubmitting: true 
      })

      // Act
      useReviewStore.getState().resetReview()

      // Assert
      expect(useReviewStore.getState().anomalies).toHaveLength(0)
      expect(useReviewStore.getState().currentAnomalyIndex).toBe(0)
      expect(useReviewStore.getState().isSubmitting).toBe(false)
    })
  })

  describe('getProgress', () => {
    it('should return 0 percentage when no anomalies', () => {
      // Arrange
      useReviewStore.setState({ anomalies: [] })

      // Act
      const progress = useReviewStore.getState().getProgress()

      // Assert
      expect(progress.percentage).toBe(0)
      expect(progress.total).toBe(0)
      expect(progress.resolved).toBe(0)
    })

    it('should calculate percentage correctly', () => {
      // Arrange
      const anomalies = [
        createMockAnomaly({ id: 'ano-1', action: REVIEW_ACTION.APPROVED }),
        createMockAnomaly({ id: 'ano-2', action: REVIEW_ACTION.PENDING }),
        createMockAnomaly({ id: 'ano-3', action: REVIEW_ACTION.CORRECTED }),
        createMockAnomaly({ id: 'ano-4', action: REVIEW_ACTION.PENDING }),
      ]
      useReviewStore.setState({ anomalies })

      // Act
      const progress = useReviewStore.getState().getProgress()

      // Assert
      expect(progress.total).toBe(4)
      expect(progress.resolved).toBe(2)
      expect(progress.percentage).toBe(50)
    })
  })

  describe('getCurrentAnomaly', () => {
    it('should return anomaly at currentIndex', () => {
      // Arrange
      const anomalies = [
        createMockAnomaly({ id: 'ano-1' }),
        createMockAnomaly({ id: 'ano-2' }),
        createMockAnomaly({ id: 'ano-3' }),
      ]
      useReviewStore.setState({ anomalies, currentAnomalyIndex: 1 })

      // Act
      const current = useReviewStore.getState().getCurrentAnomaly()

      // Assert
      expect(current).not.toBeNull()
      expect(current?.id).toBe('ano-2')
    })

    it('should return null when no anomalies', () => {
      // Arrange
      useReviewStore.setState({ anomalies: [], currentAnomalyIndex: 0 })

      // Act
      const current = useReviewStore.getState().getCurrentAnomaly()

      // Assert
      expect(current).toBeNull()
    })
  })

  describe('getPendingAnomalies', () => {
    it('should return only PENDING anomalies', () => {
      // Arrange
      const anomalies = [
        createMockAnomaly({ id: 'ano-1', action: REVIEW_ACTION.APPROVED }),
        createMockAnomaly({ id: 'ano-2', action: REVIEW_ACTION.PENDING }),
        createMockAnomaly({ id: 'ano-3', action: REVIEW_ACTION.CORRECTED }),
        createMockAnomaly({ id: 'ano-4', action: REVIEW_ACTION.PENDING }),
        createMockAnomaly({ id: 'ano-5', action: REVIEW_ACTION.DISCARDED }),
      ]
      useReviewStore.setState({ anomalies })

      // Act
      const pending = useReviewStore.getState().getPendingAnomalies()

      // Assert
      expect(pending).toHaveLength(2)
      expect(pending[0].id).toBe('ano-2')
      expect(pending[1].id).toBe('ano-4')
    })
  })
})
