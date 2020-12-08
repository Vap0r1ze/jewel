const chalk = require('chalk')

exports.dependencies = ['events', 'commands']

exports.init = function () {
  const db = this.getDB('games')

  const games = this.games = {}
  for (const file of this.util.getFiles('games')) {
    const game = new file.exports(this)
    games[game.name] = game
    this.commands[game.command.name] = game.command
  }

  const gameSessions = this.gameSessions = {}
  const sessions = db.get('sessions') || {}
  for (const sessionInfo of Object.values(sessions)) {
    const game = games[sessionInfo.gameName]
    game.createSession(sessionInfo)
  }

  const g = Object.values(games).length
  const s = Object.values(gameSessions).length
  this.util.logger.log('GAME', chalk`Registered {green.bold ${g}} game${g===1?'':'s'},`
    + chalk` and loaded {green.bold ${s}} session${s===1?'':'s'} from storage`)
}
