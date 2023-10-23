import { EventEmitter } from 'events'
// Plugins
import createClient from '@/plugins/eris'
import getDB from '@/plugins/db'
import createJobManager from '@/plugins/jobs'
import registerCommands from '@/plugins/commands'
import registerEventHandlers from '@/plugins/events'
import createMenuManager from '@/plugins/reactMenu'
import registerGames from '@/plugins/games'
import { createMsgqManager } from '@/plugins/msgq'
import createProfileManager from '@/plugins/profiles'

export default class Bot extends EventEmitter {
  client = createClient.call(this)

  getDB = getDB

  msgq = createMsgqManager.call(this)

  jobs = createJobManager.call(this)

  profiles = createProfileManager.call(this)

  commands = registerCommands.call(this)

  evtHandlers = registerEventHandlers.call(this)

  menus = createMenuManager.call(this)

  games: Dict<import('@/services/Game').default>

  gameSessions: Dict<import('@/services/GameSession').default>

  constructor() {
    super()

    const { games, gameSessions } = registerGames.call(this)
    this.games = games
    this.gameSessions = gameSessions

    setImmediate(() => {
      this.emit('init')
    })
  }
}
