import Bot from '@/services/Bot'
import logger from '@/util/logger'
import chalk from 'chalk'
import fastify from 'fastify'
import cors from 'fastify-cors'

export default function createApi(this: Bot) {
  const api = fastify()

  api.register(cors)

  api.get('/', async (request, reply) => {
    reply.type('application/json').code(200)
    return { message: 'hello this is the api' }
  })

  api.listen(process.env.API_PORT, '0.0.0.0', (error, address) => {
    if (error) throw error
    logger.log('API', chalk`Server listening on {cyan.bold ${address}}`)
  })

  return api
}
