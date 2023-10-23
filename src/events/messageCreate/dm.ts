import { Message } from 'eris'
import { SessionInfoBasic } from '@/plugins/games'
import Bot from '@/services/Bot'

export default function dmEvent(this: Bot, msg: Message) {
  if (msg.channel.type !== 1 || msg.type !== 0 || msg.author.bot) return
  const db = this.getDB('games')
  const sessions: SessionInfoBasic = db.get('sessions') || {}
  Object.values(sessions).forEach(sessionInfo => {
    const session = this.gameSessions[sessionInfo.id]
    if (session?.gameState === 'INPROGRESS') {
      if (session.players.includes(msg.author.id)) {
        session.handleDM(msg)
      } else if (session.spectators.includes(msg.author.id)) {
        session.handleSpectatorDM(msg)
      }
    }
  })
}
