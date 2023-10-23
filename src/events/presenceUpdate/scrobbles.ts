import { Member, Relationship } from 'eris'
import Bot from '@/services/Bot'

export default function recordScrobble(this: Bot, member: Member | Relationship) {
  if (member instanceof Relationship) return
  let scrobbleMember = member
  if (scrobbleMember.guild.id !== process.env.SCROBBLE_GUILD) {
    const scrobbleGuild = this.client.guilds.get(process.env.SCROBBLE_GUILD)
    if (!scrobbleGuild) return
    const scrobbleGuildMember = scrobbleGuild.members.get(member.id)
    if (!scrobbleGuildMember) return
    scrobbleMember = scrobbleGuildMember
  }
  if (!scrobbleMember.roles.some(r => process.env.SCROBBLE_ROLES.includes(r))) return

  const db = this.getDB('scrobbles')
  if (!member.activities) return
  const spotifyActivity = member.activities.find(a => a.type === 2 && a.name === 'Spotify' && (a.flags || 0) & 16)
  const { scrobbles } = db.get(member.id) || { user: {}, scrobbles: [] }

  if (scrobbles.length === 0 && !spotifyActivity) return
  if (spotifyActivity) {
    if (scrobbles.length > 0) {
      if (spotifyActivity.sync_id === scrobbles[0].id) scrobbles[0].endTime = null
      else scrobbles[0].endTime = Date.now()
    }
    if (scrobbles.length === 0 || scrobbles[0].endTime != null) {
      scrobbles.unshift({
        id: spotifyActivity.sync_id,
        startTime: Date.now(),
        endTime: null,
      })
    }
  } else if (scrobbles.length > 0) {
    if (scrobbles[0].endTime != null) return
    scrobbles[0].endTime = Date.now()
  }
  const data = {
    user: {
      id: member.id,
      username: member.user.username,
      discriminator: member.user.discriminator,
      avatar: member.user.avatar,
    },
    scrobbles,
  }
  db.set(member.id, data)
}
