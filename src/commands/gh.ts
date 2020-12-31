import { Message } from 'eris'
import Command from '../services/Command'

export default class GitHubCommand extends Command {
  get name() {
    return 'github'
  }

  get aliases() {
    return ['source', 'code', 'gh']
  }

  get isHidden() {
    return true
  }

  get description() {
    return 'Get a link to the sourcecode of this bot'
  }

  handle(msg: Message) {
    msg.channel.createMessage(`<@${msg.author.id}>, <:github:786216616760573972> <https://github.com/Vap0r1ze/Jewel/tree/the-mirror>`)
  }
}
