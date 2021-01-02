import Game from '@/services/Game'
import UnoSession from './session'

export default class UnoGame extends Game {
  get name() {
    return 'uno'
  }

  get displayName() {
    return 'Uno!'
  }

  get color() {
    return 0xcf4347
  }

  get playerRange(): [number, number] {
    return [2, 12]
  }

  get defaultConfig() {
    return {
      handSize: 7,
    }
  }

  get Session() {
    return UnoSession
  }

  get helpEmbed() {
    return {
      description: [
        'To play a card, prefix your message with `,` or `.` (card names/colors are not case sensitive)',
        'If you\'re playing a wild card, you must choose your color as you play the card',
        '\n**__Examples__**',
        '.red 2',
        '.yellow +2',
        '.green SKIP',
        '.red WILD +4 **<~~------~~ this is how you play a wild card**',
      ].join('\n'),
    }
  }
}
