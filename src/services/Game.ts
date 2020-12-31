import { SessionInfoBasic } from '@/plugins/games'
import Bot from './Bot'
import GameCommand from './GameCommand'
import GameSession from './GameSession'

export default class Game {
  ctx: Bot

  command: GameCommand

  constructor(ctx: Bot) {
    this.ctx = ctx
    this.command = new GameCommand(this.ctx, this)
  }

  get name() { return '' }

  get displayName() { return '' }

  get description() { return '' }

  get color() { return 0 }

  get playerRange() { return [0, 0] }

  get defaultConfig() { return {} }

  get helpEmbed() { return {} }

  get Session() {
    return GameSession
  }

  createSession(sessionInfo: SessionInfoBasic) {
    const db = this.ctx.getDB('games')
    const session = new this.Session(sessionInfo, this)
    db.set(`sessions.${sessionInfo.id}`, sessionInfo)
    this.ctx.gameSessions[sessionInfo.id] = session
  }
}
