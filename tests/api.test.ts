import Database from 'better-sqlite3'
import supertest from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { bootstrapAdmin, createApp } from '../server/app'
import { createSqliteAppDatabase, initializeSqliteDatabase, type AppDatabase } from '../server/db'

describe('marketplace API', () => {
  let sqlite: Database.Database
  let database: AppDatabase
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    sqlite = new Database(':memory:')
    initializeSqliteDatabase(sqlite)
    database = createSqliteAppDatabase(sqlite)
    app = createApp(database)
  })

  afterEach(async () => {
    await database.close()
  })

  async function registerCustomer(email = 'buyer@example.com') {
    const response = await supertest(app).post('/api/auth/register').send({
      email,
      password: 'correct horse battery staple',
      fullName: 'Buyer Example',
      phone: '01712345678',
      role: 'customer',
    })
    expect(response.status).toBe(201)
    return { cookie: response.headers['set-cookie'][0].split(';')[0], user: response.body.user }
  }

  async function registerMerchant(email = 'seller@example.com') {
    const response = await supertest(app).post('/api/auth/register').send({
      email,
      password: 'merchant password 123',
      fullName: 'Seller Example',
      phone: '01812345678',
      role: 'merchant',
      storeName: 'Seller Store',
    })
    expect(response.status).toBe(201)
    return { cookie: response.headers['set-cookie'][0].split(';')[0], user: response.body.user }
  }

  async function approveMerchant(merchantId: string) {
    await bootstrapAdmin(database, 'owner@example.com', 'platform owner password')
    const login = await supertest(app).post('/api/auth/login').send({
      email: 'owner@example.com',
      password: 'platform owner password',
    })
    expect(login.status).toBe(200)
    const cookie = login.headers['set-cookie'][0].split(';')[0]
    const approval = await supertest(app).post(`/api/admin/merchants/${merchantId}/approve`).set('Cookie', cookie)
    expect(approval.status).toBe(204)
  }

  async function addProduct(cookie: string, input = {}) {
    return supertest(app).post('/api/merchant/products').set('Cookie', cookie).send({
      name: 'Handmade basket',
      description: 'A locally woven storage basket.',
      price: 1200,
      stock: 5,
      ...input,
    })
  }

  it('creates customer and pending merchant accounts without exposing password hashes', async () => {
    const customer = await registerCustomer()
    expect(customer.user).toMatchObject({ role: 'customer', storeStatus: null })
    expect(customer.user).not.toHaveProperty('passwordHash')

    const merchant = await registerMerchant()
    expect(merchant.user).toMatchObject({ role: 'merchant', storeStatus: 'pending' })
    expect((await supertest(app).get('/api/auth/me').set('Cookie', merchant.cookie)).body.user.storeStatus).toBe('pending')

    const passwordHash = await database.get<{ password_hash: string }>('SELECT password_hash FROM users WHERE id = ?', customer.user.id)
    expect(passwordHash.password_hash).not.toContain('correct horse battery staple')
    expect(passwordHash.password_hash).toContain(':')
  })

  it('rejects invalid roles, weak passwords, duplicate accounts, and cross-origin mutations', async () => {
    const weakPassword = await supertest(app).post('/api/auth/register').send({
      email: 'weak@example.com', password: 'short', fullName: 'Weak Person', role: 'customer',
    })
    expect(weakPassword.status).toBe(400)

    const privilegedRole = await supertest(app).post('/api/auth/register').send({
      email: 'admin@example.com', password: 'long enough secure password', fullName: 'Admin Person', role: 'admin',
    })
    expect(privilegedRole.status).toBe(400)

    await registerCustomer()
    const duplicate = await supertest(app).post('/api/auth/register').send({
      email: 'BUYER@example.com', password: 'another strong password', fullName: 'Another Buyer', role: 'customer',
    })
    expect(duplicate.status).toBe(409)

    const crossOrigin = await supertest(app).post('/api/auth/register').set('Origin', 'https://attacker.example').send({
      email: 'cross@example.com', password: 'another strong password', fullName: 'Cross Buyer', role: 'customer',
    })
    expect(crossOrigin.status).toBe(403)
  })

  it('requires approved merchant access and prevents users from modifying another store products', async () => {
    const seller = await registerMerchant()
    const pendingProduct = await addProduct(seller.cookie)
    expect(pendingProduct.status).toBe(403)

    await approveMerchant(seller.user.id)
    const created = await addProduct(seller.cookie)
    expect(created.status).toBe(201)
    expect(created.body.product).toMatchObject({ name: 'Handmade basket', price: 1200, stock: 5 })

    const secondSeller = await registerMerchant('other@example.com')
    await approveMerchant(secondSeller.user.id)
    const unauthorizedEdit = await supertest(app)
      .patch(`/api/merchant/products/${created.body.product.id}`)
      .set('Cookie', secondSeller.cookie)
      .send({ price: 1 })
    expect(unauthorizedEdit.status).toBe(404)
    expect((await supertest(app).get('/api/products')).body.products).toHaveLength(1)
  })

  it('calculates multi-merchant order totals on the server and restores stock when a pending order is cancelled', async () => {
    const sellerA = await registerMerchant()
    const sellerB = await registerMerchant('seller-b@example.com')
    await approveMerchant(sellerA.user.id)
    await approveMerchant(sellerB.user.id)
    const productA = await addProduct(sellerA.cookie, { price: 1000, stock: 3 })
    const productB = await addProduct(sellerB.cookie, { price: 500, stock: 4 })
    const customer = await registerCustomer()

    const placed = await supertest(app).post('/api/orders').set('Cookie', customer.cookie).send({
      fullName: 'Buyer Example',
      phone: '01712345678',
      address: 'House 8, Road 2, Dhanmondi',
      district: 'Dhaka',
      deliverySpeed: 'standard',
      paymentMethod: 'cod',
      items: [
        { productId: productA.body.product.id, quantity: 2 },
        { productId: productB.body.product.id, quantity: 1 },
      ],
    })
    expect(placed.status).toBe(201)
    expect(placed.body.order).toMatchObject({ subtotal: 2500, deliveryFee: 240, total: 2740, merchantOrders: 2 })
    expect(await database.get('SELECT stock FROM products WHERE id = ?', productA.body.product.id)).toMatchObject({ stock: 1 })

    const listed = await supertest(app).get('/api/orders').set('Cookie', customer.cookie)
    expect(listed.body.orders).toHaveLength(1)
    expect(listed.body.orders[0].items).toHaveLength(2)

    const sellerOrders = await supertest(app).get('/api/merchant/orders').set('Cookie', sellerA.cookie)
    const merchantCancellation = await supertest(app)
      .patch(`/api/merchant/orders/${sellerOrders.body.orders[0].id}`)
      .set('Cookie', sellerA.cookie)
      .send({ status: 'cancelled' })
    expect(merchantCancellation.status).toBe(200)
    expect((await supertest(app).get('/api/orders').set('Cookie', customer.cookie)).body.orders[0].status).toBe('pending')

    const cancelled = await supertest(app).post(`/api/orders/${placed.body.order.orderId}/cancel`).set('Cookie', customer.cookie)
    expect(cancelled.status).toBe(204)
    expect(await database.get('SELECT stock FROM products WHERE id = ?', productA.body.product.id)).toMatchObject({ stock: 3 })
    expect(await database.get('SELECT stock FROM products WHERE id = ?', productB.body.product.id)).toMatchObject({ stock: 4 })
  })

  it('does not create partial orders or change inventory when stock is insufficient', async () => {
    const seller = await registerMerchant()
    await approveMerchant(seller.user.id)
    const product = await addProduct(seller.cookie, { stock: 1 })
    const customer = await registerCustomer()

    const response = await supertest(app).post('/api/orders').set('Cookie', customer.cookie).send({
      fullName: 'Buyer Example',
      phone: '01712345678',
      address: 'House 8, Road 2, Dhanmondi',
      district: 'Dhaka',
      paymentMethod: 'cod',
      items: [{ productId: product.body.product.id, quantity: 2 }],
    })
    expect(response.status).toBe(409)
    expect(await database.get('SELECT COUNT(*) AS count FROM orders')).toMatchObject({ count: 0 })
    expect(await database.get('SELECT stock FROM products WHERE id = ?', product.body.product.id)).toMatchObject({ stock: 1 })
  })

  it('enforces customer, merchant, and admin permissions and revokes logged-out sessions', async () => {
    const customer = await registerCustomer()
    expect((await supertest(app).post('/api/merchant/products').set('Cookie', customer.cookie).send({})).status).toBe(403)
    expect((await supertest(app).post('/api/orders').send({})).status).toBe(401)

    const logout = await supertest(app).post('/api/auth/logout').set('Cookie', customer.cookie)
    expect(logout.status).toBe(204)
    expect((await supertest(app).get('/api/auth/me').set('Cookie', customer.cookie)).body.user).toBeNull()
  })
})
