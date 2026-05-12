import { describe, it, expect } from 'vitest'
import { loginSchema, registerSchema } from '@/lib/schemas'

describe('loginSchema', () => {
  it('accepts valid email and password', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email format', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path[0])
      expect(fields).toContain('email')
    }
  })

  it('rejects password shorter than 8 characters', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'short',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const passwordIssue = result.error.issues.find((i) => i.path[0] === 'password')
      expect(passwordIssue).toBeDefined()
      expect(passwordIssue?.message).toContain('8')
    }
  })

  it('rejects missing email', () => {
    const result = loginSchema.safeParse({ password: 'password123' })
    expect(result.success).toBe(false)
  })

  it('rejects missing password', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com' })
    expect(result.success).toBe(false)
  })

  it('accepts exactly 8 character password', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: '12345678',
    })
    expect(result.success).toBe(true)
  })
})

describe('registerSchema', () => {
  it('accepts valid name, email, and password', () => {
    const result = registerSchema.safeParse({
      name: 'Juan Pérez',
      email: 'juan@example.com',
      password: 'securepass',
    })
    expect(result.success).toBe(true)
  })

  it('rejects name shorter than 2 characters', () => {
    const result = registerSchema.safeParse({
      name: 'J',
      email: 'juan@example.com',
      password: 'securepass',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const nameIssue = result.error.issues.find((i) => i.path[0] === 'name')
      expect(nameIssue).toBeDefined()
      expect(nameIssue?.message).toContain('2')
    }
  })

  it('rejects invalid email format', () => {
    const result = registerSchema.safeParse({
      name: 'Juan',
      email: 'not-valid',
      password: 'securepass',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path[0])
      expect(fields).toContain('email')
    }
  })

  it('rejects password shorter than 8 characters', () => {
    const result = registerSchema.safeParse({
      name: 'Juan',
      email: 'juan@example.com',
      password: '1234567',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const passwordIssue = result.error.issues.find((i) => i.path[0] === 'password')
      expect(passwordIssue).toBeDefined()
    }
  })

  it('rejects missing fields', () => {
    expect(registerSchema.safeParse({}).success).toBe(false)
    expect(registerSchema.safeParse({ name: 'Juan' }).success).toBe(false)
    expect(registerSchema.safeParse({ name: 'Juan', email: 'j@j.com' }).success).toBe(false)
  })

  it('accepts exactly 2 character name', () => {
    const result = registerSchema.safeParse({
      name: 'Jo',
      email: 'jo@example.com',
      password: 'password1',
    })
    expect(result.success).toBe(true)
  })
})
