import supertest from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { bootstrapAdmin, createApp } from '../server/app'
import { createPostgresDatabase, type AppDatabase } from '../server/db'

const connectionString = process.env.TEST_DATABASE_URL

describe.runIf(Boolean(connectionString))('PostgreSQL marketplace integration', () => {
  let database: AppDatabase
  let app: ReturnType<typeof createApp>

  beforeAll(async () => {
    database = await createPostgresDatabase(connectionString!)
    app = createApp(database)
  })

  beforeEach(async () => {
    await database.run('TRUNCATE TABLE audit_events, order_items, merchant_orders, orders, products, sessions, merchant_stores, users CASCADE')
  })

  afterAll(async () => {
    await database?.close()
  })

  it('migrates schema and preserves account, approval, stock, and COD order workflows', async () => {
    await bootstrapAdmin(database, 'owner@example.com', 'platform owner password')
    const health = await supertest(app).get('/api/health')
    expect(health.status).toBe(200)
    expect(health.body).toEqual({ status: 'ok' })

    const merchant = await supertest(app).post('/api/auth/register').send({
      email: 'seller@example.com',
      password: 'merchant password 123',
      fullName: 'Seller Example',
      phone: '01812345678',
      role: 'merchant',
      storeName: 'Seller Store',
    })
    expect(merchant.status).toBe(201)
    const merchantCookie = merchant.headers['set-cookie'][0].split(';')[0]

    const adminLogin = await supertest(app).post('/api/auth/login').send({
      email: 'owner@example.com',
      password: 'platform owner password',
    })
    expect(adminLogin.status).toBe(200)
    const approval = await supertest(app)
      .post(`/api/admin/merchants/${merchant.body.user.id}/approve`)
      .set('Cookie', adminLogin.headers['set-cookie'][0].split(';')[0])
    expect(approval.status).toBe(204)

    const product = await supertest(app).post('/api/merchant/products').set('Cookie', merchantCookie).send({
      name: 'Handmade basket',
      description: 'A locally woven storage basket.',
      price: 1200,
      stock: 3,
    })
    expect(product.status).toBe(201)

    const customer = await supertest(app).post('/api/auth/register').send({
      email: 'buyer@example.com',
      password: 'correct horse battery staple',
      fullName: 'Buyer Example',
      phone: '01712345678',
      role: 'customer',
    })
    expect(customer.status).toBe(201)

    const order = await supertest(app).post('/api/orders')
      .set('Cookie', customer.headers['set-cookie'][0].split(';')[0])
      .send({
        fullName: 'Buyer Example',
        phone: '01712345678',
        address: 'House 8, Road 2, Dhanmondi',
        district: 'Dhaka',
        paymentMethod: 'cod',
        items: [{ productId: product.body.product.id, quantity: 2 }],
      })
    expect(order.status).toBe(201)
    expect(order.body.order).toMatchObject({ subtotal: 2400, deliveryFee: 120, total: 2520 })
    expect(await database.get<{ stock: number }>('SELECT stock FROM products WHERE id = ?', product.body.product.id))
      .toMatchObject({ stock: 1 })

    const cancellation = await supertest(app)
      .post(`/api/orders/${order.body.order.orderId}/cancel`)
      .set('Cookie', customer.headers['set-cookie'][0].split(';')[0])
    expect(cancellation.status).toBe(204)
    expect(await database.get<{ stock: number }>('SELECT stock FROM products WHERE id = ?', product.body.product.id))
      .toMatchObject({ stock: 3 })
  })
})
