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
                `To start the game, each player draws ${this.defaultConfig.handSize} white cards.`,
                'The host begins as the "Card Czar" and plays a black card, showing the selected question or fill-in-the-blanks phrase.',
                'The players answer the question or fill-in-the-blanks by each choosing one white card (or however many required by the black card).',
                'All of the answers are then shuffled and shared anonymously to all players. For full effect, if in a voice call, the Card Czar should usually re-read the black card before presenting each answer. The Card Czar then picks the funniest play, and whoever submitted it gets a point.',
                `After the round, a new player becomes the Card Czar, and everyone draws back up to ${this.defaultConfig.handSize} white cards.`,
            ].join('\n'),
        }
    }
}
