import moment from 'moment'
import GameSession from '@/services/GameSession'
import baseDeck from '@/services/data/cah.deck'
import { Message } from 'eris'

const letterEmoji: string[] = [] // regional indicators
for (let i = 0; i < 26; i += 1) { letterEmoji.push(String.fromCharCode(0xd83c, 0xdde6 + i)) }

export interface CAHData {
  initialized: true;
  hands: Dict<number[]>;
  whiteDeck: number[];
  blackDeck: number[];
  whitePile: number[];
  blackPile: number[];
  czarCard: number;
  czar: number;
  czarMsg: string;
  playerChoices: Dict<number[]>;
  choiceMsgs: Dict<string>;
  scores: Dict<number>;
}

export default class CAHSession extends GameSession {
  gameConfig!: import('@/games/cah/game').default['defaultConfig']

  data!: CAHData | { initialized?: false }

  // Events
  async handleDM(msg: Message) {
    // const { data } = this
    // const player = msg.author.id
    await this.chatMessage(msg)
    // if (/^[.,] */i.test(msg.content)) {
    //   const cmd = msg.content.replace(/^[.,] */i, '')
    //   switch (cmd) {
    //     case 'showhand':
    //     case 'hand': {
    //       // Show hand
    //       break
    //     }
    //     default: {
    //     }
    //   }
    // }
  }

  async handlePlayerChoice(choice: string, player: string, removed?: boolean) {
    const { data } = this
    if (!data.initialized) return
    const czarCard = baseDeck.black[data.czarCard]
    const blankCount = czarCard.pick
    const choiceMsdId = data.choiceMsgs[player]
    const playerChoices = data.playerChoices[player]
    const hand = data.hands[player]
    const choiceN = parseInt(choice, 10)
    if (!playerChoices || !choiceMsdId || !hand) return
    if (removed) {
      const choiceIndex = playerChoices.indexOf(choiceN)
      if (playerChoices.length === 0 || choiceIndex === -1) return
      playerChoices.splice(choiceIndex, 1)
    } else {
      if (blankCount - playerChoices.length <= 0) return
      playerChoices.push(choiceN)
    }
    this.saveState()

    const s = blankCount === 1 ? '' : 's'
    this.ctx.client.editMessage((await this.ctx.client.getDMChannel(player)).id, choiceMsdId, {
      embed: {
        title: s ? `Pick ${blankCount} cards!` : 'Pick a card!',
        description: this.stringifyBlack(czarCard, playerChoices.map(c => baseDeck.white[hand[c]])),
        fields: [{
          name: 'Options',
          value: hand.map((c, i) => `${letterEmoji[i]} ${
            this.ctx.transformText(baseDeck.white[c], 'capitalize')
          }`).join('\n'),
        }],
      },
    })

    const choiceCount = Object.values(data.playerChoices)
      .filter(c => c?.length === blankCount).length
    if (choiceCount === Object.keys(data.playerChoices).length) {
      this.ctx.jobs.cancel(`${this.id}:playerWarn`)
      this.ctx.jobs.cancel(`${this.id}:playerEnd`)
      this.endPlayerPeriod()
    }
  }

  handleCzarChoice(choice: string, czar: string, removed?: boolean) {
    if (removed) return
    const { data } = this
    if (!data.initialized) return
    const czarCard = baseDeck.black[data.czarCard]
    const blankCount = czarCard.pick

    this.ctx.jobs.cancel(`${this.id}:czarWarn`)
    this.ctx.jobs.cancel(`${this.id}:czarEnd`)
    const candidates = Object.keys(data.playerChoices).filter(p => {
      const choices = data.playerChoices[p]
      return choices?.length === blankCount
    })
    const selected = candidates[parseInt(choice, 10)]
    this.ctx.menus.delete(data.czarMsg)
    this.saveState()
    this.endCzarPeriod(selected)
  }

