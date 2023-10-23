import chalk from 'chalk-template'
import CAHGame from '@/games/cah/game'
import UnoGame from '@/games/uno/game'
import Bot from '@/services/Bot'
import Game from '@/services/Game'
import GameSession from '@/services/GameSession'
import logger from '@/util/logger'

export interface SessionInfo<GameConfig, GameData> {
  id: string;
  createdAt: number;
  isOpen: boolean;
  poolMsgId: string;
  poolChannelId: string;
  gameName: string;
  gameState: 'PREGAME' | 'INPROGRESS' | 'PAUSED' | 'POSTGAME';
  gameConfig: GameConfig;
  host: string;
  players: string[];
  spectators: string[];
  data: GameData;
}
export type SessionInfoBasic = SessionInfo<Record<string, unknown>, Record<string, unknown>>

export default function registerGames(this: Bot) {
  const db = this.getDB('games')

  const games: Dict<Game> = {
    uno: new UnoGame(this),
    cah: new CAHGame(this),
  }
  Object.values(games).forEach(game => {
    if (!game) return
    this.commands[game.command.name] = game.command
  })

  const gameSessions: Dict<GameSession> = {}
  const sessions: Dict<SessionInfoBasic> = db.get('sessions') || {}
  setTimeout(() => {
    // game.createSession will fail trying to access bot.gameSessions
    Object.values(sessions).forEach(sessionInfo => {
      if (!sessionInfo) return
      const game = games[sessionInfo.gameName]
      if (!game) return
      game.createSession(sessionInfo)
    })
  }, 0)

  const g = Object.values(games).length
  const s = Object.values(gameSessions).length
  logger.log('GAME', chalk`Registered {green.bold ${g.toString()}} game${g === 1 ? '' : 's'},`
    + chalk` and loaded {green.bold ${s.toString()}} session${s === 1 ? '' : 's'} from storage`)

  return { games, gameSessions }
}
