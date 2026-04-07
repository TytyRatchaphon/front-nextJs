import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { addParagraphIndexes, genEmailHide, modifiedHtml, obfuscateHtmlTextNodes, parseHtmlToJsx, randomString, stripHtmlTags } from '@/utils/htmlUtils'

// -------------------------------------------------------------------
// parseHtmlToJsx
// -------------------------------------------------------------------
describe('parseHtmlToJsx', () => {
  it('returns null for empty/falsy input', () => {
    expect(parseHtmlToJsx('')).toBeNull()
    expect(parseHtmlToJsx(null as any)).toBeNull()
    expect(parseHtmlToJsx(undefined as any)).toBeNull()
  })

  it('converts <br> to self-closing <br />', () => {
    expect(parseHtmlToJsx('<br>')).toBe('<br />')
    expect(parseHtmlToJsx('<br/>')).toBe('<br />')
    expect(parseHtmlToJsx('<br />')).toBe('<br />')
  })

  it('converts class= to className=', () => {
    const result = parseHtmlToJsx('<div class="test">hello</div>')
    expect(result).toContain('className="test"')
  })
})

// -------------------------------------------------------------------
// stripHtmlTags
// -------------------------------------------------------------------
describe('stripHtmlTags', () => {
  it('returns empty string for falsy input', () => {
    expect(stripHtmlTags('')).toBe('')
    expect(stripHtmlTags(null as any)).toBe('')
  })

  it('strips all HTML tags', () => {
    const result = stripHtmlTags('<p>Hello</p><strong>World</strong>')
    expect(result).not.toContain('<')
    expect(result).not.toContain('>')
    expect(result).toContain('Hello')
    expect(result).toContain('World')
  })

  it('converts <br> to newline', () => {
    const result = stripHtmlTags('Line1<br>Line2')
    expect(result).toContain('Line1\nLine2')
  })

  it('converts </p> to double newline', () => {
    const result = stripHtmlTags('<p>Para1</p><p>Para2</p>')
    expect(result).toContain('Para1')
    expect(result).toContain('Para2')
  })
})

// -------------------------------------------------------------------
// randomString
// -------------------------------------------------------------------
describe('randomString', () => {
  it('generates string of requested length', () => {
    expect(randomString(0)).toBe('')
    expect(randomString(5)).toHaveLength(5)
    expect(randomString(20)).toHaveLength(20)
  })

  it('generates only alphanumeric characters', () => {
    const result = randomString(100)
    expect(result).toMatch(/^[A-Za-z0-9]+$/)
  })

  it('generates different strings on multiple calls', () => {
    const a = randomString(16)
    const b = randomString(16)
    // Very unlikely to be equal with 62^16 possibilities
    expect(a).not.toBe(b)
  })
})

// -------------------------------------------------------------------
// genEmailHide
// -------------------------------------------------------------------
describe('genEmailHide', () => {
  it('returns random string when email is null/undefined', () => {
    const result = genEmailHide(null)
    expect(result).toHaveLength(4)
  })

  it('returns random string when email is empty', () => {
    const result = genEmailHide('')
    expect(result).toHaveLength(4)
  })

  it('inserts random chars into email', () => {
    const result = genEmailHide('user@example.com')
    // Should contain the local part + 4 random chars + domain
    expect(result).toContain('user')
    expect(result).toContain('example.com')
    expect(result.length).toBe('user'.length + 4 + 'example.com'.length)
  })
})

// -------------------------------------------------------------------
// modifiedHtml
// -------------------------------------------------------------------
describe('modifiedHtml', () => {
  it('returns empty string for falsy input', () => {
    expect(modifiedHtml('', 'Arial', null)).toBe('')
    expect(modifiedHtml(null as any, 'Arial', null)).toBe('')
  })

  it('removes <font> tags', () => {
    const result = modifiedHtml('<font color="red">Text</font>', 'Arial', null)
    expect(result).not.toContain('<font')
    expect(result).not.toContain('</font>')
    expect(result).toContain('Text')
  })

  it('removes inline font-size and font-family', () => {
    const html = '<p style="font-size:14pt; font-family: Tahoma;">Hello</p>'
    const result = modifiedHtml(html, 'Inter', null)
    expect(result).not.toContain('font-size:14pt')
    expect(result).not.toContain('font-family: Tahoma')
  })

  it('applies custom font to <p> tags', () => {
    const result = modifiedHtml('<p>Content</p>', 'Sarabun', null)
    expect(result).toContain('font-family: Sarabun')
    expect(result).toContain('&emsp;&emsp;&emsp;')
  })

  it('converts <h1> to <p> with font', () => {
    const result = modifiedHtml('<h1>Title</h1>', 'Inter', null)
    expect(result).not.toContain('<h1')
    expect(result).toContain('font-family: Inter')
  })

  it('injects hidden email watermark in </p>', () => {
    const userData = { email: 'test@mail.com' }
    const result = modifiedHtml('<p>Hello</p>', 'Arial', userData)
    expect(result).toContain('color:transparent')
    expect(result).toContain('font-size:0')
    // Should contain parts of the (obfuscated) email
    expect(result).toContain('test')
  })

  it('uses fallback font when none provided', () => {
    const result = modifiedHtml('<p>Text</p>', '', null)
    expect(result).toContain('var(--font-sarabun)')
  })
})

