import { describe, it, expect } from 'vitest'
import { get_date } from '@/utils/dateUtils'

describe('get_date', () => {

  // --- Null/empty handling ---

  it('returns empty string for null', () => {
    expect(get_date(null)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(get_date(undefined)).toBe('')
  })

  it('returns empty string for empty string', () => {
    expect(get_date('')).toBe('')
  })

  // --- Date object ---

  it('converts Date object to locale string', () => {
    const date = new Date(2026, 0, 15, 10, 30)
    const result = get_date(date)
    expect(result).toBe(date.toLocaleString())
  })

  // --- Timestamps ---

  it('converts millisecond timestamp (number)', () => {
    const ts = 1706000000000 // ~Jan 23, 2024
    const result = get_date(ts)
    expect(result).toBe(new Date(ts).toLocaleString())
  })

  it('converts second timestamp (auto-multiplied by 1000)', () => {
    const secTs = 1706000000 // 10-digit → seconds
    const result = get_date(secTs)
    expect(result).toBe(new Date(secTs * 1000).toLocaleString())
  })

  it('converts numeric string timestamp', () => {
    const result = get_date('1706000000000')
    expect(result).toBe(new Date(1706000000000).toLocaleString())
  })

  it('converts numeric string seconds timestamp', () => {
    const result = get_date('1706000000')
    expect(result).toBe(new Date(1706000000 * 1000).toLocaleString())
  })

  // --- ISO string ---

  it('parses ISO date string', () => {
    const iso = '2026-02-24T10:00:00.000Z'
    const result = get_date(iso)
    expect(result).toBe(new Date(iso).toLocaleString())
  })

  it('parses simple date string', () => {
    const dateStr = '2026-01-01'
    const result = get_date(dateStr)
    const expected = new Date(dateStr).toLocaleString()
    expect(result).toBe(expected)
  })

  // --- Invalid input ---

  it('returns original string for unparseable value', () => {
    const result = get_date('not-a-date-at-all')
    expect(result).toBe('not-a-date-at-all')
  })

  it('handles boolean gracefully', () => {
    // boolean → not null/undefined/empty, not a number, Date constructor might parse it
    const result = get_date(true)
    expect(typeof result).toBe('string')
  })
})