  // Routine
  async startPlayerPeriod(title?: string) {
    const { data } = this
    if (!data.initialized) return
    const { playerPeriod, warnPeriod } = this.gameConfig
    const czar = this.players[data.czar]
    const czarCard = baseDeck.black[data.czarCard]
    const blankCount = czarCard.pick

    const s = blankCount === 1 ? '' : 's'
    const a = blankCount === 1 ? 'a ' : ''
    await this.broadcastChat(this.viewers, {
      embed: {
        color: this.game.color,
        title: title || 'Round started!',
        fields: [
          { name: 'Prompt', value: this.stringifyBlack(czarCard) },
          { name: 'Card Czar', value: `<@${czar}>` },
          {
            name: 'Instructions',
            value: [
              `**Players**: Select your white card${s} to fill in the blank${s}`,
              `**Card Czar**: Wait until all players have picked ${a}card${s} then select the best one${s}`,
            ].join('\n'),
          },
        ],
        footer: { text: `Players have ${playerPeriod} seconds to choose` },
      },
    })

    // eslint-disable-next-line no-restricted-syntax
    for (const player of this.players) {
      if (player === czar) {
        await this.dmPlayer(czar, {
          embed: {
            title: 'You are the Card Czar',
            description: `Wait until all players have picked ${a}card${s} then select the best one${s}`,
          },
        })
        continue
      }
      const hand = data.hands[player]
      if (!hand) continue
      const choiceMsg = await this.dmPlayer(player, {
        embed: {
          title: s ? `Pick ${blankCount} cards!` : 'Pick a card!',
          description: this.stringifyBlack(czarCard),
          fields: [{
            name: 'Options',
            value: hand.map((c, i) => `${letterEmoji[i]} ${
              this.ctx.transformText(baseDeck.white[c], 'capitalize')
            }`).join('\n'),
          }],
        },
      })
      data.choiceMsgs[player] = choiceMsg.id
      data.playerChoices[player] = []
      this.saveState()
      this.ctx.menus.create({
        channelId: (await this.ctx.client.getDMChannel(player)).id,
        messageId: choiceMsg.id,
        handlerPath: `gameSessions.${this.id}.handlePlayerChoice`,
        emojis: letterEmoji.slice(0, hand.length),
      })
    }

    const endTime = moment().add(playerPeriod, 'seconds')
    const warnTime = endTime.clone().subtract(warnPeriod, 'seconds')
    this.ctx.jobs.create(`${this.id}:playerWarn`, warnTime, `gameSessions.${this.id}.warnPlayers`)
    this.ctx.jobs.create(`${this.id}:playerEnd`, endTime, `gameSessions.${this.id}.endPlayerPeriod`)
  }

  async warnPlayers() {
    const { data } = this
    if (!data.initialized) return
    const { warnPeriod } = this.gameConfig
    const czarCard = baseDeck.black[data.czarCard]
    const blankCount = czarCard.pick
    const s = blankCount === 1 ? '' : 's'

    // eslint-disable-next-line no-restricted-syntax
    for (const [player, playerChoices] of Object.entries(data.playerChoices)) {
      if (!playerChoices) continue
      if (playerChoices.length < blankCount) { await this.dmPlayer(player, { embed: { description: `You have ${warnPeriod} seconds to pick your card${s}` } }) }
    }
  }

  async endPlayerPeriod() {
    const { data } = this
    if (!data.initialized) return
    const czarCard = baseDeck.black[data.czarCard]
    const blankCount = czarCard.pick
    const choiceCount = Object.values(data.playerChoices)
      .filter(c => c?.length === blankCount).length
    const s = blankCount === 1 ? '' : 's'

    if (choiceCount <= 1) {
      await this.broadcastChat(this.viewers, {
        embed: {
          description: `${choiceCount === 0 ? 'Nobody' : 'Only one player'} chose their card${s} this round, skipping round...`,
        },
      })
      this.clearChoices()
      data.czar = this.wrapTurn(data.czar + 1, this.players.length)
      data.blackPile.push(data.czarCard)
      data.czarCard = this.drawCards(data.blackDeck, data.blackPile)[0]
      this.saveState()
      await this.startPlayerPeriod()
    } else {
      const noChoicePlayers = Object.keys(data.playerChoices).filter(p => {
        const choices = data.playerChoices[p]
        return (choices?.length ?? 0) < blankCount
      })
      if (noChoicePlayers.length) {
        const pS = noChoicePlayers.length === 1 ? '' : 's'
        const pDet = noChoicePlayers.length === 1 ? 'This' : 'These'
        const nCPMentions = noChoicePlayers.map(p => `<@${p}>`)
        await this.dmPlayer(this.host, {
          embed: {
            description: `${pDet} player${pS} did not choose their card${s} this round: ${nCPMentions.join(' ')}`,
            footer: { text: 'As a host, only you can see this message' },
          },
        })
      }
      this.clearChoices(true)
      this.saveState()
      await this.startCzarPeriod()
    }
  }

