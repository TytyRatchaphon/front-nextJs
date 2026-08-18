import { describe, it, expect, vi } from 'vitest'

const imageLoaderMock = vi.fn((_params?: any) => 'resolved-loader-url')

vi.mock('@/utils/imageUtils', () => ({
  imageLoader: (param: any) => imageLoaderMock(param),
}))

import nextImageLoader from '@/utils/next-image-loader'

describe('nextImageLoader', () => {
  it('delegates to imageLoader with next/image params', () => {
    const params = { src: '/images/test.png', width: 320, quality: 80 }

    const result = nextImageLoader(params)

    expect(imageLoaderMock).toHaveBeenCalledWith(params)
    expect(result).toBe('resolved-loader-url')
  })
})
