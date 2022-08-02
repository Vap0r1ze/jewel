/* eslint-disable import/prefer-default-export */
import { Message, PossiblyUncachedTextableChannel, TextableChannel } from 'eris'

export function isMessageCached(
  msg: Message<PossiblyUncachedTextableChannel>,
): msg is Message<TextableChannel> {
  return 'name' in msg.channel
}
