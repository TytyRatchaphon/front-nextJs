export function get_date(value: any): string {
  if (value === null || value === undefined || value === '') return ''

  // if it's already a Date
  if (value instanceof Date) return value.toLocaleString()

  // if it's a number (timestamp) or numeric string, handle seconds vs ms
  const num = typeof value === 'number' ? value : typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : NaN
  if (!Number.isNaN(num)) {
    // if looks like seconds (10 digits) convert to ms
    const ts = num < 1e12 ? num * 1000 : num
    try {
      return new Date(ts).toLocaleString()
    } catch (e) {
      return String(value)
    }
  }

  // fallback: try to parse as ISO/locale string
  try {
    const d = new Date(String(value))
    if (!isNaN(d.getTime())) return d.toLocaleString()
  } catch (e) {}

  return String(value)
}
