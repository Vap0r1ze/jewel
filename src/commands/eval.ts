import { inspect } from 'util'
import { Message } from 'eris'
import Command, { CommandArgs } from '../services/Command'

export default class EvalCommand extends Command {
  get name() {
    return 'eval'
  }

  get description() {
    return 'Evaluate JS code'
  }

  get usage() {
    return '(code)'
  }

  get isDeveloper() {
    return true
  }

  handle(msg: Message, args: CommandArgs) {
    const code = args.raw
    try {
      // eslint-disable-next-line no-eval
      const output = eval(`${code}`)
      msg.channel.createMessage(`\`\`\`js\n${inspect(output)}\`\`\``).then(response => {
        if (output && typeof output.then === 'function') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          output.then((value: any) => {
            response.edit(`\`\`\`js\n${inspect(value)}\`\`\``)
          }).catch((err: Error) => {
            response.edit(`:no_entry_sign: __**Error**__\n\`\`\`\n${err}\`\`\``)
          })
        }
      })
    } catch (err) {
      if (err) {
        msg.channel.createMessage(`:no_entry_sign: __**Error**__\n\`\`\`\n${err}\`\`\``)
      }
    }
  }
}
