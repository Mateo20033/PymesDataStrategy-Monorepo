import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn', () => {
  it('should merge class names', () => {
    // Act
    const result = cn('foo', 'bar')

    // Assert
    expect(result).toBe('foo bar')
  })

  it('should handle conditional classes', () => {
    // Arrange
    const isActive = true
    const isDisabled = false

    // Act
    const result = cn(
      'base-class',
      isActive && 'active',
      isDisabled && 'disabled'
    )

    // Assert
    expect(result).toBe('base-class active')
    expect(result).not.toContain('disabled')
  })

  it('should merge tailwind conflicts correctly', () => {
    // Act - twMerge should resolve conflicting tailwind classes
    const result = cn('px-4 py-2', 'px-8')

    // Assert - px-8 should override px-4
    expect(result).toBe('py-2 px-8')
  })

  it('should handle arrays and objects', () => {
    // Act
    const result = cn(
      'base',
      ['array-class'],
      { 'conditional-true': true, 'conditional-false': false }
    )

    // Assert
    expect(result).toContain('base')
    expect(result).toContain('array-class')
    expect(result).toContain('conditional-true')
    expect(result).not.toContain('conditional-false')
  })

  it('should handle undefined and null values', () => {
    // Act
    const result = cn('base', undefined, null, 'end')

    // Assert
    expect(result).toBe('base end')
  })
})
