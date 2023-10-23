import { TextableChannel } from 'eris'
import TopPinCommand from '@/commands/toppin'
import Bot from '@/services/Bot'

export default function topPin(this: Bot, channel: TextableChannel) {
    if (channel.type === 0) TopPinCommand.prototype.doTopPinCheck.call(this, channel)
}
