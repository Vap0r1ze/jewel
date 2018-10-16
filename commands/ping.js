const Command = require('../services/Command')

class Ping extends Command {
  get name () {
    return 'ping'
  }
  handle (msg, args) {
    msg.channel.createMessage(`<@${msg.author.id}>, Pong!`)
  }
}
module.exports = Ping
