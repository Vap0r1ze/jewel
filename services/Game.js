const Command = require('./Command')
const shortid = require('shortid')
const { queue } = require('async')

class Game {
  constructor (ctx) {
    this.ctx = ctx
    this.init()
  }
  get name () { return '' }
  get displayName () { return '' }
  get description () { return '' }
  get color () { return 0 }
  get playerRange () { return [0, 0] }
  get defaultConfig () { return {} }
  get helpEmbed () { return {} }

  init () {
    const command = new GameCommand(this.ctx, this)
    this.command = command
  }
  createSession (sessionInfo) {
    const db = this.ctx.getDB('games')
    const session = new this.Session(sessionInfo, this)
    db.set(`sessions.${sessionInfo.id}`, sessionInfo)
    this.ctx.gameSessions[sessionInfo.id] = session
  }
}

class GameSession {
  constructor (sessionInfo, game) {
    this.ctx = game.ctx
    this.game = game
    this.sessionInfo = sessionInfo
    this.id = sessionInfo.id
    this.poolMsgId = sessionInfo.poolMsgId
    this.poolChannelId = sessionInfo.poolChannelId
    this.gameState = sessionInfo.gameState
    this.gameConfig = sessionInfo.gameConfig
    this.host = sessionInfo.host
    this.players = sessionInfo.players
    this.spectators = sessionInfo.spectators
    this.data = sessionInfo.data
    this.init()
  }
  init () {
    const db = this.ctx.getDB('games')
  }
  saveState () {
    const db = this.ctx.getDB('games')
    const sessionInfo = Object.assign({}, this.sessionInfo, {
      gameState: this.gameState,
      gameConfig: this.gameConfig,
      host: this.host,
      players: this.players,
      spectators: this.spectators,
      data: this.data
    })
    db.set(`sessions.${this.id}`, sessionInfo)
  }
  async dmPlayer (player, message) {
    const channel = await this.ctx.client.getDMChannel(player)
    return await channel.createMessage(message)
  }
  async broadcastChat (players, message, isChatMsg) {
    const errored = []
    const users = players.concat(this.spectators)
    for (const user of users) {
      try {
        if (isChatMsg) {
          const channel = await this.ctx.client.getDMChannel(user)
          const lastMessage = Array.from(channel.messages)[channel.messages.size - 1]
          if (lastMessage && lastMessage[1].content.split('\n')[0] === message.split('\n')[0])
            await channel.createMessage(message.split('\n').slice(1).join('\n'))
          else
            await channel.createMessage(message)
        } else {
          await this.dmPlayer(user, message)
        }
      } catch (error) {
        console.log(error)
        errored.push(user)
      }
    }
    return errored.length && errored
  }
  chatMessage (msg) {
    const userId = msg.author.id
    const others = this.players.filter(p => p !== userId)
    return this.broadcastChat(others, `> **${msg.author.username}**\n> ${msg.content.slice(0,1900)}`, true)
  }
  async destroyGame (winnerId) {
    const db = this.ctx.getDB('games')
    this.ctx.deleteMenu(this.poolMsgId)
    db.delete(`sessions.${this.id}`)
    delete this.ctx.gameSessions[this.id]
    if (this.gameState !== 'PREGAME')
      await this.broadcastChat(this.players, '**The game has ended**')
    if (winnerId) {
      await this.ctx.client.createMessage(this.poolChannelId, {
        embed: {
          color: this.game.color,
          description: `<@${this.host}>'s game of **${this.game.displayName}** has just ended! Congratulations to <@${winnerId}> for winning the game!`
        }
      })
    }
  }
  handlePoolReact (option, userId) {
    const db = this.ctx.getDB('games')
    switch (option) {
      case 'join': {
        if (userId === this.host) return
        const sessions = db.get('sessions') || {}
        for (const sessionInfo of Object.values(sessions)) {
          if (sessionInfo.players.includes(userId)) {
            return this.ctx.client.createMessage(this.poolChannelId, `<@${userId}>, You're already in a game session,`
              + ` you can't join another game! (${sessionInfo.gameName} #${sessionInfo.id})`)
          }
        }

        if (!this.players.includes(userId)) {
          if (this.gameState === 'PREGAME') {
            this.players.push(userId)
            this.saveState()
            this.ctx.client.createMessage(this.poolChannelId, {
              embed: {
                color: 0x41acff,
                description: `<@${userId}> has joined <@${this.host}>'s game of **${this.game.displayName}**`
              }
            })
          } else if (!this.spectators.includes(userId)) {
            this.spectators.push(userId)
            this.saveState()
            this.ctx.client.createMessage(this.poolChannelId, {
              embed: {
                description: `<@${userId}> has started spectating <@${this.host}>'s game of **${this.game.displayName}**`
              }
            })
          }
        }
        break
      }
      case 'leave': {
        if (userId === this.host) {
          this.destroyGame()
          this.ctx.client.createMessage(this.poolChannelId, {
            embed: {
              color: 0xff5441,
              description: `<@${userId}> has disbanded their game of **${this.game.displayName}**`
            }
          })
        } else if (this.players.includes(userId)) {
          this.gameHandleLeave(userId)
          const playerIndex = this.players.indexOf(userId)
          this.players.splice(playerIndex, 1)
          this.saveState()
          this.ctx.client.createMessage(this.poolChannelId, {
            embed: {
              color: 0xffc941,
              description: `<@${userId}> has left <@${this.host}>'s game of **${this.game.displayName}**`
            }
          }).then(() => {
            if (this.players.length < this.game.playerRange[0] && this.gameState !== 'PREGAME') {
              this.destroyGame()
              this.ctx.client.createMessage(this.poolChannelId, {
                embed: {
                  color: 0xff5441,
                  description: `<@${this.host}>'s game of **${this.game.displayName}** has ended since too many players left`
                }
              })
            }
          })
        } else if (this.spectators.includes(userId)) {
          const userIndex = this.spectators.indexOf(userId)
          this.spectators.splice(userIndex, 1)
          this.saveState()
          this.ctx.client.createMessage(this.poolChannelId, {
            embed: {
              description: `<@${userId}> has stopped spectating <@${this.host}>'s game of **${this.game.displayName}**`
            }
          })
        }
        break
      }
      case 'start': {
        if (userId === this.host) {
          switch (this.gameState) {
            case 'PREGAME': {
              if (this.players.length < this.game.playerRange[0]) {
                const p = this.players.length
                this.ctx.client.createMessage(this.poolChannelId, `<@${userId}>, you cannot start the game with only ${p} player${p===1?'':'s'}!`)
              } else {
                this.ctx.client.createMessage(this.poolChannelId, {
                  embed: {
                    color: 0x43b581,
                    description: `<@${userId}>'s game of **${this.game.displayName}** has just started! Have fun players!`
                  }
                })
                this.startGame()
              }
              break
            }
            case 'INPROGRESS': {
              this.pauseGame()
              break
            }
            case 'PAUSED': {
              this.resumeGame()
              break
            }
          }
        }
        break
      }
    }
  }
  handleSpectatorDM (msg) {
    return this.chatMessage(msg)
  }
}

