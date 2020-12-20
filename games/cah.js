const moment = require('moment')
const { Game, GameSession } = require('../services/Game')
const Deck = require('../services/Deck')
const baseDeck = require('../services/data/cah-base.deck.json5')
const { select } = require('async')
const whiteDeckRef = Deck.from(baseDeck.white)
const blackDeckRef = Deck.from(baseDeck.black)

const letterEmoji = [] // regional indicators
for (let i = 0; i < 26; i++)
  letterEmoji.push(String.fromCharCode(0xd83c, 0xdde6 + i))

class CAH extends Game {
  get name () {
    return 'cah'
  }
  get displayName () {
    return 'Cards Against Humanity'
  }
  get color () {
    return 0xEEEEEE
  }
  get playerRange () {
    return [3, 10]
  }
  get defaultConfig () {
    return {
      handSize: 9,
      playerPeriod: 60,
      czarPeriod: 90,
      warnPeriod: 15,
      maxPoints: 10,
    }
  }
  get Session () {
    return CAHSession
  }
  get helpEmbed () {
    return {
      description: [
        `You need **${this.defaultConfig.maxPoints}** points to win`
      ].join('\n')
    }
  }
}

class CAHSession extends GameSession {
  // Events
  async handleDM (msg) {
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
  async handlePlayerChoice (choice, player, removed) {
    const { data } = this
    const czarCard = blackDeckRef[data.czarCard]
    const blankCount = this.getBlankCount(czarCard)
    const choiceMsdId = data.choiceMsgs[player]
    const playerChoices = data.playerChoices[player]
    const hand = data.hands[player]
    if (removed) {
      const choiceIndex = playerChoices.indexOf(choice)
      if (playerChoices.length === 0 || choiceIndex === -1)
        return
      playerChoices.splice(choiceIndex, 1)
    } else {
      if (blankCount - playerChoices.length <= 0) return
      playerChoices.push(choice)
    }
    this.saveState()

    const s = blankCount === 1 ? '' : 's'
    this.ctx.client.editMessage((await this.ctx.client.getDMChannel(player)).id, choiceMsdId, {
      embed: {
        title: s ? `Pick ${blankCount} cards!` : 'Pick a card!',
        description: this.stringifyBlack(czarCard, playerChoices.map(c => whiteDeckRef[hand[c]])),
        fields: [ {
          name: 'Options',
          value: hand.map((c, i) => `${letterEmoji[i]} ${
            this.ctx.util.text(whiteDeckRef[c], 'capitalize')
          }`).join('\n')
        } ]
      }
    })

    const choiceCount = Object.values(data.playerChoices).filter(c => c.length === blankCount).length
    if (choiceCount === Object.keys(data.playerChoices).length) {
      this.ctx.jobs.cancel(`${this.id}:playerWarn`)
      this.ctx.jobs.cancel(`${this.id}:playerEnd`)
      this.endPlayerPeriod()
    }
  }
  handleCzarChoice (choice, czar, removed) {
    if (removed) return
    const { data } = this
    const czarCard = blackDeckRef[data.czarCard]
    const blankCount = this.getBlankCount(czarCard)

    this.ctx.jobs.cancel(`${this.id}:czarWarn`)
    this.ctx.jobs.cancel(`${this.id}:czarEnd`)
    const candidates = Object.keys(data.playerChoices).filter(p => data.playerChoices[p].length === blankCount)
    const selected = candidates[choice]
    this.ctx.deleteMenu(data.czarMsg)
    this.saveState()
    this.endCzarPeriod(selected)
  }

  // Routine
  async startPlayerPeriod (title) {
    const { data } = this
    const { playerPeriod, warnPeriod } = this.gameConfig
    const czar = this.players[data.czar]
    const czarCard = blackDeckRef[data.czarCard]
    const blankCount = this.getBlankCount(czarCard)

    const s = blankCount === 1 ? '' : 's'
    const a = blankCount === 1 ? 'a ' : ''
    await this.broadcastChat(this.viewers, {
      embed: {
        color: this.game.color,
        title: title || 'Round started!',
        fields: [
          { name: 'Prompt', value: this.stringifyBlack(czarCard) },
          { name: 'Card Czar', value: `<@${czar}>` },
          { name: 'Instructions', value: [
            `**Players**: Select your white card${s} to fill in the blank${s}`,
            `**Card Czar**: Wait until all players have picked ${a}card${s} then select the best one${s}`
          ].join('\n') },
        ],
        footer: { text: `Players have ${playerPeriod} seconds to choose` }
      }
    })

    for (const player of this.players) {
      if (player === czar) {
        await this.dmPlayer(czar, {
          embed: {
            title: 'You are the Card Czar',
            description: `Wait until all players have picked ${a}card${s} then select the best one${s}`
          }
        })
        continue
      }
      const hand = data.hands[player]
      const choiceMsg = await this.dmPlayer(player, {
        embed: {
          title: s ? `Pick ${blankCount} cards!` : 'Pick a card!',
          description: this.stringifyBlack(czarCard),
          fields: [ {
            name: 'Options',
            value: hand.map((c, i) => `${letterEmoji[i]} ${
              this.ctx.util.text(whiteDeckRef[c], 'capitalize')
            }`).join('\n')
          } ]
        }
      })
      data.choiceMsgs[player] = choiceMsg.id
      data.playerChoices[player] = []
      this.saveState()
      this.ctx.createMenu({
        channelId: (await this.ctx.client.getDMChannel(player)).id,
        messageId: choiceMsg.id,
        handlerPath: `gameSessions.${this.id}.handlePlayerChoice`,
        emojis: letterEmoji.slice(0, hand.length)
      })
    }

    const endTime = moment().add(playerPeriod, 'seconds')
    const warnTime = endTime.clone().subtract(warnPeriod, 'seconds')
    this.ctx.jobs.create(`${this.id}:playerWarn`, warnTime, `gameSessions.${this.id}.warnPlayers`)
    this.ctx.jobs.create(`${this.id}:playerEnd`, endTime, `gameSessions.${this.id}.endPlayerPeriod`, true)
  }
  async warnPlayers () {
    const { data } = this
    const { warnPeriod } = this.gameConfig
    const czarCard = blackDeckRef[data.czarCard]
    const blankCount = this.getBlankCount(czarCard)
    const s = blankCount === 1 ? '' : 's'

    for (const [ player, playerChoices ] of Object.entries(data.playerChoices)) {
      if (playerChoices.length < blankCount)
        await this.dmPlayer(player, { embed: { description: `You have ${warnPeriod} seconds to pick your card${s}` } })
    }
  }
  async endPlayerPeriod (isLate) {
    const { data } = this
    const czarCard = blackDeckRef[data.czarCard]
    const blankCount = this.getBlankCount(czarCard)
    const choiceCount = Object.values(data.playerChoices).filter(c => c.length === blankCount).length
    const s = blankCount === 1 ? '' : 's'

    if (choiceCount <= 1) {
      await this.broadcastChat(this.viewers, {
        embed: {
          description: `${choiceCount === 0 ? 'Nobody' : 'Only one player'} chose their card${s} this round, skipping round...`
        }
      })
      this.clearChoices()
      data.czar = this.wrapTurn(data.czar + 1, this.players.length)
      data.blackPile.push(data.czarCard)
      data.czarCard = this.drawCards(data.blackDeck, data.blackPile, 1)[0]
      this.saveState()
      await this.startPlayerPeriod()
    } else {
      const noChoicePlayers = Object.keys(data.playerChoices).filter(p => data.playerChoices[p].length < blankCount)
      if (noChoicePlayers.length) {
        const pS = noChoicePlayers.length === 1 ? '' : 's'
        const pDet = noChoicePlayers.length === 1 ? 'This' : 'These'
        const nCPMentions = noChoicePlayers.map(p => `<@${p}>`)
        await this.dmPlayer(this.host, {
          embed: {
            description: `${pDet} player${pS} did not choose their card${s} this round: ${nCPMentions.join(' ')}`,
            footer: { text: 'As a host, only you can see this message' }
          }
        })
      }
      this.clearChoices(true)
      this.saveState()
      await this.startCzarPeriod()
    }
  }
  async startCzarPeriod () {
    const { data } = this
    const { czarPeriod, warnPeriod } = this.gameConfig
    const czar = this.players[data.czar]
    const czarCard = blackDeckRef[data.czarCard]
    const blankCount = this.getBlankCount(czarCard)

    const s = blankCount === 1 ? '' : 's'
    const candidates = Object.keys(data.playerChoices).filter(p => data.playerChoices[p].length === blankCount)
    const candidatesEmbed = {
      embed: {
        color: this.game.color,
        title: 'Pick the winner',
        description: `Cards have been picked, select the best one${s} <@${czar}>! You have **${czarPeriod}** seconds.`,
        fields: [
          { name: 'Prompt', value: this.stringifyBlack(czarCard) },
          {
            name: 'Candidates',
            value: candidates.map((p, i) => `${letterEmoji[i]} ${
              this.stringifyBlack(czarCard, data.playerChoices[p].map(c => whiteDeckRef[data.hands[p][c]]))
            }`).join('\n')
          }
        ]
      }
    }
    await this.broadcastChat(this.viewers.filter(u => u !== czar), candidatesEmbed)
    const candidatesMsg = await this.dmPlayer(czar, candidatesEmbed)
    this.ctx.createMenu({
      channelId: (await this.ctx.client.getDMChannel(czar)).id,
      messageId: candidatesMsg.id,
      handlerPath: `gameSessions.${this.id}.handleCzarChoice`,
      emojis: letterEmoji.slice(0, candidates.length)
    })
    data.czarMsg = candidatesMsg.id
    this.saveState()
    const endTime = moment().add(czarCard, 'seconds')
    const warnTime = endTime.clone().subtract(warnPeriod, 'seconds')
    this.ctx.jobs.create(`${this.id}:czarWarn`, warnTime, `gameSessions.${this.id}.warnCzar`)
    this.ctx.jobs.create(`${this.id}:czarEnd`, endTime, `gameSessions.${this.id}.endCzarPeriod`)
  }
  warnCzar () {
    const { data } = this
    const { warnPeriod } = this.gameConfig
    const czar = this.players[data.czar]
    const czarCard = blackDeckRef[data.czarCard]
    const blankCount = this.getBlankCount(czarCard)
    const s = blankCount === 1 ? '' : 's'
    return this.dmPlayer(czar, { embed: { description: `You have ${warnPeriod} seconds to select the best card${s}` } })
  }
  async endCzarPeriod (selected) {
    const { data } = this
    const { maxPoints } = this.gameConfig
    const czarCard = blackDeckRef[data.czarCard]
    this.ctx.jobs.cancel(`${this.id}:czarWarn`)
    this.ctx.jobs.cancel(`${this.id}:czarEnd`)
    if (!selected) {
      const oldCzar = this.players[data.czar]
      const oldCzarCard = blackDeckRef[data.czarCard]
      const blankCount = this.getBlankCount(oldCzarCard)
      const s = blankCount === 1 ? '' : 's'
      data.czarCard = this.drawCards(data.blackDeck, data.blackPile, 1)[0]
      data.czar = this.wrapTurn(data.czar + 1, this.players.length)
      data.czarMsg = ''
      this.clearChoices()
      this.saveState()
      await this.broadcastChat(this.viewers, {
        embed: {
          description: `<@${oldCzar}> failed to select a${s?'ny':''} card${s}`,
          footer: { text: 'Next round starts in 5 seconds...' }
        }
      })
      const nextStartTime = moment().add(5, 'seconds')
      this.ctx.jobs.create(`${this.id}:playerStart`, nextStartTime, `gameSessions.${this.id}.startPlayerPeriod`, 'Next round started!')
    } else {
      const selectedCards = data.playerChoices[selected].map(i => data.hands[selected][i])
      for (const [ player, choices ] of Object.entries(data.playerChoices)) {
        if (!this.players.includes(player)) continue
        const cards = choices.map(i => data.hands[player][i])
        data.hands[player] = data.hands[player].filter(c => !cards.includes(c))
        data.whitePile.push(...cards)
        const drawn = this.drawCards(data.whiteDeck, data.whitePile, choices.length)
        data.hands[player].push(...drawn)
      }
      data.blackPile.push(data.czarCard)
      data.czarCard = this.drawCards(data.blackDeck, data.blackPile, 1)[0]
      data.czar = this.wrapTurn(data.czar + 1, this.players.length)
      data.czarMsg = ''
      data.scores[selected]++
      this.clearChoices()
      this.saveState()
      const maxScoreDigits = Math.max(0, ...Object.values(data.scores).map(n => Math.floor(Math.log10(n)) + 1))
      const selectedUser = this.ctx.client.users.get(selected)
      const hasWon = data.scores[selected] >= maxPoints
      const winTitle = hasWon ? 'WON THE GAME!!!' : 'won the round!'
      const footerText = hasWon ? 'CONGRATULATIONS' : 'Next round starts in 15 seconds...'
      await this.broadcastChat(this.viewers, {
        embed: {
          color: 0xffac33,
          title: selectedUser && `${selectedUser.username} ${winTitle}`,
          description: [
            selectedUser ? '' : `<@${selected}> **${winTitle}**\n`,
            this.stringifyBlack(czarCard, selectedCards.map(c => whiteDeckRef[c]))
          ].join('\n').trim(),
          fields: [ {
            name: 'Scores',
            value: [...Object.entries(data.scores)]
              .sort((a, b) => a[1] - b[1])
              .map(s => `\`${s[1].toString().padStart(maxScoreDigits, ' ')}\` <@${s[0]}>`)
              .join('\n')
          } ],
          footer: { text: footerText }
        }
      })
      if (hasWon) {
        await this.winGame(selected)
      } else {
        const nextStartTime = moment().add(15, 'seconds')
        this.ctx.jobs.create(`${this.id}:playerStart`, nextStartTime, `gameSessions.${this.id}.startPlayerPeriod`, 'Next round started!')
      }
    }
  }
  async winGame (winner) {
    // const { data } = this
    return this.destroyGame(winner)
  }

  // Hooks
  startGame () {
    const { data } = this
    const { handSize } = this.gameConfig
    data.hands = {}
    data.whiteDeck = whiteDeckRef.indexes
    data.blackDeck = blackDeckRef.indexes
    data.whitePile = []
    data.blackPile = []
    for (let i = data.whiteDeck.length; i > 0; i--) { // Shuffle white deck
      const j = Math.floor(Math.random() * i)
      const c = data.whiteDeck.splice(j, 1)[0]
      data.whiteDeck.push(c)
    }
    for (let i = data.blackDeck.length; i > 0; i--) { // Shuffle black deck
      const j = Math.floor(Math.random() * i)
      const c = data.blackDeck.splice(j, 1)[0]
      data.blackDeck.push(c)
    }
    for (const player of this.players) {
      const hand = data.whiteDeck.splice(-handSize, handSize)
      data.hands[player] = hand
    }
    data.czarCard = data.blackDeck.pop()
    data.czar = 0
    data.czarMsg = ''
    data.playerChoices = {}
    data.choiceMsgs = {}
    data.scores = Object.fromEntries(this.players.map(p => [p, 0]))
    this.gameState = 'INPROGRESS'
    this.isOpen = true
    this.saveState()
    return this.startPlayerPeriod('First round started!')
  }
  pauseGame () {
    // const { data } = this
  }
  resumeGame () {
    // const { data } = this
  }
  async gameHandleJoin (player) {
    const { data } = this
    const { handSize } = this.gameConfig
    this.players.push(player)
    const drawn = this.drawCards(data.whiteDeck, data.whilePile, handSize)
    data.hands[player] = drawn
    data.scores[player] = 0
    this.saveState()
  }
  async gameHandleLeave (player) {
    const { data } = this
    const playerIndex = this.players.indexOf(player)
    if (playerIndex === -1) return
    const oldCzarIndex = data.czar
    if (playerIndex < oldCzarIndex) {
      data.czar--
      delete data.playerChoices[player]
    } else if (playerIndex === oldCzarIndex) {
      data.blackPile.push(data.czarCard)
      data.czarCard = this.drawCards(data.blackDeck, data.blackPile, 1)[0]
      data.czarMsg = ''
      this.clearChoices()
    }
    data.whitePile.push(...data.hands[player])
    delete data.hands[player]
    delete data.scores[player]
    this.players.splice(playerIndex, 1)
    this.saveState()
    if (playerIndex === oldCzarIndex) {
      await this.startPlayerPeriod()
    }
  }
  gameHandleDestroy () {
    const { data } = this
    for (const [, msgId ] of Object.entries(data.choiceMsgs || {}))
      this.ctx.deleteMenu(msgId)
    this.ctx.deleteMenu(data.czarMsg)
    this.ctx.jobs.cancel(`${this.id}:playerStart`)
    this.ctx.jobs.cancel(`${this.id}:playerWarn`)
    this.ctx.jobs.cancel(`${this.id}:playerEnd`)
    this.ctx.jobs.cancel(`${this.id}:czarStart`)
    this.ctx.jobs.cancel(`${this.id}:czarWarn`)
    this.ctx.jobs.cancel(`${this.id}:czarEnd`)
  }

  // Helpers
  wrapTurn (turn, p) {
    return turn - Math.floor(turn/p)*p
  }
  clearChoices (menuOnly) {
    const { data } = this
    if (!menuOnly)
      data.playerChoices = {}
    for (const [, msgId ] of Object.entries(data.choiceMsgs))
      this.ctx.deleteMenu(msgId)
    data.choiceMsgs = {}
    }
  drawCards (deck, pile, amount) {
    const drawn = []
    for (let i = 0; i < amount; i++) {
      if (deck.length === 0) { // Shuffle pile into deck
        for (let i = pile.length; i > 0; i--) {
          const j = Math.floor(Math.random() * i)
          const c = pile.splice(j, 1)[0]
          pile.push(c)
        }
        deck.unshift(...pile)
        pile.splice(0, pile.length)
      }
      drawn.push(deck.pop())
    }
    return drawn
  }
  getBlankCount (blackCard) {
    let c = 0
    for (const line of blackCard) {
      for (const sect of line) {
        if (typeof sect === 'object' && !sect.text)
          c++
      }
    }
    return c
  }
  stringifyBlack (blackCard, whiteCards = []) {
    const lines = []
    let i = 0
    for (const line of blackCard) {
      lines.unshift('')
      for (const sect of line) {
        if (typeof sect === 'object' && !sect.text) {
          if (whiteCards[i])
            lines[0] += this.ctx.util.text(whiteCards[i], sect.transform, sect.style, 'em')
          else
            lines[0] += '\\_'.repeat(5)
          i++
        } else if (sect.text) {
          const t = this.ctx.util.text(sect.text, sect.transform, sect.style)
          lines[0] += t
        } else if (typeof sect === 'string') {
          lines[0] += sect
        }
      }
    }
    lines.reverse()
    return lines.join('\n')
  }
}

module.exports = CAH
