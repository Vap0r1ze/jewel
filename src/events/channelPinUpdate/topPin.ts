import { doTopPinCheck } from '@/commands/toppin'
import Bot from '@/services/Bot'
import { TextableChannel } from 'eris'

export default function topPin(this: Bot, channel: TextableChannel) {
    if (channel.type === 0) doTopPinCheck(this, channel)
}
