import { everyLimit } from 'async'
import { Message } from 'eris'
import Bot from '@/services/Bot'
import logger from '@/util/logger'
import { isMessageCached } from '@/util/typeCheck'

export const enum Priority {
    Commands,
}

export type MessageConsumerHandler = ((
    msg: Message,
    next: () => void
) => Promise<void> | void)
| ((msg: Message) => Promise<void> | void)
export interface Consumer {
    id: string;
    priority: Priority;
    handler: MessageConsumerHandler;
}

const consumers = Symbol('consumers')

export function createMsgqManager(this: Bot) {
    const msgqManager = {
        [consumers]: [] as Consumer[],
        registerConsumer(
            id: string,
            priority: Priority,
            handler: MessageConsumerHandler,
        ) {
            const index = msgqManager[consumers].findIndex(c => c.priority > priority)
            const consumer = { id, priority, handler }
            if (index > -1) msgqManager[consumers].splice(index, 0, consumer)
            else msgqManager[consumers].push({ id, priority, handler })
        },
        deleteConsumer(id: string) {
            const index = msgqManager[consumers].findIndex(c => c.id === id)
            if (index > -1) {
                msgqManager[consumers].splice(index, 1)
                return true
            }
            return false
        },
    }

    this.client.on('messageCreate', msg => {
        if (!isMessageCached(msg)) return
        everyLimit(msgqManager[consumers], 1, async (consumer, callback) => {
            await consumer.handler(msg, () => {
                callback(null, true)
            })
        }, error => {
            if (error) {
                logger.error('MSGQ', error)
            }
        })
    })

    return msgqManager
}
