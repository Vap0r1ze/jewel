import { EmbedField, Message } from 'eris'
import Command, { CommandArgs } from '../services/Command'

export default class HelpCommand extends Command {
    get name() {
        return 'help'
    }

    get description() {
        return 'List all of the available commands or get more information about a specific command'
    }

    get isHidden() { return true }

    handle(msg: Message, args: CommandArgs) {
        const { PREFIX } = process.env
        msg.channel.createMessage({
            embed: {
                color: this.meColor(msg),
                description: `Looking for swamp specific commands? Try \`${PREFIX}h\``,
            },
        })
    }
}
