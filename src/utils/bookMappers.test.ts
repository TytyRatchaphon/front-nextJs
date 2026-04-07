import { describe, it, expect } from 'vitest'
import {
  normalizeBookData,
  normalizeContinueBook,
  normalizePurchasedBook,
  normalizeBooksArray,
  normalizeContinueBooksArray,
} from '@/utils/bookMappers'
import type { BookData } from '@/types/api'

// -------------------------------------------------------------------
// normalizeBookData
// -------------------------------------------------------------------
describe('normalizeBookData', () => {
  it('maps standard fields correctly', () => {
    const raw: BookData = {
      book_id: 123,
      bookID: 'BK123',
      img: 'cover.jpg',
      img_gif: 'cover.gif',
      img_gif_full: 'cover-full.gif',
      name: 'Test Book',
      title: 'Test Book Title',
      writer_name: 'Author A',
      view: 5000,
      chapter: 42,
      shelve_count: 300,
      end: 'not_end',
      status: 'publish',
    }

    const result = normalizeBookData(raw)

    expect(result.book_id).toBe(123)
    expect(result.bookID).toBe('BK123')
    expect(result.img).toBe('cover.jpg')
    expect(result.img_gif).toBe('cover.gif')
    expect(result.img_gif_full).toBe('cover-full.gif')
    expect(result.name).toBe('Test Book')
    expect(result.title).toBe('Test Book Title')
    expect(result.author).toBe('Author A')
    expect(result.writer_name).toBe('Author A')
    expect(result.view).toBe(5000)
    expect(result.chapter).toBe(42)
    expect(result.shelve_count).toBe(300)
    expect(result.shelveCount).toBe(300)
    expect(result.end).toBe('not_end')
    expect(result.status).toBe('publish')
  })

  it('falls back to alternative field names', () => {
    const raw: BookData = {
      // no book_id, only bookID as number
      bookID: 456,
      imgtn: 'thumb.jpg',
      title: 'Only Title',
      user_name: 'Writer B',
      // missing view, chapter, shelve_count
    } as any

    const result = normalizeBookData(raw)

    expect(result.book_id).toBe(456)
    expect(result.bookID).toBe('456')
    expect(result.img).toBe('thumb.jpg')
    expect(result.name).toBe('Only Title') // falls back to title
    expect(result.author).toBe('Writer B')
    expect(result.view).toBe(0)
    expect(result.chapter).toBe(0)
    expect(result.shelve_count).toBe(0)
  })

  it('falls back to img_full when thumbnail image fields are missing', () => {
    const raw: BookData = {
      book_id: 99,
      img_full: 'full-cover.webp',
    } as any

    const result = normalizeBookData(raw)

    expect(result.img).toBe('full-cover.webp')
    expect(result.img_full).toBe('full-cover.webp')
  })

  it('handles completely empty object gracefully', () => {
    const raw: BookData = {} as any

    const result = normalizeBookData(raw)

    expect(result.book_id).toBeUndefined()
    expect(result.bookID).toBe('')
    expect(result.img).toBe('')
    expect(result.name).toBe('')
    expect(result.author).toBe('')
    expect(result.view).toBe(0)
    expect(result.chapter).toBe(0)
  })
})

