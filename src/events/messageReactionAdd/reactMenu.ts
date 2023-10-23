import { Emoji, Member, Message } from 'eris'
import Bot from '@/services/Bot'
import accessObjPath from '@/util/accessObjPath'
import logger from '@/util/logger'

export default function reactMenuAdd(
    this: Bot,
    message: Message,
    { name: emojiName, id: emojiId }: Emoji,
    user: Member | { id: string },
) {
    if (user.id === this.client.user.id) return
    const menuInfo = this.menus.store[message.id]
    if (menuInfo) {
        Object.entries(menuInfo.emojis).forEach(([choiceId, emoji]) => {
            if (emoji === (emojiId ? `${emojiName}:${emojiId}` : emojiName)) {
                const handler = accessObjPath(this, menuInfo.handlerPath, true)
                try {
                    if (typeof handler === 'function') handler(choiceId, user.id, false)
                } catch (error) {
                    logger.error(`MENU:${menuInfo.handlerPath}:${choiceId}`, error as Error)
                }
            }
        })
    }
}
