import GameSession from '@/services/GameSession'
import Deck from '@/services/Deck'
import deckData from '@/services/data/uno.deck'
import { Message } from 'eris'

const cardSelPattern = /^(r(?:ed)?|y(?:ellow)?|g(?:reen)?|b(?:lue)?) *([0-9]|skip|reverse|\+2|wild(?: *\+4)?)$/i
const cardColors = {
  r: 0xff5555, y: 0xffaa00, g: 0x55aa55, b: 0x5555ff,
}
const colorNames = {
  r: 'red', y: 'yellow', g: 'green', b: 'blue',
}

export interface UnoData {
  initialized: true;
  hands: Dict<number[]>;
  deck: number[]; // deck sorted bottom to top
  pile: number[]; // pile sorted top to bottom
  pileColor: 'r' | 'y' | 'g' | 'b';
  turn: number;
  rot: number; // rotation: 1 = CW | -1 = CCW
}

export default class UnoSession extends GameSession {
  gameConfig!: import('@/games/uno/game').default['defaultConfig']

  data!: UnoData | { initialized?: false }

  wrapTurn(turn: number, p: number) {
    return turn - Math.floor(turn / p) * p
  }

  async showPlayerCards(
    player: string,
    pretense: string,
    cardIndexes: number[],
    handSize?: number,
  ) {
    const handCards: typeof deckData.deck = Deck.fromIndexes(deckData.deck, cardIndexes)

    const serializedHand = handCards.map(c => {
      const color = this.ctx.transformText(c.color, 'capitalize')
      const name = c.type.toUpperCase()
      return `**${color} ${name}**`.replace('* ', '')
    })
    return this.dmPlayer(player, {
      embed: {
        title: pretense,
        description: serializedHand.length ? serializedHand.join(' | ') : 'You have no cards!',
        footer: handSize ? { text: `You have ${handSize} card${handSize === 1 ? '' : 's'} | Only you can see this message` } : undefined,
      },
    })
  }

  // TODO: condense this maybe?
  async announceCardPlay(cardIndex: number, player: string, nextPlayer: string) {
    const { data } = this
    if (!data.initialized) return
    const card = deckData.deck[cardIndex]
    const colorDisplay = this.ctx.transformText(colorNames[data.pileColor], 'capitalize')
    const curPlayer = this.players[data.turn]
    let comment = `<@${player}> has played a **${colorDisplay} ${card.type.toUpperCase()}**.`
    switch (card.type) {
      case 'skip': {
        comment += ` Sorry, <@${nextPlayer}>! Skip a turn!`
        break
      }
      case 'reverse': {
        if (this.players.length > 2) { comment += ' Turns are now in reverse order!' } else { comment += ` Sorry, <@${nextPlayer}>! Skip a turn!` }
        break
      }
      case '+2': {
        comment += ` <@${nextPlayer}> picks up 2! Also, skip a turn!`
        break
      }
      case 'wild': {
        comment = `<@${player}> has played a **${card.type.toUpperCase()}** card.`
        comment += ` The current color is now **${colorDisplay}**!`
        break
      }
      case 'wild+4': {
        comment = `<@${player}> has played a **${card.type.toUpperCase()}** card.`
        comment += ` The current color is now **${colorDisplay}**!`
        comment += ` <@${nextPlayer}> picks up 4! Also, skip a turn!`
        break
      }
      default: {
        break
      }
    }
    comment += `\n\nIt is now <@${curPlayer}>'s turn!`

    await this.showTable(comment)
  }

  async showTable(comment?: string) {
    const { data } = this
    if (!data.initialized) return
    const card = deckData.deck[data.pile[0]]
    const colorDisplay = this.ctx.transformText(colorNames[data.pileColor], 'capitalize')
    let outComment = comment
    if (!outComment) {
      const curPlayer = this.players[data.turn]
      outComment = `A **${colorDisplay} ${card.type.toUpperCase()}** has been played`
      outComment += `\n\nIt is currently <@${curPlayer}>'s turn!`
    }
    const d = data.deck.length
    const p = data.pile.length
    await this.broadcastChat(this.viewers, {
      embed: {
        color: cardColors[data.pileColor],
        description: outComment,
        thumbnail: { url: `https://raw.githubusercontent.com/Ratismal/UNO/master/cards/${(data.pileColor[0] + card.type).toUpperCase()}.png` },
        footer: { text: `Deck: ${d} card${d === 1 ? '' : 's'} | Pile: ${p} card${p === 1 ? '' : 's'}` },
      },
    })
  }