// -------------------------------------------------------------------
// normalizeContinueBook — the bug we fixed
// -------------------------------------------------------------------
describe('normalizeContinueBook', () => {
  it('maps last_read_ep_id and last_read_ep_name from API response', () => {
    // This is the actual shape the API sends (from React Query DevTools screenshot)
    const raw: BookData = {
      book_id: 3529,
      name: 'ทดสอบหนังสือ',
      img: 'test.jpg',
      writer_name: 'Enjoybook',
      view: 4784,
      chapter: 879,
      shelve_count: 969,
      end: 'end',
      status: 'publish',
      last_read_ep_id: 34631,
      last_read_ep_name: 'ตอนที่ 18 ลันด์อเมสเตน',
      last_read_at: '2026-02-24T06:09:22.0067',
    } as any

    const result = normalizeContinueBook(raw)

    // ✅ ep_id should come from last_read_ep_id
    expect(result.ep_id).toBe(34631)
    // ✅ epName should come from last_read_ep_name
    expect(result.epName).toBe('ตอนที่ 18 ลันด์อเมสเตน')
    expect(result.last_read_at).toBe('2026-02-24T06:09:22.0067')
  })

  it('falls back to last_read_ep when last_read_ep_id is missing', () => {
    const raw: BookData = {
      book_id: 100,
      name: 'Fallback Test',
      last_read_ep: 999,
      epName: 'EP Fallback',
    } as any

    const result = normalizeContinueBook(raw)

    expect(result.ep_id).toBe(999)
    expect(result.epName).toBe('EP Fallback')
  })

  it('falls back to ep_id when both last_read_ fields are missing', () => {
    const raw: BookData = {
      book_id: 200,
      name: 'Deep Fallback',
      ep_id: 555,
      ep_name: 'Episode 5',
    } as any

    const result = normalizeContinueBook(raw)

    expect(result.ep_id).toBe(555)
    expect(result.epName).toBe('Episode 5')
  })

  it('returns empty epName when no episode name fields exist', () => {
    const raw: BookData = {
      book_id: 300,
      name: 'No EP Name',
    } as any

    const result = normalizeContinueBook(raw)

    expect(result.ep_id).toBeUndefined()
    expect(result.epName).toBe('')
  })

  it('includes extra fields like isBestSeller, isNew, discount', () => {
    const raw: BookData = {
      book_id: 400,
      name: 'Extras',
      isBestSeller: true,
      isNew: false,
      isNewEp: true,
      discount: 20,
      img_full: 'full.jpg',
    } as any

    const result = normalizeContinueBook(raw)

    expect(result.isBestSeller).toBe(true)
    expect(result.isNew).toBe(false)
    expect(result.isNewEp).toBe(true)
    expect(result.discount).toBe(20)
    expect(result.img_full).toBe('full.jpg')
  })
})

// -------------------------------------------------------------------
// normalizePurchasedBook
// -------------------------------------------------------------------
describe('normalizePurchasedBook', () => {
  it('maps purchase fields correctly', () => {
    const raw: BookData = {
      book_id: 500,
      name: 'Purchased Book',
      writer_name: 'Author C',
      purchase_date: '2026-01-15',
      price_paid: 50,
    } as any

    const result = normalizePurchasedBook(raw)

    expect(result.book_id).toBe(500)
    expect(result.name).toBe('Purchased Book')
    expect(result.purchase_date).toBe('2026-01-15')
    expect(result.price_paid).toBe(50)
  })

  it('falls back created_at when purchase_date is missing', () => {
    const raw: BookData = {
      book_id: 600,
      name: 'No Purchase Date',
      created_at: '2026-02-01',
    } as any

    const result = normalizePurchasedBook(raw)

    expect(result.purchase_date).toBe('2026-02-01')
  })
})

// -------------------------------------------------------------------
// Batch normalizers
// -------------------------------------------------------------------
describe('normalizeBooksArray', () => {
  it('normalizes an array of books', () => {
    const raw: BookData[] = [
      { book_id: 1, name: 'Book A' } as any,
      { book_id: 2, name: 'Book B' } as any,
    ]

    const results = normalizeBooksArray(raw)

    expect(results).toHaveLength(2)
    expect(results[0].book_id).toBe(1)
    expect(results[1].book_id).toBe(2)
  })

  it('returns empty array for empty input', () => {
    expect(normalizeBooksArray([])).toEqual([])
  })
})

describe('normalizeContinueBooksArray', () => {
  it('normalizes array with last_read_ep_id fields', () => {
    const raw: BookData[] = [
      { book_id: 10, name: 'A', last_read_ep_id: 100, last_read_ep_name: 'EP1' } as any,
      { book_id: 20, name: 'B', last_read_ep_id: 200, last_read_ep_name: 'EP2' } as any,
    ]

    const results = normalizeContinueBooksArray(raw)

    expect(results).toHaveLength(2)
    expect(results[0].ep_id).toBe(100)
    expect(results[0].epName).toBe('EP1')
    expect(results[1].ep_id).toBe(200)
    expect(results[1].epName).toBe('EP2')
  })
})
