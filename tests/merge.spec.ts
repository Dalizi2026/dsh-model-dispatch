import { describe, expect, it } from 'vitest'
import { mergeAgentOptions } from '../src/merge.ts'
import { resolveCustomSelection } from '../src/shared.ts'

describe('mergeAgentOptions', () => {
  it('fills provider/model from selection when request omits them', () => {
    expect(mergeAgentOptions(undefined, { provider: 'p', model: 'm' })).toEqual({
      provider: 'p',
      model: 'm',
    })
  })

  it('carries the selection reasoning effort into agentOptions', () => {
    expect(mergeAgentOptions(undefined, {
      provider: 'p',
      model: 'm',
      reasoningEffort: 'high',
    })).toEqual({
      provider: 'p',
      model: 'm',
      reasoningEffort: 'high',
    })
  })

  it('lets explicit request fields win', () => {
    expect(mergeAgentOptions(
      { provider: 'req-p', model: 'req-m', maxTokens: 10 },
      { provider: 'set-p', model: 'set-m' },
    )).toEqual({
      provider: 'req-p',
      model: 'req-m',
      maxTokens: 10,
    })
  })
})

describe('resolveCustomSelection', () => {
  it('returns undefined for follow-main', () => {
    expect(resolveCustomSelection({ mode: 'follow-main' })).toBeUndefined()
  })

  it('returns undefined for incomplete custom', () => {
    expect(resolveCustomSelection({ mode: 'custom', selection: { provider: '', model: 'm' } })).toBeUndefined()
  })

  it('returns trimmed selection for custom', () => {
    expect(resolveCustomSelection({
      mode: 'custom',
      selection: { provider: ' p ', model: ' m ', reasoningEffort: ' high ' },
    })).toEqual({ provider: 'p', model: 'm', reasoningEffort: 'high' })
  })
})

