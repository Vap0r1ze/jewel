let e = module.exports = {}
const moment = require('moment-timezone')
e.run = async function () {
  var args = []
  for (var arg of this.args) {
    args.push(await this.process(arg, this))
  }
  let format = args[0] || 'LTS'
  let timestamp = parseInt(args[1]) || Date.now()
  let timezone = args[2] || 'Asia/Singapore'
  return moment(timestamp).tz(timezone).format(format)
}
