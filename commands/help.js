const Command = require('../services/Command')

class Help extends Command {
  get name () {
    return 'help'
  }
  get description () {
    return 'Get help with commands'
  }
  handle (msg, args) {
    const { PREFIX, DEVELOPERS } = process.env
    const isDeveloper = DEVELOPERS.includes(msg.author.id)
    const cmd = this.ctx.commands[args[0]]
    if (args[0] && cmd && 2*cmd.isDeveloper + isDeveloper !== 2) {
      return msg.channel.createMessage({
        embed: {
          color: this.meColor(msg),
          description: `\`${PREFIX}${`${cmd.name} ${cmd.usage}`.trim()}\`\n${cmd.description}`
        }
      })
    }

    const visibleCmds = Object.values(this.ctx.commands)
      .filter(cmd => !(cmd.isDeveloper || cmd.isHidden))
    const categories = visibleCmds.map(cmd => cmd.category)
      .filter((c, i, a) => a.indexOf(c) === i).sort()
    const categoryFields = []
    for (const category of categories) {
      const cmds = visibleCmds.filter(cmd => cmd.category === category)
      categoryFields.push({
        name: category,
        value: cmds.map(cmd => `\`${cmd.name}\``).join(' '),
        inline: true
      })
    }

    msg.channel.createMessage({
      embed: {
        color: this.meColor(msg),
        description: `Type \`${PREFIX}help [command]\` for more help`,
        fields: categoryFields
      }
    })

  }
}
module.exports = Help
