const Command = require('../services/Command')

class games extends Command {
  get name () {
    return 'games'
  }
  get category () {
    return 'Games'
  }
  get description () {
    return 'List all of the registered games'
  }
  handle (msg) {
    msg.channel.createMessage({
      embed: {
        color: this.meColor,
        title: 'Games',
        description: Object.values(this.ctx.games).map(g => `\`${g.name}\`  ${g.displayName}`).join('\n')
      }
    })
  }
}
module.exports = games
