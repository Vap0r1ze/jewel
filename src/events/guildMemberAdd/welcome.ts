import Bot from '@/services/Bot'
import { Guild, Member } from 'eris'

const welcomeChannels: string[] = JSON.parse(process.env.WELCOME_CHANNELS)

export default function welcome(this: Bot, guild: Guild, member: Member) {
  const channelId = welcomeChannels.find(id => guild.channels.has(id))
  if (!channelId) return
  const channel = guild.channels.get(channelId)
  if (channel?.type !== 0) return
  channel.createMessage({
    content: process.env.WELCOME_MESSAGE
      .replace(/\{user\}/gi, `<@${member.id}>`),
    embed: {
      color: 0x2F3136,
      description: process.env.WELCOME_EMBED,
    },
  })
}
