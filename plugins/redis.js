const redis = require('redis')
Promise.promisifyAll(redis)

exports.init = function () {
  return new Promise((resolve, reject) => {
    let r = redis.createClient(process.env.REDIS_PORT)
    r.on('error', err => {
      this.util.logger.error('REDIS', err.message)
      reject()
    })
    r.on('connect', () => {
      this.util.logger.log('REDIS', 'Connected to cache')
      resolve()
    })
    this.cache = r
  })
}
