import { describe, expect, it } from 'vitest'
import {
  formatCompact, formatCurrency, formatCurrencyCompact, formatKm, formatNumber, formatPercent, formatRating,
} from './format'

describe('format', () => {
  it('groups digits the Indian way', () => {
    expect(formatNumber(12345678)).toBe('1,23,45,678')
    expect(formatCurrency(1234567)).toBe('₹12,34,567')
  })

  it('shortens big numbers into lakh and crore', () => {
    expect(formatCompact(14250000)).toBe('1.4Cr')
    expect(formatCompact(123456)).toBe('1.2L')
    expect(formatCompact(1234)).toBe('1.2K')
    expect(formatCurrencyCompact(14250000)).toBe('₹1.4Cr')
  })

  it('shows a dash for missing values', () => {
    for (const fn of [formatNumber, formatCompact, formatCurrency, formatCurrencyCompact, formatRating, formatKm]) {
      expect(fn(null)).toBe('-')
      expect(fn(undefined)).toBe('-')
    }
  })

  it('formats ratings, distances and percentage changes', () => {
    expect(formatRating(4.5)).toBe('4.50')
    expect(formatKm(12.345)).toBe('12.3 km')
    expect(formatPercent(12.4)).toBe('+12.4%')
    expect(formatPercent(-3)).toBe('-3.0%')
    expect(formatPercent(0)).toBe('0.0%')
  })
})
