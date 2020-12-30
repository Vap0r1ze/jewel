module.exports = function (msg) {
  if (msg.channel.type !== 1 || msg.type !== 0 || msg.author.bot) return
  const db = this.getDB('games')
  const sessions = db.get('sessions') || {}
  for (const sessionInfo of Object.values(sessions)) {
    const session = this.gameSessions[sessionInfo.id]
    if (session && session.gameState === 'INPROGRESS') {
      if (session.players.includes(msg.author.id)) {
        session.handleDM(msg)
      } else if (session.spectators.includes(msg.author.id)) {
        session.handleSpectatorDM(msg)
      }
    }
  }
}