  async drawCards(amount = 1) {
    const { data } = this
    if (!data.initialized) return []
    const drawn = []
    for (let i = 0; i < amount; i += 1) {
      if (data.deck.length === 0) { await this.shufflePileIntoDeck() }
      drawn.push(data.deck.pop() || -1)
    }
    return drawn
  }

  async shufflePileIntoDeck() {
    const { data } = this
    if (!data.initialized) return
    const pile = data.pile.splice(1)
    for (let i = pile.length; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * i)
      const [c] = pile.splice(j, 1)
      pile.push(c)
    }
    data.deck.unshift(...pile)
    data.pile = [data.pile[0]]
    // await this.broadcastChat(this.players, {
    //   embed: {
    //     description: 'The deck has ran out of cards,'
    //       + ' and the pile has been shuffled into the deck',
    //   },
    // })
  }

  async handleDM(msg: Message) {
    const { data } = this
    if (!data.initialized) return
    const player = msg.author.id
    await this.chatMessage(msg)
    if (/^[.,] */i.test(msg.content)) {
      const cmd = msg.content.replace(/^[.,] */i, '')
      const hand = data.hands[player]
      if (!hand) return
      switch (cmd) {
        case 'skip':
        case 'pickup':
        case 'draw': {
          if (this.players.indexOf(player) === data.turn) {
            const [cardIndex] = await this.drawCards()
            hand.push(cardIndex)
            data.turn += data.rot
            data.turn = this.wrapTurn(data.turn, this.players.length)
            this.saveState()
            const curPlayer = this.players[data.turn]
            let curHand = data.hands[curPlayer]
            if (!curHand) {
              curHand = []
              data.hands[curPlayer] = curHand
            }
            await this.showPlayerCards(player, 'You drew a card', [cardIndex], hand.length)
            await this.showTable()
            await this.showPlayerCards(curPlayer, 'It\'s your turn! Here is your hand', curHand, curHand.length)
          }
          break
        }
        case 'showhand':
        case 'hand': {
          await this.showPlayerCards(player, 'Here is your hand', hand, hand.length)
          break
        }
        case 'showtable':
        case 'table': {
          await this.showTable()
          break
        }
        default: {
          if (this.players.indexOf(player) === data.turn) {
            const sel = cardSelPattern.exec(cmd.toLowerCase())
            if (!sel) {
              msg.channel.createMessage('**That is not a valid Uno! play**')
              return
            }
            const isWild = sel[2].startsWith('wild')
            let cardHandIndex: number
            if (isWild) {
              cardHandIndex = Deck.fromIndexes(deckData.deck, hand)
                .findIndex(c => c.type === sel[2])
            } else {
              cardHandIndex = Deck.fromIndexes(deckData.deck, hand)
                .findIndex(c => c.color[0] === sel[1][0] && c.type === sel[2])
            }
            if (cardHandIndex === -1) {
              msg.channel.createMessage('**You don\'t have that card!**')
              return
            }
            const [cardIndex] = hand.splice(cardHandIndex, 1)
            const card = deckData.deck[cardIndex]
            const pileCard = deckData.deck[data.pile[0]]
            if (card.color !== '*') {
              if (card.color[0] !== data.pileColor && card.type !== pileCard.type) {
                msg.channel.createMessage('**That card doesn\'t match the last played card!**')
                return
              }
            }

            data.pile.unshift(cardIndex)
            data.pileColor = sel[1][0] as UnoData['pileColor']
            const nextPlayer = this.players[
              this.wrapTurn(data.turn + data.rot, this.players.length)
            ]
            const drawCount = +(/\+(\d+)$/.exec(sel[2]) || [])[1]
            if (sel[2] === 'reverse') { data.rot *= -1 }
            if (sel[2] === 'skip' || drawCount || (sel[2] === 'reverse' && this.players.length === 2)) {
              data.turn += data.rot * 2
            } else {
              data.turn += data.rot
            }
            const nextHand = data.hands[nextPlayer]
            if (drawCount && nextHand) {
              const drawn = await this.drawCards(drawCount)
              nextHand.push(...drawn)
            }
            data.turn = this.wrapTurn(data.turn, this.players.length)
            this.saveState()
            const curPlayer = this.players[data.turn]
            if (hand.length === 0) {
              await this.winGame(player)
              return
            }
            if (hand.length === 1) {
              await this.broadcastChat(this.players, {
                embed: {
                  title: 'Uno!!',
                  description: `<@${player}> only has one card left!`,
                },
              })
            }
            await this.announceCardPlay(cardIndex, player, nextPlayer)
            if (drawCount && nextHand) {
              const drawn = nextHand.slice(-drawCount)
              await this.showPlayerCards(nextPlayer, `You drew ${drawCount} cards`, drawn, nextHand.length)
            }
            const curHand = data.hands[curPlayer] || []
            await this.showPlayerCards(curPlayer, 'It\'s your turn! Here is your hand', curHand, curHand.length)
          }
        }
      }
    }
  }

  async startGame() {
    const data: UnoData = {
      initialized: true,
      hands: {},
      deck: [],
      pile: [],
      turn: 0,
      rot: 1,
      pileColor: 'r',
    }
    data.deck.push(...Deck.shuffleIndexes(deckData.deck))
    for (let i = this.players.length; i > 0; i -= 1) { // shuffle players
      const j = Math.floor(Math.random() * i)
      const [p] = this.players.splice(j, 1)
      this.players.push(p)
    }
    this.players.forEach(player => {
      const hand = data.deck.splice(-this.gameConfig.handSize, this.gameConfig.handSize)
      data.hands[player] = hand
    })
    data.pile = [data.deck.pop() || -1]
    if (deckData.deck[data.pile[0]].type.startsWith('wild')) {
      data.pileColor = 'rygb'[Math.floor(Math.random() * 4)] as UnoData['pileColor']
    } else {
      data.pileColor = deckData.deck[data.pile[0]].color[0] as UnoData['pileColor']
    }
    this.gameState = 'INPROGRESS'
    this.data = data
    this.saveState()
    // eslint-disable-next-line no-restricted-syntax
    for (const player of this.players) {
      const hand = data.hands[player]
      if (!hand) continue
      if (this.players[0] !== player) { await this.showPlayerCards(player, 'You were dealt the following cards:', hand, hand.length) }
    }
    await this.showTable()
    const curPlayer = this.players[data.turn]
    const curHand = data.hands[curPlayer] || []
    await this.showPlayerCards(curPlayer, 'It\'s your turn! Here is your hand', curHand, curHand.length)
  }

  pauseGame() {
    // const { data } = this
  }

  resumeGame() {
    // const { data } = this
  }

  async winGame(winner: string) {
    const { data } = this
    if (!data.initialized) return
    const card = deckData.deck[data.pile[0]]
    const colorDisplay = this.ctx.transformText(colorNames[data.pileColor], 'capitalize')
    await this.showTable(`<@${winner}> won the game with a **${colorDisplay} ${card.type.toUpperCase()}**!`)
    await this.destroyGame(winner)
  }

  gameHandleJoin(player: string) {
    this.players.push(player)
    this.saveState()
  }

  async gameHandleLeave(player: string) {
    const { data } = this
    const playerIndex = this.players.indexOf(player)
    if (data.initialized) {
      if (playerIndex === -1) return
      const hand = data.hands[player]
      if (hand) {
        data.pile.push(...hand)
        delete data.hands[player]
      }
      if (playerIndex < data.turn) {
        data.turn -= 1
      } else if (playerIndex === data.turn) {
        const nextPlayer = this.players[this.wrapTurn(playerIndex + data.rot, this.players.length)]
        this.players.splice(playerIndex, 1)
        const nextHand = data.hands[nextPlayer] || []
        await this.showTable()
        await this.showPlayerCards(nextPlayer, 'It\'s your turn! Here is your hand', nextHand, nextHand.length)
      }
    }
    this.players.splice(playerIndex, 1)
    this.saveState()
  }
}
