import { describe, it, expect } from 'vitest'
import { uploadFileSchema } from '@/lib/schemas'

/**
 * Helper to create a mock File object for testing
 */
const createMockFile = (
  name: string,
  size: number,
  type: string = 'application/octet-stream'
): File => {
  const content = new Array(size).fill('a').join('')
  const blob = new Blob([content], { type })
  return new File([blob], name, { type })
}

describe('uploadFileSchema', () => {
  describe('valid files', () => {
    it('should accept valid .csv file under 10MB', () => {
      // Arrange
      const file = createMockFile('data.csv', 1024, 'text/csv')

      // Act
      const result = uploadFileSchema.safeParse(file)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should accept valid .xlsx file', () => {
      // Arrange
      const file = createMockFile(
        'spreadsheet.xlsx',
        5 * 1024 * 1024, // 5MB
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )

      // Act
      const result = uploadFileSchema.safeParse(file)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should accept valid .xls file', () => {
      // Arrange
      const file = createMockFile(
        'legacy.xls',
        2 * 1024 * 1024, // 2MB
        'application/vnd.ms-excel'
      )

      // Act
      const result = uploadFileSchema.safeParse(file)

      // Assert
      expect(result.success).toBe(true)
    })
  })

  describe('invalid files', () => {
    it('should reject file over 10MB', () => {
      // Arrange
      const file = createMockFile('huge.csv', 11 * 1024 * 1024, 'text/csv') // 11MB

      // Act
      const result = uploadFileSchema.safeParse(file)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('10MB')
      }
    })

    it('should reject invalid extension (.pdf)', () => {
      // Arrange
      const file = createMockFile('document.pdf', 1024, 'application/pdf')

      // Act
      const result = uploadFileSchema.safeParse(file)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('.csv')
      }
    })

    it('should reject non-File value', () => {
      // Arrange
      const notAFile = { name: 'fake.csv', size: 1024 }

      // Act
      const result = uploadFileSchema.safeParse(notAFile)

      // Assert
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('file')
      }
    })
  })
})
