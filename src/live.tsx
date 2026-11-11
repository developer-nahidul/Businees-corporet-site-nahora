import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import type { FormEvent } from 'react'
import { ArrowRight, LoaderCircle, PackageCheck, ShieldCheck, Store } from 'lucide-react'
import { Button, PageHeader, Pill } from './components'
import { apiRequest } from './api'
import { useAuth, type AuthUser } from './auth'

type LiveProduct = {
  id: string
  name: string
  description: string
  price: number
  stock: number
  imageUrl: string | null
  storeName?: string
  status?: 'active' | 'archived'
}

type LiveOrder = {
  id: string
  orderId?: string
  status: string
  subtotal: number
  deliveryFee: number
  createdAt?: string
  phone?: string
  customerName?: string
  address?: string
  district?: string
  items: Array<{ productName: string; unitPrice: number; quantity: number; storeName?: string }>
}

function formatTaka(amount: number) {
  return `৳${amount.toLocaleString('en-BD')}`
}

function LoadingPanel() {
  return <p className="live-state"><LoaderCircle size={16} className="live-spinner" /> Loading secure server data…</p>
}

function ErrorPanel({ message }: { message: string }) {
  return <p className="live-state live-error" role="alert">{message}</p>
}

export function RequireRole({ role, children }: { role: AuthUser['role']; children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <LoadingPanel />
  if (!user) return <Navigate to="/login" replace state={{ returnTo: location.pathname }} />
  if (user.role !== role) return <div className="live-state live-error" role="alert">This workspace is not available for your account.</div>
  if (role === 'merchant' && user.storeStatus !== 'approved') {
    return <div className="live-state"><Store size={20} /><span>Your merchant application is awaiting platform approval. The marketplace can’t publish your products until it is approved.</span><Pill tone="demo">Pending review</Pill></div>
  }
  return children
}

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { user, loading, error, login, register, clearError } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [role, setRole] = useState<'customer' | 'merchant'>('customer')
  if (loading) return <div className="public-page content-wrap"><LoadingPanel /></div>
  if (user) return <Navigate to={user.role === 'merchant' ? '/merchant/live' : user.role === 'admin' ? '/admin/live-merchants' : '/shop'} replace />

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    clearError()
    setFormError(null)
    setSubmitting(true)
    const form = new FormData(event.currentTarget)
    try {
      const current = mode === 'login'
        ? await login(String(form.get('email')), String(form.get('password')))
        : await register({
          email: String(form.get('email')),
          password: String(form.get('password')),
          fullName: String(form.get('fullName')),
          phone: String(form.get('phone') || ''),
          role: String(form.get('role')) as 'customer' | 'merchant',
          ...(form.get('role') === 'merchant' ? { storeName: String(form.get('storeName') || '') } : {}),
        })
      const returnTo = (location.state as { returnTo?: unknown } | null)?.returnTo
      navigate(typeof returnTo === 'string' && returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : current.role === 'merchant' ? '/merchant/live' : current.role === 'admin' ? '/admin/live-merchants' : '/shop', { replace: true })
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'The request could not be completed.')
    } finally {
      setSubmitting(false)
    }
  }

  return <div className="public-page content-wrap live-auth-page">
    <div className="live-auth-card">
      <Pill tone="demo">NAHORA account</Pill>
      <h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
      <p>Accounts and sessions are stored securely by the NAHORA server.</p>
      {(formError || error) && <ErrorPanel message={formError || error || ''} />}
      <form className="live-form" onSubmit={(event) => void submit(event)}>
        {mode === 'register' && <>
          <label>Full name<input name="fullName" autoComplete="name" minLength={2} maxLength={100} required /></label>
          <label>Mobile number<input name="phone" type="tel" autoComplete="tel" placeholder="01XXXXXXXXX" pattern="(\+?88)?01[3-9][0-9]{8}" /></label>
          <label>Account type<select name="role" value={role} onChange={(event) => setRole(event.target.value as 'customer' | 'merchant')}><option value="customer">Customer</option><option value="merchant">Merchant</option></select></label>
          <label>Store name <span className="live-muted">(required for merchants)</span><input name="storeName" minLength={2} maxLength={100} required={role === 'merchant'} disabled={role !== 'merchant'} /></label>
        </>}
        <label>Email address<input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
        <label>Password<input name="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={mode === 'login' ? 1 : 12} maxLength={128} required />{mode === 'register' && <small>Use at least 12 characters.</small>}</label>
        <Button type="submit" disabled={submitting}>{submitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'} <ArrowRight size={15} /></Button>
      </form>
      <p className="live-auth-switch">{mode === 'login' ? 'New to NAHORA?' : 'Already registered?'} <Link to={mode === 'login' ? '/register' : '/login'}>{mode === 'login' ? 'Create account' : 'Sign in'}</Link></p>
    </div>
  </div>
}

