import { Message } from 'eris'
import shortid from 'shortid'
import { SessionInfoBasic } from '@/plugins/games'
import Bot from './Bot'
import Command, { CommandArgs } from './Command'
import GameSession from './GameSession'

export default class GameCommand extends Command {
  game: import('@/services/Game').default

  constructor(ctx: Bot, game: import('@/services/Game').default) {
    super(ctx)
    this.game = game
  }

  get category() {
    return 'Games'
  }

  get description() {
    return `Get information about ${this.game.displayName}`
  }

  get name() {
    return this.game.name
  }

  checkHostForSession(msg: Message) {
    const db = this.ctx.getDB('games')
    const sessions: Dict<SessionInfoBasic> = db.get('sessions') || {}
    // eslint-disable-next-line no-restricted-syntax
    for (const sessionInfo of Object.values(sessions)) {
      if (!sessionInfo) return null
      if (
        sessionInfo.players.includes(msg.author.id)
        || sessionInfo.spectators.includes(msg.author.id)
      ) {
        return sessionInfo
      }
    }
    return null
  }

  async handle(msg: Message, args: CommandArgs) {
    const {
      GAME_JOIN_EMOJI, GAME_LEAVE_EMOJI, GAME_START_EMOJI, GAME_CONFIG_EMOJI,
      GAME_SPECTATE_EMOJI, GAME_CHANNEL_WHITELIST, PREFIX, DEVELOPERS,
    } = process.env
    const authorId = msg.author.id
    if (!GAME_CHANNEL_WHITELIST.includes(msg.channel.id)) return

    const sessionEmbed = {
      color: this.game.color,
      description: [
        `React with <:${GAME_JOIN_EMOJI}> to join, <:${GAME_LEAVE_EMOJI}> to leave, or <:${GAME_SPECTATE_EMOJI}> to spectate. The game host can start/pause the game with <:${GAME_START_EMOJI}>.`,
        `The game host can also change the configuration by reacting with <:${GAME_CONFIG_EMOJI}>.`,
      ].join('\n'),
      footer: {
        text: `Requires ${this.game.playerRange.join('-')} players`,
      },
    }
    switch ((args.shift() || '').toLowerCase()) {
      case 'kick': {
        const sessionInfo = this.checkHostForSession(msg)
        if (sessionInfo && (sessionInfo.host === authorId || DEVELOPERS.includes(authorId))) {
          const session = this.ctx.gameSessions[sessionInfo.id]
          if (!session) return
          const match = /(?:<@!?)?(\d+)>?/.exec(args[0] || '')
          if (match) {
            const [,player] = match
            if (session.players.includes(player)) {
              if (session.gameState !== 'PREGAME') {
                session.gameHandleLeave(player)
                await session.broadcastChat(session.viewers.filter(p => p !== player), `**<@${player}> has been kicked from the game**`)
                await session.dmPlayer(player, '**You have been kicked from the game**')
              } else {
                session.players.splice(session.players.indexOf(player), 1)
              }
              session.saveState()
              this.ctx.client.createMessage(session.poolChannelId, {
                embed: {
                  color: 0xffc941,
                  description: `<@${player}> has been kicked from <@${session.host}>'s game of **${session.game.displayName}**`,
                },
              }).then(() => {
                if (session.players.length < session.game.playerRange[0] && session.gameState !== 'PREGAME') {
                  session.destroyGame()
                  this.ctx.client.createMessage(session.poolChannelId, {
                    embed: {
                      color: 0xff5441,
                      description: `<@${session.host}>'s game of **${session.game.displayName}** has ended since there aren't enough players to continue`,
                    },
                  })
                }
              })
            }
          } else {
            msg.channel.createMessage(`<@${authorId}>, I could not find that user in your session.`)
          }
        }
        break
      }
      case 'repost':
      case 'show': {
        const sessionInfo = this.checkHostForSession(msg)
        if (!sessionInfo || sessionInfo.host !== authorId) {
          msg.channel.createMessage(`<@${authorId}>, You're not the host of any session.`)
          return
        }
        if (sessionInfo.gameName !== this.game.name) {
          msg.channel.createMessage(`<@${authorId}>, You're hosting a different game.`)
          return
        }

        const session = this.ctx.gameSessions[sessionInfo.id]
        if (!session) return
        msg.channel.createMessage({
          content: `<@${authorId}>`,
          embed: { title: `${msg.author.username}'s game of ${this.game.displayName}`, ...sessionEmbed },
        }).then(newPoolMsg => {
          this.ctx.menus.delete(session.poolMsgId, session.poolChannelId)
          session.poolMsgId = newPoolMsg.id
          session.poolChannelId = newPoolMsg.channel.id
          session.saveState()
          this.ctx.menus.create({
            channelId: newPoolMsg.channel.id,
            messageId: newPoolMsg.id,
            emojis: {
              join: GAME_JOIN_EMOJI,
              leave: GAME_LEAVE_EMOJI,
              start: GAME_START_EMOJI,
              config: GAME_CONFIG_EMOJI,
              spectate: GAME_SPECTATE_EMOJI,
            },
            handlerPath: `gameSessions.${sessionInfo.id}.handlePoolReact`,
          })
        })
        break
      }
      case 'start': {
        let sessionInfo = this.checkHostForSession(msg)
        if (sessionInfo) {
          if (this.game.name === sessionInfo.gameName && sessionInfo.host === authorId) {
            const session = this.ctx.gameSessions[sessionInfo.id]
            if (session) {
              session.handlePoolReact('start', authorId)
              return
            }
          }
          msg.channel.createMessage(`<@${authorId}>, You're already in a session of **${this.ctx.games[sessionInfo.gameName]?.displayName}**`)
          return
        }

        msg.channel.createMessage({
          embed: {
            color: this.game.color,
            title: 'Creating game...',
            footer: { text: `Game: ${this.game.displayName}` },
          },
        }).then(poolMsg => {
          sessionInfo = this.checkHostForSession(msg)
          if (sessionInfo) {
            poolMsg.edit({
              embed: {
                color: 0xFF0000,
                title: 'Could not create game.',
                description: `You're already in a session of **${this.ctx.games[sessionInfo.gameName]?.displayName}**`,
              },
            })
          } else {
            sessionInfo = {
              id: shortid(),
              createdAt: Date.now(),
              isOpen: true,
              poolMsgId: poolMsg.id,
              poolChannelId: poolMsg.channel.id,
              gameName: this.game.name,
              gameState: 'PREGAME',
              gameConfig: this.game.defaultConfig,
              host: authorId,
              players: [authorId],
              spectators: [],
              data: {},
            }
            this.game.createSession(sessionInfo)
            poolMsg.edit({
              content: `<@${authorId}>`,
              embed: { title: 'Game created!', ...sessionEmbed },
            })
            this.ctx.menus.create({
              channelId: poolMsg.channel.id,
              messageId: poolMsg.id,
              emojis: {
                join: GAME_JOIN_EMOJI,
                leave: GAME_LEAVE_EMOJI,
                start: GAME_START_EMOJI,
                config: GAME_CONFIG_EMOJI,
                spectate: GAME_SPECTATE_EMOJI,
              },
              handlerPath: `gameSessions.${sessionInfo.id}.handlePoolReact`,
            })
          }
        })
        break
      }
      case 'join': {
        const latestSession = this.getLastestSession(sesh => sesh.game.name === this.game.name
          && sesh.poolChannelId === msg.channel.id)
        if (latestSession) {
          latestSession.handlePoolReact('join', authorId)
        } else {
          msg.channel.createMessage(`<@${authorId}>, There are no **${this.game.displayName}** sessions active in this channel.`)
        }
        break
      }
      case 'watch':
      case 'see':
      case 'spectate': {
        const latestSession = this.getLastestSession(sesh => sesh.game.name === this.game.name
          && sesh.poolChannelId === msg.channel.id)
        if (latestSession) {
          if (latestSession.players.includes(authorId)) {
            msg.channel.createMessage(`<@${authorId}>, you cannot spectate a game while you're currently in a session.`)
          } else {
            latestSession.handlePoolReact('spectate', authorId)
          }
        } else {
          msg.channel.createMessage(`<@${authorId}>, There are no **${this.game.displayName}** sessions active in this channel.`)
        }
        break
      }
      case 'leave': {
        const latestSession = this.getLastestSession(sesh => sesh.game.name === this.game.name
          && sesh.viewers.includes(authorId))
        if (latestSession) {
          if (latestSession.players.includes(authorId)) {
            latestSession.handlePoolReact('leave', authorId)
          } else if (latestSession.spectators.includes(authorId)) {
            latestSession.handlePoolReact('spectate', authorId)
          }
        } else {
          msg.channel.createMessage(`<@${authorId}>, you aren't in any **${this.game.displayName}** sessions right now.`)
        }
        break
      }
      default: {
        const gameCmd = PREFIX + this.game.name
        msg.channel.createMessage({
          embed: {
            color: this.game.color,
            title: `${this.game.displayName} help`,
            footer: { text: `Requires ${this.game.playerRange.join('-')} players | Start a game with "${PREFIX}${this.name} start"` },
            fields: [{
              name: 'Commands',
              value: [
                `\`${gameCmd} show\` Repost the embed for the game **(host only)**`,
                `\`${gameCmd} kick <user>\` Kicks the user from your game **(host only)**`,
                `\`${gameCmd} start\` Start a game of ${this.game.displayName}`,
                `\`${gameCmd} join\` Join the most recently created game of ${this.game.displayName} in the channel`,
                `\`${gameCmd} spectate\` Spectate the most recently created game of ${this.game.displayName} in the channel`,
                `\`${gameCmd} leave\` Leave the game of ${this.game.displayName} you are currently in`,
              ].join('\n'),
            }],
            ...this.game.helpEmbed,
          },
        })
      }
    }
  }

  getLastestSession(filter: (sesh: GameSession) => boolean): GameSession | null {
    const sessions = Object.values(this.ctx.gameSessions) as GameSession[]
    const sessionsFiltered = sessions.filter(filter)
    if (sessionsFiltered.length > 0) {
      sessionsFiltered.sort((a, b) => b.createdAt - a.createdAt)
      return sessionsFiltered[0]
    }
    return null
  }
}
