import { EmbedField, Message } from 'eris'
import Command, { CommandArgs } from '../services/Command'

export default class HelpCommand extends Command {
  get name() {
    return 'help'
  }

  get description() {
    return 'Get help with commands'
  }

  handle(msg: Message, args: CommandArgs) {
    const { PREFIX, DEVELOPERS } = process.env
    const isDeveloper = DEVELOPERS.includes(msg.author.id)
    const cmd = this.ctx.commands[args[0] || '']
    if (args[0] && cmd && (!cmd.isDeveloper || isDeveloper)) {
      msg.channel.createMessage({
        embed: {
          color: this.meColor(msg),
          description: `\`${PREFIX}${`${cmd.name} ${cmd.usage}`.trim()}\`\n${cmd.description}`,
        },
      })
      return
    }

    const visibleCmds = Object.values(this.ctx.commands)
      .filter(cmd2 => !(cmd2.isDeveloper || cmd2.isHidden))
    const categories = visibleCmds.map(cmd2 => cmd2.category)
      .filter((c, i, a) => a.indexOf(c) === i).sort()
    const categoryFields: EmbedField[] = []
    categories.forEach(category => {
      const cmds = visibleCmds.filter(cmd2 => cmd2.category === category)
      categoryFields.push({
        name: category,
        value: cmds.map(cmd2 => `\`${cmd2.name}\``).join(' '),
        inline: true,
      })
    })

    msg.channel.createMessage({
      embed: {
        color: this.meColor(msg),
        description: `Type \`${PREFIX}help [command]\` for more help`,
        fields: categoryFields,
      },
    })
  }
}