export function LiveMarketplacePage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<LiveProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [placing, setPlacing] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [delivery, setDelivery] = useState({ fullName: '', phone: '', address: '', district: '' })
  const navigate = useNavigate()

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiRequest<{ products: LiveProduct[] }>('/api/products')
      setProducts(result.products)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load marketplace products.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void reload() }, [reload])

  async function placeOrder(product: LiveProduct) {
    if (!user) {
      navigate('/login', { state: { returnTo: '/shop' } })
      return
    }
    const fullName = delivery.fullName.trim() || user.fullName
    const quantity = quantities[product.id] || 1
    if (fullName.length < 2 || !/^(?:\+?88)?01[3-9]\d{8}$/.test(delivery.phone.trim()) || delivery.address.trim().length < 8 || delivery.district.trim().length < 2) {
      setError('Enter your name, valid Bangladesh mobile number, full address, and district before ordering.')
      return
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > Math.min(product.stock, 99)) {
      setError('Choose a valid quantity that is currently in stock.')
      return
    }
    setPlacing(product.id)
    setError(null)
    setNotice(null)
    try {
      const result = await apiRequest<{ order: { orderId: string; total: number } }>('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          fullName,
          phone: delivery.phone.trim(),
          address: delivery.address.trim(),
          district: delivery.district.trim(),
          paymentMethod: 'cod',
          items: [{ productId: product.id, quantity }],
        }),
      })
      setNotice(`Order ${result.order.orderId} was placed. Total: ${formatTaka(result.order.total)}.`)
      await reload()
      navigate('/orders/live')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to place the order.')
    } finally {
      setPlacing(null)
    }
  }

  return <div className="public-page content-wrap live-marketplace">
    <PageHeader eyebrow="CONNECTED MARKETPLACE" title="Shop live merchant listings" description="Products, stock and order totals are read from the NAHORA server. Cash on delivery is the only enabled payment method." actions={<Pill tone="active">Server-backed</Pill>} />
    {notice && <p className="live-state" role="status">{notice}</p>}
    {error && <ErrorPanel message={error} />}
    {!loading && products.length > 0 && <section className="live-section">
      <h2>Delivery details</h2>
      <div className="live-form live-delivery-form">
        <label>Full name<input autoComplete="name" required value={delivery.fullName || user?.fullName || ''} onChange={(event) => setDelivery((current) => ({ ...current, fullName: event.target.value }))} /></label>
        <label>Bangladesh mobile<input autoComplete="tel" inputMode="tel" placeholder="01XXXXXXXXX" required value={delivery.phone} onChange={(event) => setDelivery((current) => ({ ...current, phone: event.target.value }))} /></label>
        <label className="live-span-two">Delivery address<input autoComplete="street-address" required value={delivery.address} onChange={(event) => setDelivery((current) => ({ ...current, address: event.target.value }))} /></label>
        <label>District<input autoComplete="address-level1" required value={delivery.district} onChange={(event) => setDelivery((current) => ({ ...current, district: event.target.value }))} /></label>
      </div>
    </section>}
    {loading ? <LoadingPanel /> : products.length === 0 ? <div className="live-empty"><PackageCheck size={24} /><h2>No live products yet</h2><p>Approved merchants can publish products from their server-backed workspace.</p><Link className="button button-outline" to="/register">Open a merchant account</Link></div> : <div className="live-product-grid">
      {products.map((product) => <article className="live-product-card" key={product.id}>
        {product.imageUrl && <img src={product.imageUrl} alt="" loading="lazy" />}
        <div><Pill tone="neutral">{product.storeName}</Pill><h2>{product.name}</h2><p>{product.description}</p><strong>{formatTaka(product.price)}</strong><small>{product.stock} in stock</small>
          <label>Quantity<input type="number" min={1} max={Math.min(product.stock, 99)} value={quantities[product.id] || 1} onChange={(event) => setQuantities((current) => ({ ...current, [product.id]: Number(event.target.value) }))} /></label>
          <Button disabled={placing === product.id || product.stock < 1} onClick={() => void placeOrder(product)}>{placing === product.id ? 'Placing order…' : 'Place COD order'}</Button>
        </div>
      </article>)}
    </div>}
  </div>
}

