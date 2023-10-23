import { Guild, Member } from 'eris'
import Bot from '@/services/Bot'
import welcome from '../guildMemberAdd/welcome'

const welcomeRoles: string[] = JSON.parse(process.env.WELCOME_ROLES)

export default function welcomeRole(this: Bot, guild: Guild, member: Member, oldMember?: Member) {
  const guildWelcomeRoles = welcomeRoles.filter(id => guild.roles.has(id))
  if (!oldMember) return
  const roleDelta = member.roles.filter(id => !oldMember.roles.includes(id))
  if (guildWelcomeRoles.some(id => roleDelta.includes(id))) {
    welcome.call(this, guild, member)
  }
}
