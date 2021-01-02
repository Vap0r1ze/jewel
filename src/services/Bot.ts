import { EventEmitter } from 'events'
// Util
import accessObjPath from '@/util/accessObjPath'
import logger from '@/util/logger'
import transformText from '@/util/text'
// Plugins
import createApi from '@/plugins/api'
import createClient from '@/plugins/eris'
import getDB from '@/plugins/db'
import createJobManager from '@/plugins/jobs'
import registerCommands from '@/plugins/commands'
import initDummyCmds from '@/plugins/dummyCmds'
import registerEventHandlers from '@/plugins/events'
import createMenuManager from '@/plugins/reactMenu'
import registerGames from '@/plugins/games'
import initScrobbles from '@/plugins/scrobbles'
import { createMsgqManager } from '@/plugins/msgq'

export default class Bot extends EventEmitter {
  logger = logger

  accessObjPath = accessObjPath

  transformText = transformText

  api = createApi.call(this)

  client = createClient.call(this)

  getDB = getDB

  msgq = createMsgqManager.call(this)

  jobs = createJobManager.call(this)

  commands = registerCommands.call(this)

  evtHandlers = registerEventHandlers.call(this)

  menus = createMenuManager.call(this)

  games: Dict<import('@/services/Game').default>

  gameSessions: Dict<import('@/services/GameSession').default>

  constructor() {
    super()

    initDummyCmds.call(this)
    initScrobbles.call(this)

    const { games, gameSessions } = registerGames.call(this)
    this.games = games
    this.gameSessions = gameSessions

    setImmediate(() => {
      this.emit('init')
    })
  }
}
