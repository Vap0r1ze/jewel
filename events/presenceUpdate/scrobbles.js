module.exports = function test (member) {
  if (!member.roles.includes('423946566819250177') && member.id !== '454072114492866560') return

  const db = this.getDB('scrobbles')
  const spotifyActivity = member.activities.find(a => a.type === 2 && a.name === 'Spotify' && a.flags & 16)
  const { scrobbles } = db.get(member.id) || { user: {}, scrobbles: [] }

  if (scrobbles.length === 0 && !spotifyActivity) return
  if (spotifyActivity) {
    if (scrobbles.length > 0) {
      if (spotifyActivity.sync_id === scrobbles[0].id)
        scrobbles[0].endTime = null
      else
        scrobbles[0].endTime = Date.now()
    }
    if (scrobbles.length === 0 || scrobbles[0].endTime != null) {
      scrobbles.unshift({
        id: spotifyActivity.sync_id,
        startTime: Date.now(),
        endTime: null
      })
    }
  } else if (scrobbles.length > 0) {
    if (scrobbles[0].endTime != null) return
    else scrobbles[0].endTime = Date.now()
  }
  const data = {
    user: {
      id: member.id,
      username: member.user.username,
      discriminator: member.user.discriminator,
      avatar: member.user.avatar
    },
    scrobbles
  }
  db.set(member.id, data)
}
