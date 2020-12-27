const chalk = require('chalk')
const fastify = require('fastify')

exports.init = function () {
  const api = this.api = fastify()

  api.get('/', (request, reply) => {
    reply.type('application/json').code(200)
    return { message: 'hello this is the api' }
  })

  api.listen(process.env.API_PORT, '0.0.0.0', (error, address) => {
    if (error) throw error
    this.util.logger.log('API', chalk`Server listening on {cyan.bold ${address}}`)
  })
}
