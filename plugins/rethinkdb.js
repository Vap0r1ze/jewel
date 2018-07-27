let e = module.exports = {}

const r = require('rethinkdb')

e.init = function (Bot) {
  r.connect({ host: 'localhost', port: 28015 }, function (error, connection) {
    if (error)
      return Bot.util.logger.error('RDB', error)
    Bot.util.logger.log('RDB', 'Connected to server')
    Bot.db = r
    Bot.db.connection = connection
  })
}
