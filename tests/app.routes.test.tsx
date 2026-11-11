import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import App, { customerRoutes } from '../src/App'
import { portalNavigation } from '../src/data'

const publicRoutes = [
  '/',
  '/search',
  '/products',
  '/product/p-1001',
  '/stores',
  '/stores/1',
  '/cart',
  '/checkout',
  '/account',
  '/orders',
  '/wishlist',
  '/inbox',
  '/community',
  '/deals',
  '/academy',
  '/help',
  '/privacy',
  '/ai',
  '/notifications-center',
  '/search/all',
  '/mobile-preview',
  '/login',
  '/register',
  '/shop',
  '/orders/live',
  '/merchant/live',
  '/admin/live-merchants',
]

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </MemoryRouter>,
  )
}

describe('route preservation', () => {
  it('renders all registered public, customer, and workspace navigation routes', () => {
    const paths = new Set([
      ...publicRoutes,
      ...customerRoutes.map(([path]) => path),
      ...Object.values(portalNavigation).flatMap((items) => items.map(({ path }) => path)),
    ])

    for (const path of paths) {
      const { unmount } = renderAt(path)
      expect(screen.queryByText('This page wandered off.'), `route ${path}`).toBeNull()
      unmount()
    }
  }, 30000)

  it('creates a customer account and opens the live marketplace after server confirmation', async () => {
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const path = String(input)
      if (path === '/api/auth/me') {
        return Promise.resolve({ ok: false, status: 401, json: async () => ({ error: 'Authentication required.' }) })
      }
      if (path === '/api/auth/register') {
        return Promise.resolve({
          ok: true,
          status: 201,
          json: async () => ({ user: { id: 'customer-1', email: 'buyer@example.com', fullName: 'Test Buyer', role: 'customer', storeStatus: null } }),
        })
      }
      if (path === '/api/products') return Promise.resolve({ ok: true, status: 200, json: async () => ({ products: [] }) })
      throw new Error(`Unexpected API request: ${path}`)
    })
    vi.stubGlobal('fetch', fetchMock)
    renderAt('/register')

    fireEvent.change(await screen.findByLabelText('Full name'), { target: { value: 'Test Buyer' } })
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'buyer@example.com' } })
    fireEvent.change(screen.getByLabelText(/Password/), { target: { value: 'a sufficiently long password' } })
    fireEvent.click(screen.getByRole('button', { name: /Create account/ }))

    await waitFor(() => expect(screen.getByText('No live products yet')).toBeTruthy())
    const registerCall = fetchMock.mock.calls.find(([path]) => path === '/api/auth/register')
    expect(JSON.parse(registerCall?.[1]?.body as string)).toMatchObject({
      fullName: 'Test Buyer',
      email: 'buyer@example.com',
      role: 'customer',
    })
  })

  it('keeps customer profile updates in browser-local storage', () => {
    renderAt('/profile')
    const form = screen.getByLabelText('Full name').closest('form')
    expect(form).not.toBeNull()

    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Test Buyer' } })
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'buyer@example.com' } })
    fireEvent.change(screen.getByLabelText('Mobile number'), { target: { value: '01712345678' } })
    fireEvent.submit(form!)

    expect(JSON.parse(localStorage.getItem('nahora-customer-profile') || 'null')).toMatchObject({
      name: 'Test Buyer',
      email: 'buyer@example.com',
      phone: '01712345678',
    })
  })

  it('adds an address as the new default without discarding existing addresses', async () => {
    renderAt('/addresses')
    fireEvent.click(screen.getByRole('button', { name: 'Add address' }))
    fireEvent.change(screen.getByLabelText('Address label'), { target: { value: 'Office' } })
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Test Buyer' } })
    fireEvent.change(screen.getByLabelText('Mobile number'), { target: { value: '01712345678' } })
    fireEvent.change(screen.getByLabelText('Street address'), { target: { value: 'House 10, Road 2' } })
    fireEvent.change(screen.getByLabelText('Postal code'), { target: { value: '1205' } })
    fireEvent.click(screen.getByLabelText(/Set as default delivery address/))
    fireEvent.click(screen.getByRole('button', { name: 'Save address' }))

    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem('nahora-customer-addresses') || '[]')
      expect(saved).toHaveLength(3)
      expect(saved.find((address: { label: string }) => address.label === 'Office')).toMatchObject({
        phone: '01712345678',
        isDefault: true,
      })
      expect(saved.filter((address: { isDefault: boolean }) => address.isDefault)).toHaveLength(1)
    })
  })

  it('persists a merchant product draft without replacing existing listings', async () => {
    renderAt('/merchant/products')
    fireEvent.click(screen.getByRole('button', { name: 'Add product' }))
    fireEvent.change(screen.getByLabelText('Product name'), { target: { value: 'Regression Test Panjabi' } })
    fireEvent.change(screen.getByLabelText('Price (BDT)'), { target: { value: '1800' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save preview' }))

    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem('nahora-demo-records-products') || '[]')
      expect(saved.some((record: { name: string; amount: string }) =>
        record.name === 'Regression Test Panjabi' && record.amount === '৳1,800')).toBe(true)
      expect(saved.some((record: { name: string }) => record.name === 'Handwoven Jamdani Saree')).toBe(true)
    })
  })

  it('persists an inventory adjustment and its calculated stock status', async () => {
    renderAt('/merchant/inventory')
    fireEvent.click(screen.getByRole('button', { name: 'Adjust stock' }))
    fireEvent.change(screen.getByLabelText('Product'), { target: { value: 'Terracotta Vase' } })
    fireEvent.change(screen.getByLabelText('New quantity'), { target: { value: '2' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save preview' }))

    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem('nahora-demo-records-inventory') || '[]')
      expect(saved.find((record: { name: string }) => record.name.startsWith('Terracotta Vase'))).toMatchObject({
        amount: '2 units',
        status: 'Low stock',
      })
    })
  })

  it('applies the sample cart coupon and persists only its demo code', async () => {
    renderAt('/cart')
    fireEvent.change(screen.getByLabelText('Coupon code'), { target: { value: 'NAHORA10' } })
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }))

    await waitFor(() => {
      expect(localStorage.getItem('nahora-cart-coupon')).toBe('NAHORA10')
      expect(screen.getByText('Sample discount · NAHORA10')).toBeTruthy()
    })
  })

  it('keeps checkout as a preview and does not create an order record', async () => {
    renderAt('/checkout')
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Test Buyer' } })
    fireEvent.change(screen.getByLabelText('Mobile number'), { target: { value: '01712345678' } })
    fireEvent.change(screen.getByLabelText('Delivery address'), { target: { value: 'House 10, Road 2, Mirpur' } })
    fireEvent.change(screen.getByLabelText('District'), { target: { value: 'Dhaka' } })
    fireEvent.click(screen.getByRole('button', { name: /Review order preview/ }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Your orders' })).toBeTruthy()
      expect(localStorage.getItem('nahora-customer-orders')).toBeNull()
    })
  })

  it('marks demo notifications read without deleting their history', async () => {
    renderAt('/notifications-center')
    fireEvent.click(screen.getByRole('button', { name: 'Mark all as read' }))

    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem('nahora-demo-notifications') || '[]')
      expect(saved.length).toBe(12)
      expect(saved.every((notice: { read: boolean }) => notice.read)).toBe(true)
    })
  })

  it('translates the admin audit screen when the language is switched to Bengali', async () => {
    renderAt('/admin/audit')

    fireEvent.click(screen.getByRole('button', { name: 'Language' }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'নিরীক্ষা ইতিহাস' })).toBeTruthy()
    })
    expect(screen.getByPlaceholderText('প্রশাসনিক নিরীক্ষার ইতিহাস খুঁজুন...')).toBeTruthy()
    expect(screen.getByText(/ক্যাম্পেইনের খসড়া পর্যালোচনা করা হয়েছে/)).toBeTruthy()
    expect(screen.getByText('ব্যবহারকারী বাছাই')).toBeTruthy()
    expect(localStorage.getItem('nahora-language')).toBe('bn')
  })
})
