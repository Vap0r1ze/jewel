const { Game, GameSession } = require('../services/Game')
const Deck = require('../services/Deck')
const deckData = require('../services/gameData/uno.deck.json5')
const deckRef = Deck.from(deckData.deck)

const cardSelPattern = /^(r(?:ed)?|y(?:ellow)?|g(?:reen)?|b(?:lue)?) *([0-9]|skip|reverse|\+2|wild(?: *\+4)?)$/i
const cardColors = {r:0xff5555,y:0xffaa00,g:0x55aa55,b:0x5555ff}
const colorNames = {r:'red',y:'yellow',g:'green',b:'blue'}

class Uno extends Game {
  get name () {
    return 'uno'
  }
  get displayName () {
    return 'Uno!'
  }
  get color () {
    return 0xcf4347
  }
  get playerRange () {
    return [2, 12]
  }
  get defaultConfig () {
    return {
      handSize: 7
    }
  }
  get Session () {
    return UnoSession
  }
  get helpEmbed () {
    return {
      description: [
        'To play a card, prefix your message with `,` or `.` (card names/colors are not case sensitive)',
        'If you\'re playing a wild card, you must choose your color as you play the card',
        '\n**__Examples__**',
        '.red 2',
        '.yellow +2',
        '.green SKIP',
        '.red WILD +4 **<~~------~~ this is how you play a wild card**'
      ].join('\n')
    }
  }
}

