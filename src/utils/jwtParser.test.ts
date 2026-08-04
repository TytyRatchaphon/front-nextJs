import { describe, it, expect } from 'vitest'
import { parseJwtToken, decodeAndMapUserFromToken } from '@/utils/jwtParser'

// Helper: create a fake JWT with the given payload
function createFakeJwt(payload: Record<string, any>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = btoa(JSON.stringify(payload))
  return `${header}.${body}.fake-signature`
}

// -------------------------------------------------------------------
// parseJwtToken
// -------------------------------------------------------------------
describe('parseJwtToken', () => {
  it('returns undefined for null/undefined/empty', () => {
    expect(parseJwtToken(null)).toBeUndefined()
    expect(parseJwtToken(undefined)).toBeUndefined()
    expect(parseJwtToken('')).toBeUndefined()
  })

  it('strips "Bearer " prefix', () => {
    expect(parseJwtToken('Bearer abc123')).toBe('abc123')
    expect(parseJwtToken('bearer xyz')).toBe('xyz')
  })

  it('strips surrounding quotes', () => {
    expect(parseJwtToken('"token123"')).toBe('token123')
    expect(parseJwtToken("'token456'")).toBe('token456')
  })

  it('strips Bearer + quotes combined', () => {
    expect(parseJwtToken('Bearer "mytoken"')).toBe('mytoken')
  })

  it('returns cleaned token for normal input', () => {
    expect(parseJwtToken('  normaltoken  ')).toBe('normaltoken')
  })
})

// -------------------------------------------------------------------
// decodeAndMapUserFromToken
// -------------------------------------------------------------------
describe('decodeAndMapUserFromToken', () => {
  const baseUser = {
    user_id: 0,
    fullname: '',
    img: '',
    writer_name: '',
    email: '',
    phone: '',
    address_main: '',
    des: '',
    facebook: '',
    twitter: '',
    gender: '',
    birthday: '',
    cat1: '',
    cat2: '',
    banner: '',
    frame_id: null,
    aka_id: null,
    frame: null,
    aka: null,
    coin: 0,
    freecoin: 0,
    flower: 0,
    heart: 0,
    stamp: 0,
    coupon: 0,
    exp: 0,
    role: '',
  }

  it('extracts userId from token', () => {
    const token = createFakeJwt({ userId: 42, fullname: 'Test User' })
    const result = decodeAndMapUserFromToken(token, baseUser)

    expect(result).not.toBeNull()
    expect(result!.user_id).toBe(42)
    expect(result!.fullname).toBe('Test User')
  })

  it('handles user_id key variant', () => {
    const token = createFakeJwt({ user_id: 99 })
    const result = decodeAndMapUserFromToken(token, baseUser)

    expect(result!.user_id).toBe(99)
  })

  it('maps coin/freecoin from various key names', () => {
    const token = createFakeJwt({ 
      userId: 1, 
      coin: 100, 
      freecoin: 50,
      flower: 5,
      heart: 10,
      stamp: 3,
      coupon: 2,
      exp_point: 1500,
    })
    const result = decodeAndMapUserFromToken(token, baseUser)

    expect(result!.coin).toBe(100)
    expect(result!.freecoin).toBe(50)
    expect(result!.flower).toBe(5)
    expect(result!.heart).toBe(10)
    expect(result!.stamp).toBe(3)
    expect(result!.coupon).toBe(2)
    expect(result!.exp).toBe(1500)
  })

  it('maps goldCoins to coin', () => {
    const token = createFakeJwt({ userId: 1, goldCoins: 200 })
    const result = decodeAndMapUserFromToken(token, baseUser)

    expect(result!.coin).toBe(200)
  })

  it('maps free_coin to freecoin', () => {
    const token = createFakeJwt({ userId: 1, free_coin: 75 })
    const result = decodeAndMapUserFromToken(token, baseUser)

    expect(result!.freecoin).toBe(75)
  })

  it('preserves baseUser fields when token has no override', () => {
    const customBase = { ...baseUser, email: 'base@test.com', phone: '000-000' }
    const token = createFakeJwt({ userId: 1 })  // no email or phone in token
    const result = decodeAndMapUserFromToken(token, customBase)

    expect(result!.email).toBe('base@test.com')
    expect(result!.phone).toBe('000-000')
  })

  it('overrides baseUser fields when token has values', () => {
    const customBase = { ...baseUser, email: 'old@test.com' }
    const token = createFakeJwt({ userId: 1, email: 'new@test.com' })
    const result = decodeAndMapUserFromToken(token, customBase)

    expect(result!.email).toBe('new@test.com')
  })

  it('maps frame and avatar fields', () => {
    const token = createFakeJwt({ 
      userId: 1, 
      frame_id: 5, 
      aka_id: 3, 
      frame: { img: 'frame.png' }, 
      aka: { img: 'aka.png' },
      img: 'avatar.jpg',
      banner: 'banner.jpg',
    })
    const result = decodeAndMapUserFromToken(token, baseUser)

    expect(result!.frame_id).toBe(5)
    expect(result!.aka_id).toBe(3)
    expect(result!.img).toBe('avatar.jpg')
    expect(result!.banner).toBe('banner.jpg')
  })

  it('returns null for invalid token', () => {
    const result = decodeAndMapUserFromToken('not.a.jwt', baseUser)
    expect(result).toBeNull()
  })

  it('returns null for completely garbage input', () => {
    const result = decodeAndMapUserFromToken('garbage', baseUser)
    expect(result).toBeNull()
  })
})
