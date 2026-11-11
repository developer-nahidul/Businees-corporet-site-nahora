import { randomUUID } from 'node:crypto'
import { resolve } from 'node:path'
import express, { type NextFunction, type Request, type Response } from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import { z } from 'zod'
import type { AppDatabase } from './db.js'
import {
  clearSessionCookie, createSession, hashPassword, hashSessionToken, requireRole, requireUser,
  setSessionCookie, SESSION_COOKIE, verifyPassword,
} from './security.js'
import type { AuthenticatedUser } from './security.js'

const registerSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(12).max(128),
  fullName: z.string().trim().min(2).max(100),
  phone: z.string().trim().regex(/^(?:\+?88)?01[3-9]\d{8}$/).optional().or(z.literal('')),
  role: z.enum(['customer', 'merchant']),
  storeName: z.string().trim().min(2).max(100).optional(),
}).strict().refine((value) => value.role !== 'merchant' || Boolean(value.storeName), {
  message: 'A store name is required for a merchant account.',
  path: ['storeName'],
})

const loginSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(128),
}).strict()

const productSchema = z.object({
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().min(5).max(4000),
  price: z.number().int().positive().max(10_000_000),
  stock: z.number().int().min(0).max(1_000_000),
  imageUrl: z.url().max(2048).refine((value) => {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname === 'images.unsplash.com'
  }).optional(),
}).strict()

const orderSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  phone: z.string().trim().regex(/^(?:\+?88)?01[3-9]\d{8}$/),
  address: z.string().trim().min(8).max(500),
  district: z.string().trim().min(2).max(100),
  postalCode: z.string().trim().max(20).default(''),
  deliverySpeed: z.enum(['standard', 'priority']).default('standard'),
  paymentMethod: z.literal('cod'),
  items: z.array(z.object({
    productId: z.uuid(),
    quantity: z.number().int().min(1).max(99),
  }).strict()).min(1).max(50),
}).strict().refine((value) => new Set(value.items.map((item) => item.productId)).size === value.items.length, {
  message: 'Each product may only appear once in the order.',
  path: ['items'],
})

const orderStatusSchema = z.object({
  status: z.enum(['confirmed', 'packing', 'shipped', 'delivered', 'cancelled']),
}).strict()

class ApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message)
  }
}

function currentUser(request: Request) {
  if (!request.user) throw new ApiError(401, 'Authentication required.')
  return request.user
}

function validate<T>(schema: z.ZodType<T>, request: Request, response: Response): T | undefined {
  const parsed = schema.safeParse(request.body)
  if (!parsed.success) {
    response.status(400).json({
      error: 'Request validation failed.',
      details: parsed.error.issues.map(({ path, message }) => ({ path: path.join('.'), message })),
    })
    return undefined
  }
  return parsed.data
}

export async function bootstrapAdmin(database: AppDatabase, email: string | undefined, password: string | undefined) {
  if (!email && !password) return
  if (!email || !password || password.length < 12 || password.length > 128) {
    throw new Error('Set both NAHORA_ADMIN_EMAIL and a 12–128 character NAHORA_ADMIN_PASSWORD to bootstrap the platform administrator.')
  }
  if (await database.get("SELECT 1 FROM users WHERE role = 'admin' LIMIT 1")) return
  const normalizedEmail = email.trim().toLowerCase()
  if (!z.email().safeParse(normalizedEmail).success) throw new Error('NAHORA_ADMIN_EMAIL must be a valid email address.')
  const existingUser = await database.get<{ role: string }>('SELECT role FROM users WHERE email = ?', normalizedEmail)
  if (existingUser) throw new Error('NAHORA_ADMIN_EMAIL is already used by a non-admin account. Choose a different administrator email.')
  const passwordHash = await hashPassword(password)
  await database.run('INSERT INTO users (id, email, full_name, password_hash, role) VALUES (?, ?, ?, ?, ?)',
    randomUUID(), normalizedEmail, 'Platform Administrator', passwordHash, 'admin')
}

