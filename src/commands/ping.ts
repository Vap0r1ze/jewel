import { Message } from 'eris'
import Command from '../services/Command'

export default class PingCommand extends Command {
  get name() {
    return 'ping'
  }

  get description() {
    return 'Check the latency between the bot and discord'
  }

  handle(msg: Message) {
    const before = Date.now()
    msg.channel.createMessage('Ping?').then(ping => {
      const after = Date.now()
      ping.edit(`Ping! \`${after - before}ms\``)
    })
  }
}