class GameCommand extends Command {
  constructor (ctx, game) {
    super(ctx)
    this.game = game
  }
  get description () {
    return `start a game of ${this.game.name}`
  }
  get name () {
    return this.game.name
  }
  checkHostForSession (msg) {
    const db = this.ctx.getDB('games')
    const sessions = db.get('sessions') || {}
    for (const sessionInfo of Object.values(sessions)) {
      if (sessionInfo.players.includes(msg.author.id)) {
        return sessionInfo
      }
    }
  }
  handle (msg, args) {
    const { GAME_JOIN_EMOJI, GAME_LEAVE_EMOJI, GAME_START_EMOJI, GAME_CONFIG_EMOJI, GAME_CHANNEL_WHITELIST, PREFIX } = process.env
    const authorId = msg.author.id
    if (!GAME_CHANNEL_WHITELIST.includes(msg.channel.id)) return

    if ((args[0] || '').toLowerCase() === 'help') {
      return msg.channel.createMessage({
        embed: Object.assign({
          color: this.game.color,
          title: `${this.game.displayName} help`,
          footer: { text: `Requires ${this.game.playerRange.join('-')} players | Start a game with ${PREFIX}${this.name}` }
        }, this.game.helpEmbed)
      })
    }

    let sessionInfo = this.checkHostForSession(msg)
    if (sessionInfo)
      return msg.channel.createMessage(`<@${msg.author.id}>, You're already in a game session! (${sessionInfo.gameName} #${sessionInfo.id})`)

    msg.channel.createMessage({
      embed: {
        color: this.game.color,
        title: 'Creating game...',
        footer: { text: `Game: ${this.game.displayName}` }
      }
    }).then(poolMsg => {
      sessionInfo = this.checkHostForSession(msg)
      if (sessionInfo) {
        poolMsg.edit({
          embed: {
            color: 0xFF0000,
            title: 'Could not create game.',
            description: `You're already in a game session! (${sessionInfo.gameName} #${sessionInfo.id})`
          }
        })
      } else {
        sessionInfo = {
          id: shortid(),
          poolMsgId: poolMsg.id,
          poolChannelId: poolMsg.channel.id,
          gameName: this.game.name,
          gameState: 'PREGAME',
          gameConfig: this.game.defaultConfig,
          host: authorId,
          players: [ authorId ],
          spectators: [],
          data: {},
        }
        this.game.createSession(sessionInfo)
        poolMsg.edit({
          content: `<@${authorId}>`,
          embed: {
            color: this.game.color,
            title: 'Game created!',
            description: [
              `React with <:${GAME_JOIN_EMOJI}> to join and <:${GAME_LEAVE_EMOJI}> to leave. The game host can start/pause the game with <:${GAME_START_EMOJI}>.`,
              `The game host can also change the configuration by reacting with <:${GAME_CONFIG_EMOJI}>.`
            ].join('\n'),
            footer: {
              text: `Requires ${this.game.playerRange.join('-')} players`
            }
          }
        })
        this.ctx.createMenu({
          channelId: poolMsg.channel.id,
          messageId: poolMsg.id,
          emojis: {
            join: GAME_JOIN_EMOJI,
            leave: GAME_LEAVE_EMOJI,
            start: GAME_START_EMOJI,
            config: GAME_CONFIG_EMOJI
          },
          handlerPath: `gameSessions.${sessionInfo.id}.handlePoolReact`
        })
      }
    })
  }
}

module.exports = { Game, GameSession }
