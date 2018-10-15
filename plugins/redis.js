let e = module.exports = {}

const redis = require('redis')
Promise.promisifyAll(redis)

e.init = function () {
  let r = redis.createClient(process.env.REDIS_PORT)
  r.on('error', err => {
    return this.util.logger.error('REDIS', err.message)
  })
  r.on('connect', () => {
    this.util.logger.log('REDIS', 'Connected to database')
  })
  this.db = r
}