class UnoSession extends GameSession {
  wrapTurn (turn, p) {
    return turn - Math.floor(turn/p)*p
  }
  async showPlayerCards (player, pretense, cardIndexes, handSize) {
    const handCards = deckRef.fromIndexes(cardIndexes)

    const serializedHand = handCards.map(c => {
      const color = this.ctx.util.text(c.color, 'capitalize')
      const name = c.type.toUpperCase()
      return `**${color} ${name}**`.replace('* ', '')
    })
    return await this.dmPlayer(player, {
      embed: {
        title: pretense,
        description: serializedHand.join(' | '),
        footer: handSize && { text: `You have ${handSize} card${handSize===1?'':'s'}` }
      }
    })
  }
  announceCardPlay (cardIndex, player, nextPlayer) { // TODO: condense this maybe?
    const { data } = this
    const card = deckRef[cardIndex]
    const colorDisplay = this.ctx.util.text(colorNames[data.pileColor], 'capitalize')
    const curPlayer = this.players[data.turn]
    let comment = `<@${player}> has played a **${colorDisplay} ${card.type.toUpperCase()}**.`
    switch (card.type) {
      case 'skip': {
        comment += ` Sorry, <@${nextPlayer}>! Skip a turn!`
        break
      }
      case 'reverse': {
        if (this.players.length > 2)
          comment += ' Turns are now in reverse order!'
        else
          comment += ` Sorry, <@${nextPlayer}>! Skip a turn!`
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
    }
    comment += `\n\nIt is now <@${curPlayer}>'s turn!`

    return this.showTable(comment)
  }
  showTable (comment) {
    const { data } = this
    const card = deckRef[data.pile[0]]
    const colorDisplay = this.ctx.util.text(colorNames[data.pileColor], 'capitalize')
    if (!comment) {
      const curPlayer = this.players[data.turn]
      comment = `A **${colorDisplay} ${card.type.toUpperCase()}** has been played`
      comment += `\n\nIt is currently <@${curPlayer}>'s turn!`
    }
    const d = data.deck.length
    const p = data.pile.length
    return this.broadcastChat(this.players, {
      embed: {
        color: cardColors[data.pileColor[0]],
        description: comment,
        thumbnail: { url: `https://raw.githubusercontent.com/Ratismal/UNO/master/cards/${(data.pileColor[0]+card.type).toUpperCase()}.png` },
        footer: { text: `Deck: ${d} card${d===1?'':'s'} | Pile: ${p} card${p===1?'':'s'}` }
      }
    })
  }
  async drawCards (amount) {
    const { data } = this
    const drawn = []
    for (let i = 0; i < amount; i++) {
      if (data.deck.length === 0)
        await this.shufflePileIntoDeck()
      drawn.push(data.deck.pop())
    }
    return drawn
  }
  async shufflePileIntoDeck () {
    const { data } = this
    const pile = data.pile.splice(1)
    for (let i = pile.length; i > 0; i--) {
      const j = Math.floor(Math.random() * i)
      const c = pile.splice(j, 1)[0]
      pile.push(c)
    }
    data.deck.unshift(...pile)
    data.pile = [data.pile[0]]
    // await this.broadcastChat(this.players, {
    //   embed: {
    //     description: 'The deck has ran out of cards, and the pile has been shuffled into the deck'
    //   }
    // })
  }
  async handleDM (msg) {
    const { data } = this
    const player = msg.author.id
    await this.chatMessage(msg)
    if (/^[.,] */i.test(msg.content)) {
      const cmd = msg.content.replace(/^[.,] */i, '')
      const hand = data.hands[player]
      switch (cmd) {
        case 'skip':
        case 'pickup':
        case 'draw': {
          if (this.players.indexOf(player) === data.turn) {
            const [ cardIndex ] = await this.drawCards(1)
            hand.push(cardIndex)
            data.turn += data.rot
            data.turn = this.wrapTurn(data.turn, this.players.length)
            this.saveState()
            const curPlayer = this.players[data.turn]
            await this.showPlayerCards(player, `You drew a card`, [ cardIndex ], hand.length)
            await this.showTable()
            await this.showPlayerCards(curPlayer, 'It\'s your turn! Here is your hand', data.hands[curPlayer], data.hands[curPlayer].length)
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
            if (!sel)
              return msg.channel.createMessage('**That is not a valid Uno! play**')
            const isWild = sel[2].startsWith('wild')
            let cardHandIndex
            if (isWild)
              cardHandIndex = deckRef.fromIndexes(hand).findIndex(c => c.type === sel[2])
            else
              cardHandIndex = deckRef.fromIndexes(hand).findIndex(c => c.color[0] === sel[1][0] && c.type === sel[2])
            if (cardHandIndex === -1)
              return msg.channel.createMessage('**You don\'t have that card!**')
            const cardIndex = hand.splice(cardHandIndex, 1)
            const card = deckRef[cardIndex]
            const pileCard = deckRef[data.pile[0]]
            if (card.color != '*') {
              if (card.color[0] !== data.pileColor && card.type != pileCard.type) {
                return msg.channel.createMessage('**That card doesn\'t match the last played card!**')
              }
            }

            data.pile.unshift(cardIndex)
            data.pileColor = sel[1][0]
            const nextPlayer = this.players[this.wrapTurn(data.turn + data.rot, this.players.length)]
            const drawCount = +(/\+(\d+)$/.exec(sel[2]) || [])[1]
            if (sel[2] === 'reverse')
              data.rot *= -1
            if (sel[2] === 'skip' || drawCount || sel[2] === 'reverse' && this.players.length === 2) {
              data.turn += data.rot*2
            } else {
              data.turn += data.rot
            }
            if (drawCount) {
              const drawn = await this.drawCards(drawCount)
              data.hands[nextPlayer].push(...drawn)
            }
            data.turn = this.wrapTurn(data.turn, this.players.length)
            this.saveState()
            const curPlayer = this.players[data.turn]
            if (data.hands[player].length === 0)
              return await this.winGame(player)
            if (data.hands[player].length === 1) {
              await this.broadcastChat(this.players, {
                embed: {
                  title: 'Uno!!',
                  description: `<@${player}> only has one card left!`
                }
              })
            }
            await this.announceCardPlay(cardIndex, player, nextPlayer)
            if (drawCount) {
              const drawn = data.hands[nextPlayer].slice(-drawCount)
              await this.showPlayerCards(nextPlayer, `You drew ${drawCount} cards`, drawn, data.hands[nextPlayer].length)
            }
            await this.showPlayerCards(curPlayer, 'It\'s your turn! Here is your hand', data.hands[curPlayer], data.hands[curPlayer].length)
          }
        }
      }
    }
  }
  async startGame () {
    const { data } = this
    const deck = deckRef.shuffleIndexes()
    data.hands = {}
    for (let i = this.players.length; i > 0; i--) { // shuffle players
      const j = Math.floor(Math.random() * i)
      const p = this.players.splice(j, 1)[0]
      this.players.push(p)
    }
    for (const player of this.players) {
      const hand = deck.splice(-this.gameConfig.handSize, this.gameConfig.handSize)
      data.hands[player] = hand
    }
    data.pile = [deck.pop()] // pile sorted top to bottom
    if (deckRef[data.pile[0]].type.startsWith('wild'))
      data.pileColor = 'rygb'[Math.floor(Math.random()*4)]
    else
      data.pileColor = deckRef[data.pile[0]].color[0]
    data.deck = deck // deck sorted bottom to top
    data.turn = 0
    data.rot = 1 // rotation: 1 = CW | -1 = CCW
    this.gameState = 'INPROGRESS'
    this.saveState()
    for (const player of this.players) {
      const hand = data.hands[player]
      if (this.players[0] !== player)
        await this.showPlayerCards(player, 'You were dealt the following cards:', hand, hand.length)
    }
    await this.showTable()
    const curPlayer = this.players[data.turn]
    await this.showPlayerCards(curPlayer, 'It\'s your turn! Here is your hand', data.hands[curPlayer], data.hands[curPlayer].length)
  }
  pauseGame () {
    // const { data } = this
  }
  resumeGame () {
    // const { data } = this
  }
  async winGame (winner) {
    const { data } = this
    const card = deckRef[data.pile[0]]
    const colorDisplay = this.ctx.util.text(colorNames[data.pileColor], 'capitalize')
    await this.showTable(`<@${winner}> won the game with a **${colorDisplay} ${card.type.toUpperCase()}**!`)
    return this.destroyGame(winner)
  }
  async gameHandleLeave (player) {
    const { data } = this
    const playerIndex = this.players.indexOf(player)
    if (playerIndex < data.turn) {
      data.turn--
    } else if (playerIndex === data.turn) {
      console.log(playerIndex, data.rot, this.players.length)
      const nextPlayer = this.players[this.wrapTurn(playerIndex + data.rot, this.players.length)]
      data.pile.push(...data.hands[player])
      delete data.hands[player]
      this.players.splice(playerIndex, 1)
      await this.showTable()
      console.log(data.hands)
      await this.showPlayerCards(nextPlayer, 'It\'s your turn! Here is your hand', data.hands[nextPlayer], data.hands[nextPlayer].length)
    }
    this.saveState()
    await this.broadcastChat(this.players.filter(p => p !== player), `**<@${player}> has left the game**`)
    await this.dmPlayer(player, '**You have left the game**')
  }
}

module.exports = Uno
