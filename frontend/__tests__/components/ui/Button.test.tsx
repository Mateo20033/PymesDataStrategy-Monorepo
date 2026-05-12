import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/Button'

describe('Button', () => {
  test('should render children correctly', () => {
    // Arrange & Act
    render(<Button>Click me</Button>)

    // Assert
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  test('should apply primary variant styles by default', () => {
    // Arrange & Act
    render(<Button>Primary</Button>)

    // Assert
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-primary')
  })

  test('should apply secondary variant styles when specified', () => {
    // Arrange & Act
    render(<Button variant="secondary">Secondary</Button>)

    // Assert
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-secondary')
  })

  test('should show loading spinner when loading=true', () => {
    // Arrange & Act
    render(<Button loading>Loading</Button>)

    // Assert
    const button = screen.getByRole('button')
    const spinner = button.querySelector('svg.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  test('should disable button when disabled=true', () => {
    // Arrange & Act
    render(<Button disabled>Disabled</Button>)

    // Assert
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  test('should disable button when loading=true', () => {
    // Arrange & Act
    render(<Button loading>Loading</Button>)

    // Assert
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  test('should call onClick when clicked', async () => {
    // Arrange
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    // Act
    await user.click(screen.getByRole('button'))

    // Assert
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  test('should not call onClick when disabled', async () => {
    // Arrange
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<Button disabled onClick={handleClick}>Disabled</Button>)

    // Act
    await user.click(screen.getByRole('button'))

    // Assert
    expect(handleClick).not.toHaveBeenCalled()
  })
})
