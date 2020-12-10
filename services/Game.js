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
    this.isOpen = sessionInfo.isOpen
    this.id = sessionInfo.id
    this.poolMsgId = sessionInfo.poolMsgId
    this.poolChannelId = sessionInfo.poolChannelId
    this.gameState = sessionInfo.gameState
    this.gameConfig = sessionInfo.gameConfig
    this.host = sessionInfo.host
    this.players = sessionInfo.players
    this.spectators = sessionInfo.spectators
    this.data = sessionInfo.data
    this.dmWarned = []
    this.lastChatMsg = {}
    this.init()
  }
  get viewers () {
    return this.players.concat(this.spectators)
  }

  gameHandleJoin () {}
  gameHandleLeave () {}
  gameHandleDestroy () {}
  startGame () {}
  pauseGame () {}
  resumeGame () {}

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
  async broadcastChat (users, message, chatSrc) {
    const errored = []
    for (const user of users) {
      try {
        if (chatSrc) {
          if (chatSrc === user) continue
          if (!this.lastChatMsg[chatSrc])
            this.lastChatMsg[chatSrc] = {}
          const channel = await this.ctx.client.getDMChannel(user)
          const lastMessage = Array.from(channel.messages)[channel.messages.size - 1]
          let chatMsg
          if (lastMessage && this.lastChatMsg[chatSrc][user] === lastMessage[0])
            chatMsg = await channel.createMessage(message.split('\n').slice(1).join('\n'))
          else
            chatMsg = await channel.createMessage(message)
          this.lastChatMsg[chatSrc][user] = chatMsg.id
        } else {
          await this.dmPlayer(user, message)
        }
      } catch (error) {
        if (!this.spectators.includes(user)) throw error
        if (!this.dmWarned.includes(user))
          errored.push(user)
      }
    }
    if (errored.length) {
      this.dmWarned.push(...errored)
      const mentions = errored.map(u => `<@${u}>`)
      this.ctx.client.createMessage(this.poolChannelId, `${mentions.join(' ')}, I am unable to DM you`)
    }
  }
  chatMessage (msg) {
    const userId = msg.author.id
    const others = this.viewers.filter(p => p !== userId)
    let displayName = `**${msg.author.username}**`
    if (this.spectators.includes(userId))
      displayName += ' **__Spectator__**'
    return this.broadcastChat(others, `> ${displayName}\n> ${msg.content.slice(0,1900)}`, msg.author.id)
  }
  async destroyGame (winnerId) {
    const db = this.ctx.getDB('games')
    this.ctx.deleteMenu(this.poolMsgId, this.poolChannelId)
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
  async handlePoolReact (option, userId, removed) {
    if (removed) return
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
          if (this.isOpen) {
            if (this.gameState !== 'PREGAME') {
              await this.gameHandleJoin()
              await this.broadcastChat(this.viewers.filter(p => p !== userId), `**<@${userId}> has joined the game**`)
              await this.dmPlayer(userId, '**You have joined the game**')
            } else {
              this.players.push(userId)
              this.saveState()
            }
            this.ctx.client.createMessage(this.poolChannelId, {
              embed: {
                color: 0x41acff,
                description: `<@${userId}> has joined <@${this.host}>'s game of **${this.game.displayName}**`
              }
            })
          } else {
            return this.ctx.client.createMessage(this.poolChannelId, `<@${userId}>, This session isn't currently accepting new players`)
          }
        }
        break
      }
      case 'leave': {
        if (userId === this.host) {
          this.gameHandleDestroy()
          this.destroyGame()
          this.ctx.client.createMessage(this.poolChannelId, {
            embed: {
              color: 0xff5441,
              description: `<@${userId}> has disbanded their game of **${this.game.displayName}**`
            }
          })
        } else if (this.players.includes(userId)) {
          if (this.gameState !== 'PREGAME') {
            this.gameHandleLeave(userId)
            await this.broadcastChat(this.viewers.filter(p => p !== userId), `**<@${userId}> has left the game**`)
            await this.dmPlayer(userId, '**You have left the game**')
          } else {
            this.players.splice(this.players.indexOf(userId), 1)
          }
          this.saveState()
          this.ctx.client.createMessage(this.poolChannelId, {
            embed: {
              color: 0xffc941,
              description: `<@${userId}> has left <@${this.host}>'s game of **${this.game.displayName}**`
            }
          }).then(() => {
            if (this.players.length < this.game.playerRange[0] && this.gameState !== 'PREGAME') {
              this.gameHandleDestroy()
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
                this.isOpen = false
                this.broadcastChat(this.players, '**The game is starting**').then(() => {
                  this.ctx.client.createMessage(this.poolChannelId, {
                    embed: {
                      color: 0x43b581,
                      description: `<@${userId}>'s game of **${this.game.displayName}** has just started! Have fun players!`
                    }
                  })
                  this.startGame()
                }).catch(error => {
                  this.ctx.util.logger.error('GAME', error)
                  this.ctx.client.createMessage(this.poolChannelId, {
                    embed: {
                      color: 0xFF0000,
                      description: `<@${userId}>'s game of **${this.game.displayName}** had trouble starting. Make sure everybody's DMs are open!`
                    }
                  })
                })
              }
              break
            }
            case 'INPROGRESS': {
              this.pauseSession()
              break
            }
            case 'PAUSED': {
              this.resumeSession()
              break
            }
          }
        }
        break
      }
      case 'spectate': {
        if (this.players.includes(userId)) return

        if (this.spectators.includes(userId)) {
          this.spectators.splice(this.spectators.indexOf(userId), 1)
          this.saveState()
          if (this.gameState !== 'PREGAME') {
            await this.broadcastChat(this.viewers.filter(p => p !== userId), `**<@${userId}> is no longer spectating the game**`)
            await this.dmPlayer(userId, '**You are no longer spectating the game**')
          }
          this.ctx.client.createMessage(this.poolChannelId, {
            embed: {
              description: `<@${userId}> is no longer spectating <@${this.host}>'s game of **${this.game.displayName}**`
            }
          })
        } else {
          const sessions = db.get('sessions') || {}
          for (const sessionInfo of Object.values(sessions)) {
            if (sessionInfo.players.includes(userId)) {
              return this.ctx.client.createMessage(this.poolChannelId, `<@${userId}>, You're already in a game session,`
                + ` you can't spectate another game! (${sessionInfo.gameName} #${sessionInfo.id})`)
            }
          }
          if (this.gameState !== 'PREGAME') {
            await this.broadcastChat(this.viewers.filter(p => p !== userId), `**<@${userId}> is now spectating the game**`)
            await this.dmPlayer(userId, '**You are now spectating the game**')
          }
          this.spectators.push(userId)
          this.saveState()
          this.ctx.client.createMessage(this.poolChannelId, {
            embed: {
              description: `<@${userId}> is now spectating <@${this.host}>'s game of **${this.game.displayName}**`
            }
          })
        }
      }
    }
  }
  pauseSession () {
    this.pauseGame()
    this.gameState = 'PAUSED'
    this.saveState()
    this.broadcastChat(this.players, '**Game paused by host**')
  }
  resumeSession () {
    this.resumeGame()
    this.gameState = 'INPROGRESS'
    this.saveState()
    this.broadcastChat(this.players, '**Game resumed by host**')
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
  get category () {
    return 'Games'
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
      if (sessionInfo.players.includes(msg.author.id) || sessionInfo.spectators.includes(msg.author.id)) {
        return sessionInfo
      }
    }
  }
  async handle (msg, args) {
    const { GAME_JOIN_EMOJI, GAME_LEAVE_EMOJI, GAME_START_EMOJI, GAME_CONFIG_EMOJI, GAME_SPECTATE_EMOJI, GAME_CHANNEL_WHITELIST, PREFIX, DEVELOPERS } = process.env
    const authorId = msg.author.id
    if (!GAME_CHANNEL_WHITELIST.includes(msg.channel.id)) return

    const sessionEmbed = {
      color: this.game.color,
      description: [
        `React with <:${GAME_JOIN_EMOJI}> to join, <:${GAME_LEAVE_EMOJI}> to leave, or <:${GAME_SPECTATE_EMOJI}> to spectate. The game host can start/pause the game with <:${GAME_START_EMOJI}>.`,
        `The game host can also change the configuration by reacting with <:${GAME_CONFIG_EMOJI}>.`
      ].join('\n'),
      footer: {
        text: `Requires ${this.game.playerRange.join('-')} players`
      }
    }
    switch ((args.shift() || '').toLowerCase()) {
      case 'kick': {
        const sessionInfo = this.checkHostForSession(msg)
        if (sessionInfo && (sessionInfo.host === authorId || DEVELOPERS.includes(authorId))) {
          const session = this.ctx.gameSessions[sessionInfo.id]
          const match = /(?:<@!?)?(\d+)>?/.exec(args[0])
          if (match) {
            const player = match[1]
            if (session.players.includes(player)) {
              if (session.gameState !== 'PREGAME') {
                session.gameHandleLeave(player)
                await this.broadcastChat(this.viewers.filter(p => p !== player), `**<@${player}> has been kicked from the game**`)
                await this.dmPlayer(player, '**You have been kicked from the game**')
              } else {
                session.players.splice(session.players.indexOf(player), 1)
              }
              session.saveState()
              this.ctx.client.createMessage(session.poolChannelId, {
                embed: {
                  color: 0xffc941,
                  description: `<@${userId}> has been kicked from <@${session.host}>'s game of **${session.game.displayName}**`
                }
              }).then(() => {
                if (session.players.length < session.game.playerRange[0] && session.gameState !== 'PREGAME') {
                  session.destroyGame()
                  this.ctx.client.createMessage(session.poolChannelId, {
                    embed: {
                      color: 0xff5441,
                      description: `<@${session.host}>'s game of **${session.game.displayName}** has ended since there aren't enough players to continue`
                    }
                  })
                }
              })
            }
          }
          return msg.channel.createMessage(`<@${authorId}>, I could not find that user in your session.`)
        }
        break
      }
      case 'repost':
      case 'show': {
        const sessionInfo = this.checkHostForSession(msg)
        if (!sessionInfo || sessionInfo.host !== authorId)
          return msg.channel.createMessage(`<@${authorId}>, You're not the host of any session.`)
        if (sessionInfo.gameName !== this.game.name)
          return msg.channel.createMessage(`<@${authorId}>, You're hosting a different game.`)

        const session = this.ctx.gameSessions[sessionInfo.id]
        msg.channel.createMessage({
          content: `<@${authorId}>`,
          embed: Object.assign({ title: `${msg.author.username}'s game of ${this.game.displayName}` }, sessionEmbed)
        }).then(newPoolMsg => {
          this.ctx.deleteMenu(session.poolMsgId, session.poolChannelId)
          session.poolMsgId = newPoolMsg.id
          session.poolChannelId = newPoolMsg.channel.id
          session.saveState()
          this.ctx.createMenu({
            channelId: newPoolMsg.channel.id,
            messageId: newPoolMsg.id,
            emojis: {
              join: GAME_JOIN_EMOJI,
              leave: GAME_LEAVE_EMOJI,
              start: GAME_START_EMOJI,
              config: GAME_CONFIG_EMOJI,
              spectate: GAME_SPECTATE_EMOJI,
            },
            handlerPath: `gameSessions.${sessionInfo.id}.handlePoolReact`
          })
        })
        break
      }
      case 'start': {
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
              isOpen: true,
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
              embed: Object.assign({ title: 'Game created!' }, sessionEmbed)
            })
            this.ctx.createMenu({
              channelId: poolMsg.channel.id,
              messageId: poolMsg.id,
              emojis: {
                join: GAME_JOIN_EMOJI,
                leave: GAME_LEAVE_EMOJI,
                start: GAME_START_EMOJI,
                config: GAME_CONFIG_EMOJI,
                spectate: GAME_SPECTATE_EMOJI,
              },
              handlerPath: `gameSessions.${sessionInfo.id}.handlePoolReact`
            })
          }
        })
        break
      }
      default: {
        return msg.channel.createMessage({
          embed: Object.assign({
            color: this.game.color,
            title: `${this.game.displayName} help`,
            footer: { text: `Requires ${this.game.playerRange.join('-')} players | Start a game with "${PREFIX}${this.name} start"` }
          }, this.game.helpEmbed)
        })
      }
    }
  }
}

module.exports = { Game, GameSession }
