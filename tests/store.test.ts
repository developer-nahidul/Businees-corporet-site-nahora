import { beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from '../src/store'

describe('persisted customer state', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
    useAppStore.setState({
      dark: false,
      cartCount: 3,
      cartItems: [
        { productId: 'p-1001', quantity: 1 },
        { productId: 'p-1002', quantity: 1 },
        { productId: 'p-1003', quantity: 1 },
      ],
      wishlist: [],
      recentlyViewed: [],
      toast: null,
    })
  })

  it('keeps cart quantities and count in sync as items are added, changed, and removed', () => {
    const store = useAppStore.getState()
    store.addCart('p-1001')
    store.addCart('p-1004')
    store.setCartQuantity('p-1001', 3)
    store.removeCart('p-1002')

    expect(useAppStore.getState().cartItems).toEqual([
      { productId: 'p-1001', quantity: 3 },
      { productId: 'p-1003', quantity: 1 },
      { productId: 'p-1004', quantity: 1 },
    ])
    expect(useAppStore.getState().cartCount).toBe(5)
  })

  it('persists cart and wishlist changes without discarding other demo state', () => {
    const store = useAppStore.getState()
    store.addCart('p-1004')
    store.toggleWishlist('p-1002')
    store.recordProductView('p-1003')

    const saved = JSON.parse(localStorage.getItem('nahora-demo-state') || 'null')
    expect(saved.state.cartCount).toBe(4)
    expect(saved.state.wishlist).toEqual(['p-1002'])
    expect(saved.state.recentlyViewed).toEqual(['p-1003'])
  })

  it('applies and saves the selected theme', () => {
    useAppStore.getState().setDark(true)

    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem('nahora-theme')).toBe('dark')
    expect(useAppStore.getState().dark).toBe(true)
  })
})
