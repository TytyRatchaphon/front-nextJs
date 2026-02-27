import { describe, it, expect } from 'vitest'
import { imageLoader, simpleImageLoader } from '@/utils/imageUtils'

describe('imageLoader', () => {
  it('returns http URL as-is', () => {
    const url = 'http://example.com/image.jpg'
    expect(imageLoader({ src: url })).toBe(url)
  })

  it('returns https URL as-is', () => {
    const url = 'https://cdn.example.com/pic.png'
    expect(imageLoader({ src: url })).toBe(url)
  })

  it('returns local path as-is', () => {
    expect(imageLoader({ src: '/images/test.jpg' })).toBe('/images/test.jpg')
  })

  it('ignores width parameter (current behavior)', () => {
    const url = 'https://cdn.com/img.jpg'
    expect(imageLoader({ src: url, width: 300 })).toBe(url)
  })

  it('handles relative path', () => {
    expect(imageLoader({ src: 'images/local.png' })).toBe('images/local.png')
  })
})

describe('simpleImageLoader', () => {
  it('returns src as-is', () => {
    expect(simpleImageLoader({ src: 'https://img.com/a.jpg' })).toBe('https://img.com/a.jpg')
    expect(simpleImageLoader({ src: '/local.png' })).toBe('/local.png')
  })
})