  async startCzarPeriod() {
    const { data } = this
    if (!data.initialized) return
    const { czarPeriod, warnPeriod } = this.gameConfig
    const czar = this.players[data.czar]
    const czarCard = baseDeck.black[data.czarCard]
    const blankCount = czarCard.pick

    const s = blankCount === 1 ? '' : 's'
    const candidates = Object.keys(data.playerChoices).filter(p => {
      const choices = data.playerChoices[p]
      return choices?.length === blankCount
    })
    const candidatesEmbed = {
      embed: {
        color: this.game.color,
        title: 'Pick the winner',
        description: `Cards have been picked, select the best one${s} <@${czar}>! You have **${czarPeriod}** seconds.`,
        fields: [
          { name: 'Prompt', value: this.stringifyBlack(czarCard) },
          {
            name: 'Candidates',
            value: candidates.map((p, i) => {
              const choices = data.playerChoices[p]
              const hand = data.hands[p]
              if (!choices || !hand) return 'You should not see this, please tell Vap0r1ze#0126 if this has shown up in a game'
              return `${letterEmoji[i]} ${
                this.stringifyBlack(czarCard, choices.map(c => baseDeck.white[hand[c]]))
              }`
            }).join('\n'),
          },
        ],
      },
    }
    await this.broadcastChat(this.viewers.filter(u => u !== czar), candidatesEmbed)
    const candidatesMsg = await this.dmPlayer(czar, candidatesEmbed)
    this.ctx.menus.create({
      channelId: (await this.ctx.client.getDMChannel(czar)).id,
      messageId: candidatesMsg.id,
      handlerPath: `gameSessions.${this.id}.handleCzarChoice`,
      emojis: letterEmoji.slice(0, candidates.length),
    })
    data.czarMsg = candidatesMsg.id
    this.saveState()
    const endTime = moment().add(czarPeriod, 'seconds')
    const warnTime = endTime.clone().subtract(warnPeriod, 'seconds')
    this.ctx.jobs.create(`${this.id}:czarWarn`, warnTime, `gameSessions.${this.id}.warnCzar`)
    this.ctx.jobs.create(`${this.id}:czarEnd`, endTime, `gameSessions.${this.id}.endCzarPeriod`)
  }

  async warnCzar() {
    const { data } = this
    if (!data.initialized) return
    const { warnPeriod } = this.gameConfig
    const czar = this.players[data.czar]
    const czarCard = baseDeck.black[data.czarCard]
    const blankCount = czarCard.pick
    const s = blankCount === 1 ? '' : 's'
    await this.dmPlayer(czar, { embed: { description: `You have ${warnPeriod} seconds to select the best card${s}` } })
  }

