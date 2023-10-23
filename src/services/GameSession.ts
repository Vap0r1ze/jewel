import { Message, MessageContent } from 'eris'
import { SessionInfoBasic } from '@/plugins/games'
import logger from '@/util/logger'
import Bot from './Bot'

export default class GameSession {
    ctx: Bot

    game: import('@/services/Game').default

    sessionInfo: SessionInfoBasic

    id: string

    createdAt: number

    isOpen: boolean

    poolMsgId: string

    poolChannelId: string

    gameState: 'PREGAME' | 'INPROGRESS' | 'PAUSED' | 'POSTGAME'

    gameConfig: any

    host: string

    players: string[]

    spectators: string[]

    data: any

    lastChatMsg: Dict<Dict<string>>

    dmWarned: string[]

    constructor(sessionInfo: SessionInfoBasic, game: import('@/services/Game').default) {
        this.ctx = game.ctx
        this.game = game
        this.sessionInfo = sessionInfo
        this.createdAt = sessionInfo.createdAt
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

    get viewers() {
        return this.players.concat(this.spectators)
    }

    handleDM(msg: Message) {}

    gameHandleJoin(user: string) {}

    gameHandleLeave(user: string) {}

    gameHandleDestroy() {}

    startGame() {}

    pauseGame() {}

    resumeGame() {}

    init() {}

    saveState() {
        const db = this.ctx.getDB('games')
        const sessionInfo = {
            ...this.sessionInfo,
            gameState: this.gameState,
            gameConfig: this.gameConfig,
            host: this.host,
            players: this.players,
            spectators: this.spectators,
            data: this.data,
        }
        db.set(`sessions.${this.id}`, sessionInfo)
    }

    async dmPlayer(player: string, message: MessageContent) {
        const channel = await this.ctx.client.getDMChannel(player)
        return channel.createMessage(message)
    }

    async broadcastChat(users: string[], message: MessageContent, chatSrc?: string) {
        const errored = []
        // eslint-disable-next-line no-restricted-syntax
        for (const user of users) {
            if (!user) {
                logger.warn('GAME', 'undefined user passed to GameSession#broadcastChat')
                continue
            }
            try {
                if (chatSrc) {
                    if (chatSrc === user) continue
                    let lastChatMsgFromChatSrc = this.lastChatMsg[chatSrc]
                    if (!lastChatMsgFromChatSrc) {
                        lastChatMsgFromChatSrc = {}
                        this.lastChatMsg[chatSrc] = lastChatMsgFromChatSrc
                    }
                    const channel = await this.ctx.client.getDMChannel(user)
                    const lastMessage = Array.from(channel.messages)[channel.messages.size - 1]
                    let chatMsg
                    if (
                        typeof message === 'string'
            && lastMessage
            && lastChatMsgFromChatSrc[user] === lastMessage[0]
                    ) {
                        chatMsg = await channel.createMessage(message.split('\n').slice(1).join('\n'))
                    } else {
                        chatMsg = await channel.createMessage(message)
                    }
                    lastChatMsgFromChatSrc[user] = chatMsg.id
                } else {
                    await this.dmPlayer(user, message)
                }
            } catch (error) {
                if (!this.spectators.includes(user)) throw error
                if (!this.dmWarned.includes(user)) { errored.push(user) }
            }
        }
        if (errored.length) {
            this.dmWarned.push(...errored)
            const mentions = errored.map(u => `<@${u}>`)
            this.ctx.client.createMessage(this.poolChannelId, `${mentions.join(' ')}, I am unable to DM you`)
        }
    }

    chatMessage(msg: Message) {
        const userId = msg.author.id
        const others = this.viewers.filter(p => p !== userId)
        let displayName = `**${msg.author.username}**`
        if (this.spectators.includes(userId)) { displayName += ' **__Spectator__**' }
        return this.broadcastChat(others, `> ${displayName}\n> ${msg.content.slice(0, 1900)}`, msg.author.id)
    }

    async destroyGame(winnerId?: string) {
        const db = this.ctx.getDB('games')
        this.ctx.menus.delete(this.poolMsgId, this.poolChannelId)
        db.delete(`sessions.${this.id}`)
        delete this.ctx.gameSessions[this.id]
        if (this.gameState !== 'PREGAME') { await this.broadcastChat(this.players, '**The game has ended**') }
        if (winnerId) {
            await this.ctx.client.createMessage(this.poolChannelId, {
                embed: {
                    color: this.game.color,
                    description: `<@${this.host}>'s game of **${this.game.displayName}** has just ended! Congratulations to <@${winnerId}> for winning the game!`,
                },
            })
        }
    }

    async handlePoolReact(option: string, userId: string, removed?: boolean) {
        if (removed) return
        const db = this.ctx.getDB('games')
        switch (option) {
            case 'join': {
                if (userId === this.host) return
                const sessions: Dict<SessionInfoBasic> = db.get('sessions') || {}
                Object.values(sessions).some(sessionInfo => {
                    if (!sessionInfo) return false
                    if (sessionInfo.players.includes(userId)) {
                        this.ctx.client.createMessage(this.poolChannelId, `<@${userId}>, You're already in a **${this.ctx.games[sessionInfo.gameName]?.displayName}** session,`
              + ' you can\'t join another game!')
                        return true
                    }
                    return false
                })

                if (!this.players.includes(userId)) {
                    if (this.isOpen) {
                        if (this.gameState !== 'PREGAME') {
                            await this.gameHandleJoin(userId)
                            await this.broadcastChat(this.viewers.filter(p => p !== userId), `**<@${userId}> has joined the game**`)
                            await this.dmPlayer(userId, '**You have joined the game**')
                        } else {
                            this.players.push(userId)
                            this.saveState()
                        }
                        this.ctx.client.createMessage(this.poolChannelId, {
                            embed: {
                                color: 0x41acff,
                                description: `<@${userId}> has joined <@${this.host}>'s game of **${this.game.displayName}**`,
                            },
                        })
                    } else {
                        this.ctx.client.createMessage(this.poolChannelId, `<@${userId}>, This session isn't currently accepting new players`)
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
                            description: `<@${userId}> has disbanded their game of **${this.game.displayName}**`,
                        },
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
                            description: `<@${userId}> has left <@${this.host}>'s game of **${this.game.displayName}**`,
                        },
                    }).then(() => {
                        if (this.players.length < this.game.playerRange[0] && this.gameState !== 'PREGAME') {
                            this.gameHandleDestroy()
                            this.destroyGame()
                            this.ctx.client.createMessage(this.poolChannelId, {
                                embed: {
                                    color: 0xff5441,
                                    description: `<@${this.host}>'s game of **${this.game.displayName}** has ended since too many players left`,
                                },
                            })
                        }
                    })
                } else if (this.spectators.includes(userId)) {
                    const userIndex = this.spectators.indexOf(userId)
                    this.spectators.splice(userIndex, 1)
                    this.saveState()
                    this.ctx.client.createMessage(this.poolChannelId, {
                        embed: {
                            description: `<@${userId}> has stopped spectating <@${this.host}>'s game of **${this.game.displayName}**`,
                        },
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
                                this.ctx.client.createMessage(this.poolChannelId, `<@${userId}>, you cannot start the game with only ${p} player${p === 1 ? '' : 's'}!`)
                            } else {
                                this.isOpen = false
                                this.broadcastChat(this.players, '**The game is starting**').then(() => {
                                    this.ctx.client.createMessage(this.poolChannelId, {
                                        embed: {
                                            color: 0x43b581,
                                            description: `<@${userId}>'s game of **${this.game.displayName}** has just started! Have fun players!`,
                                            footer: { text: 'Remember that all of the gameplay takes place in DMs!' },
                                        },
                                    })
                                    this.startGame()
                                }).catch(error => {
                                    logger.error('GAME', error)
                                    this.ctx.client.createMessage(this.poolChannelId, {
                                        embed: {
                                            color: 0xFF0000,
                                            description: `<@${userId}>'s game of **${this.game.displayName}** had trouble starting. Make sure everybody's DMs are open!`,
                                        },
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
                        default: {
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
                            description: `<@${userId}> is no longer spectating <@${this.host}>'s game of **${this.game.displayName}**`,
                        },
                    })
                } else {
                    const sessions: Dict<SessionInfoBasic> = db.get('sessions') || {}
                    Object.values(sessions).some(sessionInfo => {
                        if (!sessionInfo) return false
                        if (sessionInfo.players.includes(userId)) {
                            this.ctx.client.createMessage(this.poolChannelId, `<@${userId}>, You're already in a game session,`
                + ` you can't spectate another game! (${sessionInfo.gameName} #${sessionInfo.id})`)
                            return true
                        }
                        return false
                    })
                    if (this.gameState !== 'PREGAME') {
                        await this.broadcastChat(this.viewers.filter(p => p !== userId), `**<@${userId}> is now spectating the game**`)
                        await this.dmPlayer(userId, '**You are now spectating the game**')
                    }
                    this.spectators.push(userId)
                    this.saveState()
                    this.ctx.client.createMessage(this.poolChannelId, {
                        embed: {
                            description: `<@${userId}> is now spectating <@${this.host}>'s game of **${this.game.displayName}**`,
                        },
                    })
                }
                break
            }
            default: {
                break
            }
        }
    }

    pauseSession() {
        this.pauseGame()
        this.gameState = 'PAUSED'
        this.saveState()
        this.broadcastChat(this.players, '**Game paused by host**')
    }

    resumeSession() {
        this.resumeGame()
        this.gameState = 'INPROGRESS'
        this.saveState()
        this.broadcastChat(this.players, '**Game resumed by host**')
    }

    handleSpectatorDM(msg: Message) {
        return this.chatMessage(msg)
    }
}
