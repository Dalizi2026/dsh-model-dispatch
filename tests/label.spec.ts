/**
 * Pure label formatting tests.
 */

import { describe, expect, it } from 'vitest'
import { formatContextWindow, formatModelLabel } from '../src/label.ts'

describe('formatContextWindow', () => {
  it('formats K and M', () => {
    expect(formatContextWindow(512)).toBe('512')
    expect(formatContextWindow(128_000)).toBe('128K')
    expect(formatContextWindow(1_000_000)).toBe('1M')
    expect(formatContextWindow(1_500_000)).toBe('1.5M')
  })
})

describe('formatModelLabel', () => {
  it('joins name context effort', () => {
    expect(formatModelLabel({
      modelName: 'GPT-5.6 Sol',
      contextWindow: 1_000_000,
      effortName: 'Max',
    })).toBe('GPT-5.6 Sol 1M Max')
  })

  it('omits missing optional parts', () => {
    expect(formatModelLabel({ modelName: 'Flash' })).toBe('Flash')
    expect(formatModelLabel({ modelName: 'Flash', effortName: 'High' })).toBe('Flash High')
  })
})