export function LiveMerchantPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<LiveProduct[]>([])
  const [orders, setOrders] = useState<LiveOrder[]>([])
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const reload = useCallback(async () => {
    const [productResult, orderResult] = await Promise.all([
      apiRequest<{ products: LiveProduct[] }>('/api/merchant/products'),
      apiRequest<{ orders: LiveOrder[] }>('/api/merchant/orders'),
    ])
    setProducts(productResult.products)
    setOrders(orderResult.orders)
  }, [])

  useEffect(() => {
    void reload().catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Unable to load merchant records.'))
  }, [reload])

  async function createProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    setBusy(true)
    setError(null)
    setNotice(null)
    const form = new FormData(formElement)
    try {
      await apiRequest('/api/merchant/products', {
        method: 'POST',
        body: JSON.stringify({
          name: form.get('name'),
          description: form.get('description'),
          price: Number(form.get('price')),
          stock: Number(form.get('stock')),
        }),
      })
      formElement.reset()
      setNotice('Product saved to the shared marketplace database.')
      await reload()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save product.')
    } finally {
      setBusy(false)
    }
  }

  async function updateOrder(order: LiveOrder, status: string) {
    setError(null)
    try {
      await apiRequest(`/api/merchant/orders/${order.id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
      setNotice(`Order status changed to ${status}.`)
      await reload()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to update order.')
    }
  }

  return <div className="public-page content-wrap live-console">
    <PageHeader eyebrow="MERCHANT WORKSPACE · LIVE" title={`Welcome, ${user?.fullName || 'merchant'}`} description="Manage server-backed listings and customer orders. Listing changes are kept separately from the sample preview screens." actions={<Pill tone="active">Merchant</Pill>} />
    {error && <ErrorPanel message={error} />}
    {notice && <p className="live-state" role="status">{notice}</p>}
    <section className="live-section">
      <h2>Create a product listing</h2>
      <form className="live-form live-product-form" onSubmit={(event) => void createProduct(event)}>
        <label>Product name<input name="name" minLength={2} maxLength={160} required /></label>
        <label>Price (BDT)<input name="price" type="number" min={1} max={10000000} step={1} required /></label>
        <label>Available stock<input name="stock" type="number" min={0} max={1000000} step={1} required /></label>
        <label className="live-span-two">Description<textarea name="description" minLength={5} maxLength={4000} rows={3} required /></label>
        <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Publish listing'}</Button>
      </form>
      <h3>Your listings ({products.length})</h3>
      <div className="live-record-list">{products.map((product) => <div className="live-record" key={product.id}><span><b>{product.name}</b><small>{formatTaka(product.price)} · {product.stock} in stock</small></span><Pill tone={product.status === 'active' ? 'active' : 'neutral'}>{product.status}</Pill></div>)}</div>
    </section>
    <section className="live-section">
      <h2>Customer orders ({orders.length})</h2>
      {orders.length === 0 ? <p className="live-muted">New COD orders will appear here.</p> : <div className="live-record-list">{orders.map((order) => {
        const nextStatus: Record<string, string> = { pending: 'confirmed', confirmed: 'packing', packing: 'shipped', shipped: 'delivered' }
        return <article className="live-order-card" key={order.id}>
          <div className="live-record"><span><b>Order {order.orderId?.slice(0, 8)}</b><small>{order.customerName} · {order.phone} · {order.address}, {order.district}</small></span><Pill tone="active">{order.status}</Pill></div>
          <p>{order.items.map((item) => `${item.productName} × ${item.quantity}`).join(', ')}</p>
          <b>{formatTaka(order.subtotal + order.deliveryFee)}</b>
          <div className="live-actions">
            {nextStatus[order.status] && <Button variant="outline" onClick={() => void updateOrder(order, nextStatus[order.status])}>Mark {nextStatus[order.status]}</Button>}
            {['pending', 'confirmed'].includes(order.status) && <Button variant="ghost" onClick={() => void updateOrder(order, 'cancelled')}>Cancel order</Button>}
          </div>
        </article>
      })}</div>}
    </section>
  </div>
}

export function LiveCustomerOrdersPage() {
  const [orders, setOrders] = useState<LiveOrder[]>([])
  const [error, setError] = useState<string | null>(null)
  const reload = useCallback(() => apiRequest<{ orders: LiveOrder[] }>('/api/orders').then((result) => setOrders(result.orders)), [])
  useEffect(() => {
    void reload().catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Unable to load orders.'))
  }, [reload])

  async function cancelOrder(orderId: string) {
    setError(null)
    try {
      await apiRequest(`/api/orders/${orderId}/cancel`, { method: 'POST' })
      await reload()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to cancel the order.')
    }
  }

  return <div className="public-page content-wrap live-console">
    <PageHeader eyebrow="CUSTOMER ACCOUNT · LIVE" title="Your orders" description="Order records and delivery status are retrieved from the NAHORA server." actions={<Pill tone="active">Server-backed</Pill>} />
    {error && <ErrorPanel message={error} />}
    {orders.length === 0 ? <div className="live-empty"><PackageCheck size={24} /><h2>No orders yet</h2><Link className="button button-primary" to="/shop">Explore live products</Link></div> : <div className="live-record-list">{orders.map((order) => <article className="live-order-card" key={order.id}>
      <div className="live-record"><span><b>Order {order.id.slice(0, 8)}</b><small>{order.createdAt || ''} · {order.district}</small></span><Pill tone="active">{order.status}</Pill></div>
      <p>{order.items.map((item) => `${item.productName} × ${item.quantity}`).join(', ')}</p>
      <b>{formatTaka(order.subtotal + order.deliveryFee)} · Cash on delivery</b>
      {order.status === 'pending' && <Button variant="outline" onClick={() => void cancelOrder(order.id)}>Cancel pending order</Button>}
    </article>)}</div>}
  </div>
}

type PendingMerchant = { id: string; email: string; fullName: string; storeName: string; createdAt: string }

export function LiveMerchantApprovalsPage() {
  const [merchants, setMerchants] = useState<PendingMerchant[]>([])
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const reload = useCallback(() => apiRequest<{ merchants: PendingMerchant[] }>('/api/admin/merchants/pending').then((result) => setMerchants(result.merchants)), [])
  useEffect(() => {
    void reload().catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Unable to load merchant applications.'))
  }, [reload])

  async function approve(merchant: PendingMerchant) {
    setError(null)
    try {
      await apiRequest(`/api/admin/merchants/${merchant.id}/approve`, { method: 'POST' })
      setNotice(`${merchant.storeName} was approved.`)
      await reload()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to approve merchant.')
    }
  }

  return <div className="public-page content-wrap live-console">
    <PageHeader eyebrow="PLATFORM ADMIN · LIVE" title="Merchant applications" description="Approving an application enables that merchant account to publish products and process orders." actions={<Pill tone="neutral"><ShieldCheck size={13} /> Admin only</Pill>} />
    {error && <ErrorPanel message={error} />}
    {notice && <p className="live-state" role="status">{notice}</p>}
    {merchants.length === 0 ? <p className="live-state">There are no pending merchant applications.</p> : <div className="live-record-list">{merchants.map((merchant) => <article className="live-record" key={merchant.id}>
      <span><b>{merchant.storeName}</b><small>{merchant.fullName} · {merchant.email}</small></span>
      <Button onClick={() => void approve(merchant)}>Approve merchant</Button>
    </article>)}</div>}
  </div>
}
