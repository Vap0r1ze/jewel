import { EmbedField, Message } from 'eris'
import Command, { CommandArgs } from '../services/Command'

export default class SHelpCommand extends Command {
    get name() {
        return 'shelp'
    }

    get usage() {
        return '[command]'
    }

    get aliases() {
        return ['h']
    }

    get description() {
        return 'List all of the available commands or get more information about a specific command'
    }

    handle(msg: Message, args: CommandArgs) {
        const { PREFIX, DEVELOPERS } = process.env
        const isDeveloper = DEVELOPERS.includes(msg.author.id)
        const cmd = Object.values(this.ctx.commands).find(
            c => c.name === args[0] || c.aliases.includes(args[0] || ''),
        )
        if (args[0] && cmd && (!cmd.isDeveloper || isDeveloper)) {
            const embedFields: EmbedField[] = []
            if (cmd.aliases.length) {
                embedFields.push({
                    name: 'Aliases',
                    value: [cmd.name].concat(...cmd.aliases).map(n => `\`${n}\``).join(' '),
                })
            }
            if (cmd.examples.length) {
                embedFields.push({
                    name: 'Examples',
                    value: cmd.examples.map(ex => `\`${process.env.PREFIX}${args[0]} ${ex}\``).join('\n'),
                })
            }
            msg.channel.createMessage({
                embed: {
                    color: this.meColor(msg),
                    description: `\`${PREFIX}${`${args[0]} ${cmd.usage}`.trim()}\`\n${cmd.description}`,
                    fields: embedFields,
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