  async endCzarPeriod(selected?: string) {
    const { data } = this
    if (!data.initialized) return
    const { maxPoints } = this.gameConfig
    const czarCard = baseDeck.black[data.czarCard]
    this.ctx.jobs.cancel(`${this.id}:czarWarn`)
    this.ctx.jobs.cancel(`${this.id}:czarEnd`)
    if (!selected) {
      const oldCzar = this.players[data.czar]
      const oldCzarCard = baseDeck.black[data.czarCard]
      const blankCount = oldCzarCard.pick
      const s = blankCount === 1 ? '' : 's'
      data.czarCard = this.drawCards(data.blackDeck, data.blackPile)[0]
      data.czar = this.wrapTurn(data.czar + 1, this.players.length)
      data.czarMsg = ''
      this.clearChoices()
      this.saveState()
      await this.broadcastChat(this.viewers, {
        embed: {
          description: `<@${oldCzar}> failed to select a${s ? 'ny' : ''} card${s}`,
          footer: { text: 'Next round starts in 5 seconds...' },
        },
      })
      const nextStartTime = moment().add(5, 'seconds')
      this.ctx.jobs.create(`${this.id}:playerStart`, nextStartTime, `gameSessions.${this.id}.startPlayerPeriod`, 'Next round started!')
    } else {
      const selectedChoices = data.playerChoices[selected]
      if (!selectedChoices) return
      const selectedCards = selectedChoices.map(i => {
        const hand = data.hands[selected]
        if (!hand) return -1
        return hand[i]
      })
      Array.from(Object.entries(data.playerChoices)).forEach(([player, choices]) => {
        let hand = data.hands[player]
        if (!this.players.includes(player) || !choices || !hand) return
        const cards = choices.map(i => (hand as number[])[i])
        data.hands[player] = hand.filter(c => !cards.includes(c))
        hand = data.hands[player] || []
        data.whitePile.push(...cards)
        const drawn = this.drawCards(data.whiteDeck, data.whitePile, choices.length)
        hand.push(...drawn)
      })
      data.blackPile.push(data.czarCard)
      data.czarCard = this.drawCards(data.blackDeck, data.blackPile, 1)[0]
      data.czar = this.wrapTurn(data.czar + 1, this.players.length)
      data.czarMsg = ''
      const prevScore = data.scores[selected]
      if (typeof prevScore !== 'undefined') {
        data.scores[selected] = prevScore + 1
      } else {
        data.scores[selected] = 0
      }
      this.clearChoices()
      this.saveState()
      const selectedScore = data.scores[selected] as number
      const maxScoreDigits = Math.max(
        0,
        ...Object.values(data.scores).map(n => Math.floor(Math.log10(n || 0)) + 1),
      )
      const selectedUser = this.ctx.client.users.get(selected)
      const hasWon = selectedScore >= maxPoints
      const winTitle = hasWon ? 'WON THE GAME!!!' : 'won the round!'
      const footerText = hasWon ? 'CONGRATULATIONS' : 'Next round starts in 15 seconds...'
      await this.broadcastChat(this.viewers, {
        embed: {
          color: 0xffac33,
          title: selectedUser && `${selectedUser.username} ${winTitle}`,
          description: [
            selectedUser ? '' : `<@${selected}> **${winTitle}**\n`,
            this.stringifyBlack(czarCard, selectedCards.map(c => baseDeck.white[c])),
          ].join('\n').trim(),
          fields: [{
            name: 'Scores',
            value: [...Object.entries(data.scores)]
              .sort((a, b) => ((!a[1] || !b[1]) ? 0 : (a[1] - b[1])))
              .map(s => `\`${(s[1] as number).toString().padStart(maxScoreDigits, ' ')}\` <@${s[0]}>`)
              .join('\n'),
          }],
          footer: { text: footerText },
        },
      })
      if (hasWon) {
        await this.winGame(selected)
      } else {
        const nextStartTime = moment().add(15, 'seconds')
        this.ctx.jobs.create(`${this.id}:playerStart`, nextStartTime, `gameSessions.${this.id}.startPlayerPeriod`, 'Next round started!')
      }
    }
  }

  async winGame(winner: string) {
    return this.destroyGame(winner)
  }

  // Hooks
  startGame() {
    const data: CAHData = {
      initialized: true,
      hands: {},
      whiteDeck: [],
      blackDeck: [],
      whitePile: [],
      blackPile: [],
      czarCard: -1,
      czar: 0,
      czarMsg: '',
      playerChoices: {},
      choiceMsgs: {},
      scores: Object.fromEntries(this.players.map(p => [p, 0])),
    }
    const { handSize } = this.gameConfig
    this.gameConfig.packs.forEach(packIndex => {
      const pack = baseDeck.packs[packIndex]
      data.whiteDeck.push(...pack.white)
      data.blackDeck.push(...pack.black)
    })
    for (let i = data.whiteDeck.length; i > 0; i -= 1) { // Shuffle white deck
      const j = Math.floor(Math.random() * i)
      const [c] = data.whiteDeck.splice(j, 1)
      data.whiteDeck.push(c)
    }
    for (let i = data.blackDeck.length; i > 0; i -= 1) { // Shuffle black deck
      const j = Math.floor(Math.random() * i)
      const [c] = data.blackDeck.splice(j, 1)
      data.blackDeck.push(c)
    }
    this.players.forEach(player => {
      const hand = data.whiteDeck.splice(-handSize, handSize)
      data.hands[player] = hand
    })
    data.czarCard = data.blackDeck.pop() || -1
    this.data = data
    this.gameState = 'INPROGRESS'
    this.isOpen = true
    this.saveState()
    return this.startPlayerPeriod('First round started!')
  }

