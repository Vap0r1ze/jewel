import { queue } from 'async'
import chalk from 'chalk-template'
import Bot from '@/services/Bot'
import logger from '@/util/logger'

export interface MenuInfo {
    channelId: string;
    messageId: string;
    emojis: Dict<string> | string[];
    handlerPath: string;
}
export interface MenuManager {
    create: (info: MenuInfo) => void;
    delete: (messageId: string, channelId?: string) => void;
    store: Dict<MenuInfo>;
}

export default function createMenuManager(this: Bot) {
    const db = this.getDB('menus')
    const menus: MenuManager = {
        store: {},
        create: ({
            channelId, messageId, emojis, handlerPath,
        }: MenuInfo) => {
            const menuInfo = {
                channelId, messageId, emojis, handlerPath,
            }
            menus.store[messageId] = menuInfo
            const q = queue((emoji: string, next) => {
                this.client.addMessageReaction(channelId, messageId, emoji).then(() => {
                    next()
                })
            })
            const emojiJobs = Object.values(emojis)
            q.push(emojiJobs.map(v => v || ''), () => {
                db.set(messageId, menuInfo)
            })
        },
        delete: (messageId: string, channelId?: string) => {
            if (!messageId) return
            delete menus.store[messageId]
            db.delete(messageId)
            if (channelId) { this.client.removeMessageReactions(channelId, messageId).catch(() => {}) }
        },
    }

    db.all().forEach(({ ID: menuId, data }) => {
        const menuInfo = JSON.parse(data)
        menus.store[menuId] = menuInfo
    })

    const m = Object.keys(menus).length
    logger.log('MENU', chalk`Loaded {green.bold ${m.toString()}} react menu${m === 1 ? '' : 's'} from storage`)
    return menus
}
