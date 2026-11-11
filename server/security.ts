import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import type { NextFunction, Request, Response } from 'express'
import type { AppDatabase } from './db.js'

const scryptAsync = promisify(scrypt)
export const SESSION_COOKIE = 'nahora_session'
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7

export type UserRole = 'customer' | 'merchant' | 'admin'
export type AuthenticatedUser = {
  id: string
  email: string
  fullName: string
  role: UserRole
  storeStatus: 'pending' | 'approved' | 'suspended' | null
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser
    }
  }
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const key = await scryptAsync(password, salt, 64) as Buffer
  return `${salt.toString('hex')}:${key.toString('hex')}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, keyHex] = stored.split(':')
  if (!saltHex || !keyHex || !/^[a-f\d]{32}$/i.test(saltHex) || !/^[a-f\d]{128}$/i.test(keyHex)) return false
  const expected = Buffer.from(keyHex, 'hex')
  const actual = await scryptAsync(password, Buffer.from(saltHex, 'hex'), expected.length) as Buffer
  return timingSafeEqual(actual, expected)
}

export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export async function createSession(database: AppDatabase, userId: string): Promise<string> {
  const token = randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString()
  await database.run('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)',
    hashSessionToken(token), userId, expiresAt)
  return token
}

export function setSessionCookie(response: Response, token: string) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  response.append('Set-Cookie', `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL_SECONDS}${secure}`)
}

export function clearSessionCookie(response: Response) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  response.append('Set-Cookie', `${SESSION_COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure}`)
}

export function requireUser(database: AppDatabase) {
  return async (request: Request, response: Response, next: NextFunction) => {
    const rawCookie = request.get('cookie') || ''
    const token = rawCookie.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1)
    if (!token || token.length > 200) {
      response.status(401).json({ error: 'Authentication required.' })
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
        response.status(401).json({ error: 'Session expired. Please sign in again.' })
        return
      }
      const { expiresAt: _expiresAt, ...user } = session
      request.user = user
      next()
    } catch (error) {
      next(error)
    }
  }
}

export function requireRole(...roles: UserRole[]) {
  return (request: Request, response: Response, next: NextFunction) => {
    if (!request.user || !roles.includes(request.user.role)) {
      response.status(403).json({ error: 'You do not have permission to perform this action.' })
      return
    }
    next()
  }
}
