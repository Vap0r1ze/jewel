const Command = require('../services/Command')

class Help extends Command {
  get name () {
    return 'help'
  }
  get description () {
    return 'Get help with commands'
  }
  handle (msg, args) {
    msg.channel.createMessage([
      '__**Command List**__',
      ...this.commands.map(cmd => `\`${cmd.name}\`  ${cmd.description || '**missing description**'}`)
    ].join('\n'))
  }
}
module.exports = Help
