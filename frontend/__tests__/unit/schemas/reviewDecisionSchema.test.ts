import { describe, it, expect } from 'vitest'
import { reviewDecisionSchema, batchDecisionSchema } from '@/lib/schemas'
import { REVIEW_ACTION } from '@/types/anomaly'

describe('reviewDecisionSchema', () => {
  describe('valid decisions', () => {
    it('should accept valid APPROVED decision', () => {
      // Arrange
      const decision = {
        anomalyId: 'ano-123',
        action: REVIEW_ACTION.APPROVED,
      }

      // Act
      const result = reviewDecisionSchema.safeParse(decision)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should accept CORRECTED decision with correction', () => {
      // Arrange
      const decision = {
        anomalyId: 'ano-123',
        action: REVIEW_ACTION.CORRECTED,
        correction: 'Use N/A instead of null',
      }

      // Act
      const result = reviewDecisionSchema.safeParse(decision)

      // Assert
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.correction).toBe('Use N/A instead of null')
      }
    })

    it('should accept CORRECTED decision without correction (optional)', () => {
      // Arrange
      const decision = {
        anomalyId: 'ano-123',
        action: REVIEW_ACTION.CORRECTED,
      }

      // Act
      const result = reviewDecisionSchema.safeParse(decision)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should accept DISCARDED decision', () => {
      // Arrange
      const decision = {
        anomalyId: 'ano-123',
        action: REVIEW_ACTION.DISCARDED,
      }

      // Act
      const result = reviewDecisionSchema.safeParse(decision)

      // Assert
      expect(result.success).toBe(true)
    })
  })

  describe('invalid decisions', () => {
    it('should reject empty anomalyId', () => {
      // Arrange
      const decision = {
        anomalyId: '',
        action: REVIEW_ACTION.APPROVED,
      }

      // Act
      const result = reviewDecisionSchema.safeParse(decision)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Anomaly ID')
      }
    })

    it('should reject PENDING action (not allowed)', () => {
      // Arrange
      const decision = {
        anomalyId: 'ano-123',
        action: REVIEW_ACTION.PENDING,
      }

      // Act
      const result = reviewDecisionSchema.safeParse(decision)

      // Assert
      expect(result.success).toBe(false)
    })
  })
})

describe('batchDecisionSchema', () => {
  it('should reject empty array', () => {
    // Arrange
    const batch: unknown[] = []

    // Act
    const result = batchDecisionSchema.safeParse(batch)

    // Assert
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('one decision')
    }
  })

  it('should accept valid array', () => {
    // Arrange
    const batch = [
      { anomalyId: 'ano-1', action: REVIEW_ACTION.APPROVED },
      { anomalyId: 'ano-2', action: REVIEW_ACTION.CORRECTED, correction: 'Fix it' },
      { anomalyId: 'ano-3', action: REVIEW_ACTION.DISCARDED },
    ]

    // Act
    const result = batchDecisionSchema.safeParse(batch)

    // Assert
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toHaveLength(3)
    }
  })
})
