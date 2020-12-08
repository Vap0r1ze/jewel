const Command = require('../services/Command')

class Ping extends Command {
  get name () {
    return 'ping'
  }
  get description () {
    return 'check the delay between the bot and discord'
  }
  handle (msg, args) {
    const before = Date.now()
    msg.channel.createMessage(`<@${msg.author.id}>, Ping?`).then(ping => {
      const after = Date.now()
      ping.edit(`<@${msg.author.id}>, Pong! **${after - before}ms**`)
    })
  }
}
module.exports = Ping
