const Command = require('../services/Command')

class Help extends Command {
  get name () {
    return 'help'
  }
  get description () {
    return 'Get help with commands'
  }
  handle (msg) {
    const visibleCommands = Object.values(this.ctx.commands).filter(cmd => !cmd.developer && cmd.name !== 'help')
    msg.channel.createMessage([
      '__**Command List**__',
      ...visibleCommands.map(cmd => `\`${cmd.name}\`  ${cmd.description || '**missing description**'}`)
    ].join('\n'))
  }
}
module.exports = Help
