import { Message } from 'eris'
import Bot from '@/services/Bot'

export default function selfPinEvent(this: Bot, msg: Message) {
  if (msg.channel.type !== 0 || msg.type !== 6 || msg.author.id !== this.client.user.id) return
  msg.delete().catch(() => null)
}
