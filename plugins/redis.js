let e = module.exports = {}

const redis = require('redis')
Promise.promisifyAll(redis)

e.init = function (Bot) {
  let r = redis.createClient(process.env.REDIS_PORT)
  r.on('error', err => {
    return Bot.util.logger.error('REDIS', err)
  })
  r.on('connect', () => {
    Bot.util.logger.log('REDIS', 'Connected to server')
  })
  Bot.db = r
}