  pauseGame() {
    // const { data } = this
  }

  resumeGame() {
    // const { data } = this
  }

  async gameHandleJoin(player: string) {
    const { data } = this
    if (!data.initialized) return
    const { handSize } = this.gameConfig
    this.players.push(player)
    const drawn = this.drawCards(data.whiteDeck, data.whitePile, handSize)
    data.hands[player] = drawn
    data.scores[player] = 0
    this.saveState()
  }

  async gameHandleLeave(player: string) {
    const { data } = this
    const playerIndex = this.players.indexOf(player)
    if (data.initialized) {
      if (playerIndex === -1) return
      const oldCzarIndex = data.czar
      if (playerIndex < oldCzarIndex) {
        data.czar -= 1
        delete data.playerChoices[player]
      } else if (playerIndex === oldCzarIndex) {
        data.blackPile.push(data.czarCard)
        data.czarCard = this.drawCards(data.blackDeck, data.blackPile, 1)[0]
        data.czarMsg = ''
        this.clearChoices()
      }
      const hand = data.hands[player]
      if (hand) {
        data.whitePile.push(...hand)
        delete data.hands[player]
      }
      delete data.scores[player]
      this.players.splice(playerIndex, 1)
      this.saveState()
      if (playerIndex === oldCzarIndex) {
        await this.startPlayerPeriod()
      }
    } else {
      this.players.splice(playerIndex, 1)
      this.saveState()
    }
  }

  gameHandleDestroy() {
    const { data } = this
    if (data.initialized) {
      Object.values(data.choiceMsgs).forEach(msgId => this.ctx.menus.delete(msgId || ''))
      this.ctx.menus.delete(data.czarMsg)
    }
    this.ctx.jobs.cancel(`${this.id}:playerStart`)
    this.ctx.jobs.cancel(`${this.id}:playerWarn`)
    this.ctx.jobs.cancel(`${this.id}:playerEnd`)
    this.ctx.jobs.cancel(`${this.id}:czarStart`)
    this.ctx.jobs.cancel(`${this.id}:czarWarn`)
    this.ctx.jobs.cancel(`${this.id}:czarEnd`)
  }

  // Helpers
  wrapTurn(turn: number, p: number) {
    return turn - Math.floor(turn / p) * p
  }

  clearChoices(menuOnly?: boolean) {
    const { data } = this
    if (!data.initialized) return
    if (!menuOnly) { data.playerChoices = {} }
    Object.values(data.choiceMsgs).forEach(msgId => this.ctx.menus.delete(msgId || ''))
    data.choiceMsgs = {}
  }

  drawCards(deck: number[], pile: number[], amount = 1) {
    const drawn: number[] = []
    for (let i = 0; i < amount; i += 1) {
      if (deck.length === 0) { // Shuffle pile into deck
        for (let j = pile.length; j > 0; j -= 1) {
          const k = Math.floor(Math.random() * j)
          const [c] = pile.splice(k, 1)
          pile.push(c)
        }
        deck.unshift(...pile)
        pile.splice(0, pile.length)
      }
      drawn.push(deck.pop() || -1)
    }
    return drawn
  }

  stringifyBlack(blackCard: typeof baseDeck.black[number], whiteCards: string[] = []) {
    const underscoreCount = (blackCard.text.match(/_/g) || []).length
    let { text } = blackCard
    if (underscoreCount !== blackCard.pick) { // underscoreCount = 0
      text = blackCard.pick === 1
        ? `${blackCard.text} _`
        : blackCard.text + '\n_'.repeat(blackCard.pick)
    }
    whiteCards.forEach(whiteCard => {
      text = text.replace('_', `**${whiteCard}**`)
    })
    return text
  }
}
