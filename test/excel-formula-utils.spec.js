import { describe, expect, it } from 'vitest'
import { formatFormula } from '../src/formatFormula'
import { getTokens } from '../src/getTokens'

describe('formatFormula', () => {
  it('formats the formula correctly', () => {
    const formula = `@custom_currency+1000`
    const expected = `@custom_currency + 1000`

    expect(formatFormula(formula)).toEqual(expected)
  })

  it('tokenizes the formula correctly', () => {
    const formula = `A1+1000`
    const res = [
      {
        subtype: 'range',
        type: 'operand',
        value: 'A1',
      },
      {
        subtype: 'math',
        type: 'operator-infix',
        value: '+',
      },
      {
        subtype: 'number',
        type: 'operand',
        value: '1000',
      },
    ]

    expect(getTokens(formula).items).toEqual(res)
  })
})
