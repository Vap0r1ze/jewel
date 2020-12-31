import Game from '@/services/Game'
import { Message } from 'eris'
import Command from '../services/Command'

export default class GamesCommand extends Command {
  get name() {
    return 'games'
  }

  get category() {
    return 'Games'
  }

  get description() {
    return 'List all of the registered games'
  }

  handle(msg: Message) {
    msg.channel.createMessage({
      embed: {
        color: this.meColor(msg),
        title: 'Games',
        description: (Object.values(this.ctx.games) as Game[]).map(g => `\`${g.name}\`  ${g.displayName}`).join('\n'),
      },
    })
  }
}
