import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type AppState = {
  dark: boolean
  cartCount: number
  cartItems: { productId: string; quantity: number }[]
  wishlist: string[]
  recentlyViewed: string[]
  toast: string | null
  setDark: (dark: boolean) => void
  addCart: (productId: string) => void
  removeCart: (productId: string) => void
  setCartQuantity: (productId: string, quantity: number) => void
  toggleWishlist: (productId: string) => void
  recordProductView: (productId: string) => void
  notify: (message: string) => void
  clearToast: () => void
}

export const useAppStore = create<AppState>()(persist((set) => ({
  dark: localStorage.getItem('nahora-theme') === 'dark',
  cartCount: 3,
  cartItems: [{ productId: 'p-1001', quantity: 1 }, { productId: 'p-1002', quantity: 1 }, { productId: 'p-1003', quantity: 1 }],
  wishlist: [],
  recentlyViewed: [],
  toast: null,
  setDark: (dark) => {
    localStorage.setItem('nahora-theme', dark ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', dark)
    set({ dark })
  },
  addCart: (productId) => set((state) => {
    const existing = state.cartItems.find((item) => item.productId === productId)
    const cartItems = existing
      ? state.cartItems.map((item) => item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item)
      : [...state.cartItems, { productId, quantity: 1 }]
    return { cartItems, cartCount: state.cartCount + 1 }
  }),
  removeCart: (productId) => set((state) => {
    const removed = state.cartItems.find((item) => item.productId === productId)
    const cartItems = state.cartItems.filter((item) => item.productId !== productId)
    return { cartItems, cartCount: Math.max(0, state.cartCount - (removed?.quantity || 0)) }
  }),
  setCartQuantity: (productId, quantity) => set((state) => {
    const oldQuantity = state.cartItems.find((item) => item.productId === productId)?.quantity || 0
    const cartItems = state.cartItems.map((item) => item.productId === productId ? { ...item, quantity } : item)
    return { cartItems, cartCount: Math.max(0, state.cartCount + quantity - oldQuantity) }
  }),
  toggleWishlist: (productId) => set((state) => ({
    wishlist: state.wishlist.includes(productId)
      ? state.wishlist.filter((id) => id !== productId)
      : [...state.wishlist, productId],
  })),
  recordProductView: (productId) => set((state) => ({
    recentlyViewed: [productId, ...state.recentlyViewed.filter((id) => id !== productId)].slice(0, 12),
  })),
  notify: (message) => set({ toast: message }),
  clearToast: () => set({ toast: null }),
}), {
  name: 'nahora-demo-state',
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => ({
    dark: state.dark,
    cartItems: state.cartItems,
    cartCount: state.cartItems.reduce((total, item) => total + item.quantity, 0),
    wishlist: state.wishlist,
    recentlyViewed: state.recentlyViewed,
  }),
  merge: (persisted, current) => {
    const saved = persisted as Partial<AppState> | undefined
    const cartItems = Array.isArray(saved?.cartItems)
      ? saved.cartItems.filter((item) => typeof item.productId === 'string' && Number.isInteger(item.quantity) && item.quantity > 0)
      : current.cartItems
    return {
      ...current,
      ...saved,
      cartItems,
      cartCount: cartItems.reduce((total, item) => total + item.quantity, 0),
      wishlist: Array.isArray(saved?.wishlist) ? saved.wishlist.filter((id): id is string => typeof id === 'string') : current.wishlist,
      recentlyViewed: Array.isArray(saved?.recentlyViewed) ? saved.recentlyViewed.filter((id): id is string => typeof id === 'string').slice(0, 12) : current.recentlyViewed,
    }
  },
}))

document.documentElement.classList.toggle('dark', localStorage.getItem('nahora-theme') === 'dark')
