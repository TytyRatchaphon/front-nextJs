import { describe, it, expect } from 'vitest'
import { imageLoader, resolveBannerImageSrc, resolveBookImageSrc, resolveStoreImageSrc, simpleImageLoader } from '@/utils/imageUtils'

describe('imageLoader', () => {
  it('upgrades http URL to https', () => {
    const url = 'http://example.com/image.jpg'
    expect(imageLoader({ src: url, width: 320 })).toBe('https://example.com/image.jpg?w=320&q=75')
  })

  it('returns https URL with width and quality params', () => {
    const url = 'https://cdn.example.com/pic.png'
    expect(imageLoader({ src: url, width: 640, quality: 90 })).toBe('https://cdn.example.com/pic.png?w=640&q=90')
  })

  it('returns local path with width and quality params', () => {
    expect(imageLoader({ src: '/images/test.jpg', width: 256 })).toBe('/images/test.jpg?w=256&q=75')
  })

  it('uses width parameter in the returned URL', () => {
    const url = 'https://cdn.com/img.jpg'
    expect(imageLoader({ src: url, width: 300 })).toBe('https://cdn.com/img.jpg?w=300&q=75')
  })

  it('normalizes relative CDN path', () => {
    expect(imageLoader({ src: 'img/book/test.png', width: 400 })).toBe('https://img.enjoybook.co/img/book/test.png?w=400&q=75')
  })

  it('preserves existing query params while appending width and quality', () => {
    expect(imageLoader({ src: 'https://cdn.com/img.jpg?foo=bar', width: 512 })).toBe('https://cdn.com/img.jpg?foo=bar&w=512&q=75')
  })
})

describe('simpleImageLoader', () => {
  it('returns src as-is', () => {
    expect(simpleImageLoader({ src: 'https://img.com/a.jpg' })).toBe('https://img.com/a.jpg')
    expect(simpleImageLoader({ src: '/local.png' })).toBe('/local.png')
  })
})

describe('resolve helpers', () => {
  it('builds banner URLs from filenames', () => {
    expect(resolveBannerImageSrc('hero.png')).toBe('https://img.enjoybook.co/img/banner/hero.png')
  })

  it('builds book thumbnail URLs from filenames', () => {
    expect(resolveBookImageSrc('cover.png')).toBe('https://img.enjoybook.co/img/book/tn/cover.png')
  })

  it('builds store URLs from filenames', () => {
    expect(resolveStoreImageSrc('pack.png')).toBe('https://img.enjoybook.co/img/store/pack.png')
  })
})
