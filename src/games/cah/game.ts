import Game from '@/services/Game'
import CAHSession from './session'

export default class CAHGame extends Game {
  get name() {
    return 'cah'
  }

  get displayName() {
    return 'Cards Against Humanity'
  }

  get color() {
    return 0xEEEEEE
  }

  get playerRange(): [number, number] {
    return [3, 10]
  }

  get defaultConfig() {
    return {
      handSize: 9,
      playerPeriod: 60,
      czarPeriod: 90,
      warnPeriod: 15,
      maxPoints: 10,
      packs: [0],
    }
  }

  get Session() {
    return CAHSession
  }

  get helpEmbed() {
    return {
      description: [
        `You need **${this.defaultConfig.maxPoints}** points to win`,
      ].join('\n'),
    }
  }
}
