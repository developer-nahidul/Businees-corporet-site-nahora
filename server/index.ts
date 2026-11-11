import 'dotenv/config'
import { createApp, bootstrapAdmin } from './app.js'
import { createDatabase } from './db.js'

const database = await createDatabase()
if (process.env.NODE_ENV === 'production' && (!process.env.NAHORA_ADMIN_EMAIL || !process.env.NAHORA_ADMIN_PASSWORD)) {
  await database.close()
  throw new Error('Production startup requires NAHORA_ADMIN_EMAIL and NAHORA_ADMIN_PASSWORD to bootstrap the platform administrator.')
}
await bootstrapAdmin(database, process.env.NAHORA_ADMIN_EMAIL, process.env.NAHORA_ADMIN_PASSWORD)

const host = process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1')
const port = Number(process.env.PORT || 3001)
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be a valid TCP port.')

const server = createApp(database).listen(port, host, () => {
  console.log(`NAHORA API listening on http://${host}:${port}`)
})

function shutdown() {
  server.close((error) => {
    void database.close().then(() => {
      if (error) {
        console.error('Error while shutting down the NAHORA API:', error)
        process.exitCode = 1
      }
    }).catch((closeError) => {
      console.error('Error while closing the NAHORA database:', closeError)
      process.exitCode = 1
    })
  })
}

process.once('SIGINT', shutdown)
process.once('SIGTERM', shutdown)
