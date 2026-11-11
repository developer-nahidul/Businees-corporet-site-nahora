import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'
import '../src/i18n'

Object.defineProperty(window, 'scrollTo', { configurable: true, value: vi.fn() })
const getBoundingClientRect = HTMLElement.prototype.getBoundingClientRect
HTMLElement.prototype.getBoundingClientRect = function () {
  if (this.classList.contains('recharts-responsive-container')) return new DOMRect(0, 0, 640, 360)
  return getBoundingClientRect.call(this)
}
vi.stubGlobal('ResizeObserver', class {
  observe() {}
  unobserve() {}
  disconnect() {}
})

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: false,
    status: 401,
    json: async () => ({ error: 'Authentication required.' }),
  }))
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  localStorage.clear()
  document.documentElement.className = ''
})