describe('obfuscateHtmlTextNodes', () => {
  it('returns empty string for empty input', () => {
    expect(obfuscateHtmlTextNodes('')).toBe('')
  })

  it('injects invisible characters into visible text nodes only', () => {
    const html = '<p>Hello world <span style="color:transparent;font-size:0;">SECRET</span></p>'
    const result = obfuscateHtmlTextNodes(html)
    const cleanedResult = result
      .replace(/<span class="inspect-noise[\s\S]*?<\/span>/g, '')
      .replace(/[\u200b\u200c\u2060]/g, '')

    expect(result).not.toBe(html)
    expect(result).toContain('inspect-noise')
    expect(result).toContain('data-noise=')
    expect(cleanedResult).toContain('Hello world')
    expect(cleanedResult).toContain('SECRET')
  })
})

describe('addParagraphIndexes', () => {
  const originalWindow = globalThis.window
  const originalDOMParser = globalThis.DOMParser

  beforeEach(() => {
    // Reset globals per test to avoid leaking custom parser mocks.
    if (typeof originalWindow === 'undefined') {
      Reflect.deleteProperty(globalThis, 'window')
    } else {
      ;(globalThis as any).window = originalWindow
    }

    if (typeof originalDOMParser === 'undefined') {
      Reflect.deleteProperty(globalThis, 'DOMParser')
    } else {
      ;(globalThis as any).DOMParser = originalDOMParser
    }
  })

  afterEach(() => {
    if (typeof originalWindow === 'undefined') {
      Reflect.deleteProperty(globalThis, 'window')
    } else {
      ;(globalThis as any).window = originalWindow
    }

    if (typeof originalDOMParser === 'undefined') {
      Reflect.deleteProperty(globalThis, 'DOMParser')
    } else {
      ;(globalThis as any).DOMParser = originalDOMParser
    }
  })

  it('returns empty payload for empty input', () => {
    expect(addParagraphIndexes('')).toEqual({ html: '', paragraphCount: 0 })
  })

  it('adds indexes with regex fallback when DOMParser is unavailable', () => {
    Reflect.deleteProperty(globalThis, 'window')
    Reflect.deleteProperty(globalThis, 'DOMParser')

    const result = addParagraphIndexes('<p>First</p><blockquote>Second</blockquote><li>Third</li><pre>Fourth</pre>')
    expect(result.paragraphCount).toBe(4)
    expect(result.html).toContain('data-paragraph-index="1"')
    expect(result.html).toContain('data-paragraph-index="2"')
    expect(result.html).toContain('data-paragraph-index="3"')
    expect(result.html).toContain('data-paragraph-index="4"')
  })

  it('indexes only visible blocks when parser is available', () => {
    const createMockBlock = (textContent: string) => {
      const remove = vi.fn()
      const clone = {
        textContent,
        querySelectorAll: vi.fn(() => [{ remove }]),
      }

      return {
        cloneNode: vi.fn(() => clone),
        removeAttribute: vi.fn(),
        setAttribute: vi.fn(),
        remove,
      } as any
    }

    const emptyBlock = createMockBlock('\u00a0\u200b ')
    const firstBlock = createMockBlock('\u00a0 Hello\u200b ')
    const secondBlock = createMockBlock(' World ')

    const doc = {
      body: {
        querySelectorAll: vi.fn(() => [emptyBlock, firstBlock, secondBlock]),
        innerHTML: '<p data-paragraph-index="1">Hello</p><p data-paragraph-index="2">World</p>',
      },
    }

    const parseFromString = vi.fn(() => doc)
    class MockDOMParser {
      parseFromString = parseFromString
    }

    ;(globalThis as any).window = {}
    ;(globalThis as any).DOMParser = MockDOMParser

    const result = addParagraphIndexes('<p>a</p><p>b</p><p>c</p>')

    expect(parseFromString).toHaveBeenCalledWith('<p>a</p><p>b</p><p>c</p>', 'text/html')
    expect(emptyBlock.removeAttribute).toHaveBeenCalledWith('data-paragraph-index')
    expect(firstBlock.setAttribute).toHaveBeenCalledWith('data-paragraph-index', '1')
    expect(secondBlock.setAttribute).toHaveBeenCalledWith('data-paragraph-index', '2')
    expect(firstBlock.remove).toHaveBeenCalled()
    expect(result).toEqual({
      html: '<p data-paragraph-index="1">Hello</p><p data-paragraph-index="2">World</p>',
      paragraphCount: 2,
    })
  })
})
