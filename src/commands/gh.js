const Command = require('../services/Command')

class GitHub extends Command {
  get name () {
    return 'github'
  }
  get aliases () {
    return ['source','code','gh']
  }
  get isHidden () {
    return true
  }
  get description () {
    return 'Get a link to the sourcecode of this bot'
  }
  handle (msg) {
    msg.channel.createMessage(`<@${msg.author.id}>, <:github:786216616760573972> <https://github.com/Vap0r1ze/Jewel/tree/the-mirror>`)
  }
}
module.exports = GitHub