export function createApp(database: AppDatabase) {
  const app = express()
  app.disable('x-powered-by')
  app.use(helmet())
  app.use(express.json({ limit: '32kb', strict: true }))
  app.use((request, response, next) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      const origin = request.get('origin')
      if (origin) {
        try {
          if (new URL(origin).host !== request.get('host')) {
            response.status(403).json({ error: 'Cross-origin request rejected.' })
            return
          }
        } catch {
          response.status(403).json({ error: 'Invalid request origin.' })
          return
        }
      }
    }
    next()
  })

  const authLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false })
  const authenticated = requireUser(database)
  const merchant = [authenticated, requireRole('merchant')]
  const admin = [authenticated, requireRole('admin')]

  app.get('/api/health', async (_request, response, next) => {
    try {
      await database.get('SELECT 1 AS healthy')
      response.json({ status: 'ok' })
    } catch (error) {
      next(error)
    }
  })

  app.post('/api/auth/register', authLimit, async (request, response, next) => {
    try {
      const input = validate(registerSchema, request, response)
      if (!input) return
      const email = input.email.trim().toLowerCase()
      if (await database.get('SELECT 1 FROM users WHERE email = ?', email)) {
        response.status(409).json({ error: 'An account with this email already exists.' })
        return
      }
      const userId = randomUUID()
      const passwordHash = await hashPassword(input.password)
      await database.transaction(async (transaction) => {
        await transaction.run('INSERT INTO users (id, email, full_name, phone, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)',
          userId, email, input.fullName, input.phone || null, passwordHash, input.role)
        if (input.role === 'merchant') {
          await transaction.run('INSERT INTO merchant_stores (id, user_id, name, status) VALUES (?, ?, ?, ?)',
            randomUUID(), userId, input.storeName, 'pending')
        }
      })
      const token = await createSession(database, userId)
      setSessionCookie(response, token)
      response.status(201).json({
        user: { id: userId, email, fullName: input.fullName, role: input.role, storeStatus: input.role === 'merchant' ? 'pending' : null },
      })
    } catch (error) {
      next(error)
    }
  })

  app.post('/api/auth/login', authLimit, async (request, response, next) => {
    try {
      const input = validate(loginSchema, request, response)
      if (!input) return
      const account = await database.get<{
          id: string; email: string; fullName: string; role: 'customer' | 'merchant' | 'admin'; passwordHash: string
        }>('SELECT id, email, full_name AS "fullName", role, password_hash AS "passwordHash" FROM users WHERE email = ?',
        input.email.trim().toLowerCase())
      if (!account || !(await verifyPassword(input.password, account.passwordHash))) {
        response.status(401).json({ error: 'Email or password is incorrect.' })
        return
      }
      const store = await database.get<{ status: 'pending' | 'approved' | 'suspended' }>(
        'SELECT status FROM merchant_stores WHERE user_id = ?', account.id)
      const token = await createSession(database, account.id)
      setSessionCookie(response, token)
      response.json({
        user: { id: account.id, email: account.email, fullName: account.fullName, role: account.role, storeStatus: store?.status ?? null },
      })
    } catch (error) {
      next(error)
    }
  })

  app.post('/api/auth/logout', authenticated, async (request, response) => {
    const rawCookie = request.get('cookie') || ''
    const token = rawCookie.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1)
    if (token) await database.run('DELETE FROM sessions WHERE token_hash = ?', hashSessionToken(token))
    clearSessionCookie(response)
    response.status(204).end()
  })

  app.get('/api/auth/me', async (request, response, next) => {
    const rawCookie = request.get('cookie') || ''
    const token = rawCookie.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1)
    if (!token || token.length > 200) {
      response.json({ user: null })
      return
    }
    try {
      const session = await database.get<AuthenticatedUser & { expiresAt: string }>(`
      SELECT users.id, users.email, users.full_name AS "fullName", users.role,
        merchant_stores.status AS "storeStatus", sessions.expires_at AS "expiresAt"
      FROM sessions
      JOIN users ON users.id = sessions.user_id
      LEFT JOIN merchant_stores ON merchant_stores.user_id = users.id
      WHERE sessions.token_hash = ?
      `, hashSessionToken(token))
      if (!session || Date.parse(session.expiresAt) <= Date.now()) {
        if (session) await database.run('DELETE FROM sessions WHERE token_hash = ?', hashSessionToken(token))
        clearSessionCookie(response)
        response.json({ user: null })
        return
      }
      const { expiresAt: _expiresAt, ...user } = session
      response.json({ user })
    } catch (error) {
      next(error)
    }
  })

  app.get('/api/products', async (_request, response, next) => {
    try {
      const products = await database.all(`
        SELECT products.id, products.name, products.description, products.price, products.stock,
          products.image_url AS "imageUrl", merchant_stores.name AS "storeName", products.created_at AS "createdAt"
        FROM products
        JOIN merchant_stores ON merchant_stores.user_id = products.merchant_id
        WHERE products.status = 'active' AND merchant_stores.status = 'approved'
        ORDER BY products.created_at DESC
        LIMIT 100
      `)
      response.json({ products })
    } catch (error) {
      next(error)
    }
  })

  app.get('/api/merchant/products', ...merchant, async (request, response, next) => {
    try {
      const user = currentUser(request)
      if (user.storeStatus !== 'approved') throw new ApiError(403, 'Your merchant account is waiting for platform approval.')
      const products = await database.all(`
        SELECT id, name, description, price, stock, image_url AS "imageUrl", status, created_at AS "createdAt"
        FROM products WHERE merchant_id = ? ORDER BY created_at DESC
      `, user.id)
      response.json({ products })
    } catch (error) {
      next(error)
    }
  })

  app.post('/api/merchant/products', ...merchant, async (request, response, next) => {
    try {
      const user = currentUser(request)
      if (user.storeStatus !== 'approved') throw new ApiError(403, 'Your merchant account is waiting for platform approval.')
      const input = validate(productSchema, request, response)
      if (!input) return
      const id = randomUUID()
      await database.run(`
        INSERT INTO products (id, merchant_id, name, description, price, stock, image_url, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
      `, id, user.id, input.name, input.description, input.price, input.stock, input.imageUrl ?? null)
      await database.run('INSERT INTO audit_events (id, actor_id, action, target_type, target_id) VALUES (?, ?, ?, ?, ?)',
        randomUUID(), user.id, 'product.created', 'product', id)
      response.status(201).json({ product: { id, ...input, status: 'active' } })
    } catch (error) {
      next(error)
    }
  })

  app.patch('/api/merchant/products/:productId', ...merchant, async (request, response, next) => {
    try {
      const user = currentUser(request)
      if (user.storeStatus !== 'approved') throw new ApiError(403, 'Your merchant account is waiting for platform approval.')
      const input = validate(productSchema.partial().strict(), request, response)
      if (!input) return
      if (Object.keys(input).length === 0) throw new ApiError(400, 'Provide at least one product field to update.')
      const existing = await database.get('SELECT id FROM products WHERE id = ? AND merchant_id = ?', request.params.productId, user.id)
      if (!existing) throw new ApiError(404, 'Product not found.')
      const columns: Record<string, string> = { name: 'name', description: 'description', price: 'price', stock: 'stock', imageUrl: 'image_url' }
      const fields = Object.keys(input)
      const assignments = fields.map((field) => `${columns[field]} = ?`).join(', ')
      const values = fields.map((field) => input[field as keyof typeof input])
      await database.run(`UPDATE products SET ${assignments}, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ? AND merchant_id = ?`,
        ...values, request.params.productId, user.id)
      await database.run('INSERT INTO audit_events (id, actor_id, action, target_type, target_id) VALUES (?, ?, ?, ?, ?)',
        randomUUID(), user.id, 'product.updated', 'product', request.params.productId)
      response.json({ message: 'Product updated.' })
    } catch (error) {
      next(error)
    }
  })

  app.post('/api/orders', authenticated, async (request, response, next) => {
    try {
      const user = currentUser(request)
      if (user.role !== 'customer') throw new ApiError(403, 'Only customer accounts can place orders.')
      const input = validate(orderSchema, request, response)
      if (!input) return
      const orderId = randomUUID()
      const deliveryPerStore = input.deliverySpeed === 'priority' ? 220 : 120
      const order = await database.transaction(async (transaction) => {
        const lines: Array<{
          productId: string; quantity: number
          product: { id: string; name: string; price: number; stock: number; merchantId: string; storeStatus: string }
        }> = []
        for (const item of input.items) {
          const product = await transaction.get<{ id: string; name: string; price: number; stock: number; merchantId: string; storeStatus: string }>(`
            SELECT products.id, products.name, products.price, products.stock, products.merchant_id AS "merchantId",
              merchant_stores.status AS "storeStatus"
            FROM products JOIN merchant_stores ON merchant_stores.user_id = products.merchant_id
            WHERE products.id = ? AND products.status = 'active'
          `, item.productId)
          if (!product || product.storeStatus !== 'approved') throw new ApiError(404, `Product ${item.productId} is not available.`)
          if (product.merchantId === user.id) throw new ApiError(400, 'You cannot place an order for your own product.')
          if (product.stock < item.quantity) throw new ApiError(409, `${product.name} does not have enough stock.`)
          lines.push({ ...item, product })
        }
        const groups = new Map<string, typeof lines>()
        for (const line of lines) {
          const group = groups.get(line.product.merchantId) || []
          group.push(line)
          groups.set(line.product.merchantId, group)
        }
        const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0)
        const deliveryFee = groups.size * deliveryPerStore
        await transaction.run(`
          INSERT INTO orders (id, customer_id, full_name, phone, address, district, postal_code,
            delivery_speed, payment_method, payment_status, subtotal, delivery_fee, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'cod', 'unpaid', ?, ?, 'pending')
        `, orderId, user.id, input.fullName, input.phone, input.address, input.district,
          input.postalCode, input.deliverySpeed, subtotal, deliveryFee)
        for (const [merchantId, group] of groups) {
          const merchantOrderId = randomUUID()
          const merchantSubtotal = group.reduce((sum, line) => sum + line.product.price * line.quantity, 0)
          await transaction.run(`
            INSERT INTO merchant_orders (id, order_id, merchant_id, subtotal, delivery_fee, status)
            VALUES (?, ?, ?, ?, ?, 'pending')
          `, merchantOrderId, orderId, merchantId, merchantSubtotal, deliveryPerStore)
          for (const line of group) {
            const result = await transaction.run('UPDATE products SET stock = stock - ?, updated_at = strftime(\'%Y-%m-%dT%H:%M:%fZ\', \'now\') WHERE id = ? AND stock >= ?',
              line.quantity, line.product.id, line.quantity)
            if (result.changes !== 1) throw new ApiError(409, `${line.product.name} stock changed. Please review your cart.`)
            await transaction.run(`
              INSERT INTO order_items (id, merchant_order_id, product_id, product_name, unit_price, quantity)
              VALUES (?, ?, ?, ?, ?, ?)
            `, randomUUID(), merchantOrderId, line.product.id, line.product.name, line.product.price, line.quantity)
          }
        }
        return { orderId, subtotal, deliveryFee, total: subtotal + deliveryFee, merchantOrders: groups.size }
      })
      response.status(201).json({ order })
    } catch (error) {
      next(error)
    }
  })

  app.get('/api/orders', authenticated, async (request, response, next) => {
    try {
      const user = currentUser(request)
      const orders = await database.all<{ id: string; status: string }>(`
        SELECT id, full_name AS "fullName", phone, address, district, postal_code AS "postalCode",
          delivery_speed AS "deliverySpeed", payment_method AS "paymentMethod", payment_status AS "paymentStatus",
          subtotal, delivery_fee AS "deliveryFee", status, created_at AS "createdAt"
        FROM orders WHERE customer_id = ? ORDER BY created_at DESC LIMIT 100
      `, user.id)
      const itemsQuery = `
        SELECT order_items.product_name AS "productName", order_items.unit_price AS "unitPrice",
          order_items.quantity, merchant_orders.status, merchant_stores.name AS "storeName"
        FROM merchant_orders
        JOIN merchant_stores ON merchant_stores.user_id = merchant_orders.merchant_id
        JOIN order_items ON order_items.merchant_order_id = merchant_orders.id
        WHERE merchant_orders.order_id = ?
      `
      const ordersWithItems = await Promise.all(orders.map(async (order) => ({
        ...order, items: await database.all(itemsQuery, order.id),
      })))
      response.json({ orders: ordersWithItems })
    } catch (error) {
      next(error)
    }
  })

  app.post('/api/orders/:orderId/cancel', authenticated, async (request, response, next) => {
    try {
      const user = currentUser(request)
      const lockSuffix = database.dialect === 'postgres' ? ' FOR UPDATE' : ''
      await database.transaction(async (transaction) => {
        const order = await transaction.get<{ id: string; status: string }>(
          `SELECT id, status FROM orders WHERE id = ? AND customer_id = ?${lockSuffix}`,
          request.params.orderId, user.id)
        if (!order) throw new ApiError(404, 'Order not found.')
        if (order.status !== 'pending') throw new ApiError(409, 'Only pending orders can be cancelled.')
        const childStatuses = await transaction.all<{ status: string }>(
          'SELECT status FROM merchant_orders WHERE order_id = ?', order.id)
        if (childStatuses.some(({ status }) => status !== 'pending' && status !== 'cancelled')) {
          throw new ApiError(409, 'An order cannot be cancelled after a merchant starts fulfillment.')
        }
        const items = await transaction.all<{ productId: string; quantity: number }>(`
          SELECT order_items.product_id AS "productId", order_items.quantity
          FROM merchant_orders JOIN order_items ON order_items.merchant_order_id = merchant_orders.id
          WHERE merchant_orders.order_id = ? AND merchant_orders.status != 'cancelled'
        `, order.id)
        for (const item of items) await transaction.run('UPDATE products SET stock = stock + ? WHERE id = ?', item.quantity, item.productId)
        await transaction.run("UPDATE orders SET status = 'cancelled', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?", order.id)
        await transaction.run("UPDATE merchant_orders SET status = 'cancelled', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE order_id = ? AND status = 'pending'", order.id)
      })
      response.status(204).end()
    } catch (error) {
      next(error)
    }
  })

  app.get('/api/merchant/orders', ...merchant, async (request, response, next) => {
    try {
      const user = currentUser(request)
      if (user.storeStatus !== 'approved') throw new ApiError(403, 'Your merchant account is waiting for platform approval.')
      const orders = await database.all<{ id: string; status: string }>(`
        SELECT merchant_orders.id, merchant_orders.order_id AS "orderId", merchant_orders.subtotal,
          merchant_orders.delivery_fee AS "deliveryFee", merchant_orders.status, merchant_orders.created_at AS "createdAt",
          orders.full_name AS "customerName", orders.phone, orders.address, orders.district
        FROM merchant_orders JOIN orders ON orders.id = merchant_orders.order_id
        WHERE merchant_orders.merchant_id = ? ORDER BY merchant_orders.created_at DESC LIMIT 100
      `, user.id)
      const itemsQuery = `
        SELECT product_name AS "productName", unit_price AS "unitPrice", quantity
        FROM order_items WHERE merchant_order_id = ?
      `
      const ordersWithItems = await Promise.all(orders.map(async (order) => ({
        ...order, items: await database.all(itemsQuery, order.id),
      })))
      response.json({ orders: ordersWithItems })
    } catch (error) {
      next(error)
    }
  })

  app.patch('/api/merchant/orders/:orderId', ...merchant, async (request, response, next) => {
    try {
      const user = currentUser(request)
      if (user.storeStatus !== 'approved') throw new ApiError(403, 'Your merchant account is waiting for platform approval.')
      const input = validate(orderStatusSchema, request, response)
      if (!input) return
      const lockSuffix = database.dialect === 'postgres' ? ' FOR UPDATE' : ''
      await database.transaction(async (transaction) => {
        const reference = await transaction.get<{ parentId: string }>(
          'SELECT order_id AS "parentId" FROM merchant_orders WHERE id = ? AND merchant_id = ?',
          request.params.orderId, user.id)
        if (!reference) throw new ApiError(404, 'Order not found.')
        await transaction.get(`SELECT id FROM orders WHERE id = ?${lockSuffix}`, reference.parentId)
        const order = await transaction.get<{ id: string; parentId: string; status: string }>(
          `SELECT id, order_id AS "parentId", status FROM merchant_orders WHERE id = ? AND merchant_id = ?${lockSuffix}`,
          request.params.orderId, user.id)
        if (!order) throw new ApiError(404, 'Order not found.')
        const allowed: Record<string, string[]> = {
          pending: ['confirmed', 'cancelled'],
          confirmed: ['packing', 'cancelled'],
          packing: ['shipped'],
          shipped: ['delivered'],
        }
        if (!allowed[order.status]?.includes(input.status)) throw new ApiError(409, `Cannot change an order from ${order.status} to ${input.status}.`)
        if (input.status === 'cancelled') {
          const items = await transaction.all<{ productId: string; quantity: number }>(
            'SELECT product_id AS "productId", quantity FROM order_items WHERE merchant_order_id = ?', order.id)
          for (const item of items) await transaction.run(
            'UPDATE products SET stock = stock + ? WHERE id = ?', item.quantity, item.productId)
        }
        await transaction.run("UPDATE merchant_orders SET status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?",
          input.status, order.id)
        const childStatuses = await transaction.all<{ status: string }>(
          'SELECT status FROM merchant_orders WHERE order_id = ?', order.parentId)
        const activeStatuses = childStatuses.map(({ status }) => status).filter((status) => status !== 'cancelled')
        const nextParentStatus = activeStatuses.length === 0
          ? 'cancelled'
          : ['pending', 'confirmed', 'packing', 'shipped', 'delivered'].find((status) => activeStatuses.includes(status)) || 'pending'
        await transaction.run("UPDATE orders SET status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?",
          nextParentStatus, order.parentId)
      })
      response.json({ message: 'Order status updated.' })
    } catch (error) {
      next(error)
    }
  })

  app.get('/api/admin/merchants/pending', ...admin, async (_request, response, next) => {
    try {
      const merchants = await database.all(`
        SELECT users.id, users.email, users.full_name AS "fullName", merchant_stores.name AS "storeName",
          merchant_stores.created_at AS "createdAt"
        FROM users JOIN merchant_stores ON merchant_stores.user_id = users.id
        WHERE merchant_stores.status = 'pending' ORDER BY merchant_stores.created_at ASC LIMIT 100
      `)
      response.json({ merchants })
    } catch (error) {
      next(error)
    }
  })

  app.post('/api/admin/merchants/:merchantId/approve', ...admin, async (request, response, next) => {
    try {
      const user = currentUser(request)
      await database.transaction(async (transaction) => {
        const result = await transaction.run("UPDATE merchant_stores SET status = 'approved' WHERE user_id = ? AND status = 'pending'",
          request.params.merchantId)
        if (result.changes !== 1) throw new ApiError(404, 'Pending merchant application not found.')
        await transaction.run('INSERT INTO audit_events (id, actor_id, action, target_type, target_id) VALUES (?, ?, ?, ?, ?)',
          randomUUID(), user.id, 'merchant.approved', 'merchant', request.params.merchantId)
      })
      response.status(204).end()
    } catch (error) {
      next(error)
    }
  })

  app.use('/api', (_request, response) => response.status(404).json({ error: 'API route not found.' }))

  if (process.env.NODE_ENV === 'production') {
    const frontendDirectory = resolve(process.cwd(), 'dist')
    app.use(express.static(frontendDirectory, { index: false }))
    app.use((request, response, next) => {
      if (request.method !== 'GET' || request.path.startsWith('/api/')) {
        next()
        return
      }
      response.sendFile(resolve(frontendDirectory, 'index.html'), (error) => {
        if (error) next(error)
      })
    })
  }

  app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    if (error instanceof ApiError) {
      response.status(error.status).json({ error: error.message })
      return
    }
    if (error instanceof SyntaxError && 'body' in error) {
      response.status(400).json({ error: 'Request body must be valid JSON.' })
      return
    }
    if (typeof error === 'object' && error !== null && 'type' in error && error.type === 'entity.too.large') {
      response.status(413).json({ error: 'Request body is too large.' })
      return
    }
    console.error('Unhandled API error:', error)
    response.status(500).json({ error: 'An unexpected server error occurred.' })
  })
  return app
}
