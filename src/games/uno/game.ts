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
                'To start a hand, seven cards are dealt to each player, and the top card of the remaining deck is flipped over on the table to begin the pile. A random player'
          + ' plays first. On a player\'s turn, they must do one of the following:',
                '**1)** Play one card matching the discard in color, number, or symbol',
                '**2)** Play a Wild card, or a playable Wild Draw Four card',
                '**3)** Draw the top card from the deck, then ~~play it if possible~~ forfeit your turn',
            ].join('\n'),
        }
    }
}
