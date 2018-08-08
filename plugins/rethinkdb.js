let e = module.exports = {}

const r = require('rethinkdb')

e.init = function (Bot) {
  r.connect({ host: '0.0.0.0', port: process.env.REDIS_PORT }, function (error) {
    if (error)
      return Bot.util.logger.error('RDB', error.message)
    Bot.util.logger.log('RDB', 'Connected to server')
    Bot.db = r
  })
}
