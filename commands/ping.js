const Command = require('../services/Command')

class Ping extends Command {
  get name () {
    return 'ping'
  }
  get description () {
    return 'Check the latency between the bot and discord'
  }
  handle (msg) {
    const before = Date.now()
    msg.channel.createMessage('Ping?').then(ping => {
      const after = Date.now()
      ping.edit(`Ping! \`${after - before}ms\``)
    })
  }
}
module.exports = Ping
