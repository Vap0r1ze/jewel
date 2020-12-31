import Bot from '@/services/Bot'
import { Emoji, Message } from 'eris'

export default function reactMenuRemove(
  this: Bot,
  message: Message,
  { name: emojiName, id: emojiId }: Emoji,
  userId: string,
) {
  if (userId === this.client.user.id) return
  const menuInfo = this.menus.store[message.id]
  if (menuInfo) {
    Object.entries(menuInfo.emojis).forEach(([choiceId, emoji]) => {
      if (emoji === (emojiId ? `${emojiName}:${emojiId}` : emojiName)) {
        const handler = this.accessObjPath(this, menuInfo.handlerPath, true)
        try {
          if (typeof handler === 'function') handler(choiceId, userId, true)
        } catch (error) {
          this.logger.error(`MENU:${menuInfo.handlerPath}:${choiceId}`, error)
        }
      }
    })
  }
}
