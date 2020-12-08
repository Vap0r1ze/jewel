module.exports = function (msg) {
  if (msg.channel.type !== 1 || msg.author.bot) return
  const db = this.getDB('games')
  const sessions = db.get('sessions') || {}
  for (const sessionInfo of Object.values(sessions)) {
    if (sessionInfo.players.includes(msg.author.id)) {
      const session = this.gameSessions[sessionInfo.id]
      if (session.gameState === 'INPROGRESS')
        session.handleDM(msg)
    }
  }
}
