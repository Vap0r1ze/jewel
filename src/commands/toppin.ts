import { GuildTextableChannel, Message, TextableChannel } from 'eris'
import Command, { CommandArgs } from '../services/Command'
import type Bot from '@/services/Bot'

const channelPattern = /^<#(\d+)>$/
const messagePattern = /^https?:\/\/(?:ptb\.|canary\.)?discord\.com\/channels\/(\d+)\/(\d+)\/(\d+)$/

export default class TopPinCommand extends Command {
  get name() {
    return 'toppin'
  }

  get category() {
    return 'Admin'
  }

  get usage() {
    return '<message or channel>'
  }

  get examples() {
    return [
      'https://discord.com/channels/403696127708233728/757597121032618095/1130302202662092921',
      '<#757597121032618095>'
    ]
  }

  get description() {
    return 'Use a **channel** to toggle top-pinning for that channel\nUse a **message link** to set a channel\'s top-pinned message (this will enable top-pinning automatically)'
  }

  get aliases() {
    return ['pin']
  }

  async handle(msg: Message, args: CommandArgs) {
    if (msg.channel.type !== 0) return
    const { PREFIX } = process.env
    const db = this.ctx.getDB('toppins')

    if (!args[0]) return msg.channel.createMessage(`Please provide a message or channel (see \`${PREFIX}help pin\`)`)

    const channelMatch = args[0].match(channelPattern)
    const messageMatch = args[0].match(messagePattern)

    let [, guildId, channelId, messageId] = messageMatch ?? []
    if (channelMatch) [, channelId] = channelMatch

    if (!channelId) return msg.channel.createMessage(`Please provide a valid message or channel (see \`${PREFIX}help pin\`)`)

    const channel = msg.channel.guild.channels.get(channelId)

    if (!channel) return msg.channel.createMessage('That channel does not exist')
    if (channel.type !== 0) return msg.channel.createMessage('That is not a text channel')

    const botPerms = channel.permissionsOf(this.ctx.client.user.id)
    if (!botPerms.has('manageMessages'))
        return msg.channel.createMessage('I do not have permission to manage messages in that channel')
    if (!botPerms.has('viewChannel'))
        return msg.channel.createMessage('I do not have permission to view that channel')

    if (messageId) {
        const message = await channel.getMessage(messageId).catch(() => null)
        if (!message) return msg.channel.createMessage('I cannot see that message')
        db.set(channel.id, true)
        db.set(`${channel.id}:message`, message.id)
        await msg.channel.createMessage(`Top-pinning has been enabled for ${channel.mention} and set to message ${message.jumpLink}`)
    } else {
        const willEnable = !db.get(channel.id)
        db.set(channel.id, willEnable)
        let replyForToggle = `Top-pinning has been ${willEnable ? 'enabled' : 'disabled'} for ${channel.mention}`
        if (!db.get(`${channel.id}:message`) && willEnable) replyForToggle += '\n**Note:** There is no top-pinned message set for this channel yet so go ahead and set one'
        await msg.channel.createMessage(replyForToggle)
    }

    await doTopPinCheck(this.ctx, channel)
  }
}

export async function doTopPinCheck(ctx: Bot, channel: TextableChannel) {
    if (channel.type !== 0) return
    const db = ctx.getDB('toppins')
    const isDisabled = !db.get(channel.id)
    const topPinnedMessageId = db.get(`${channel.id}:message`)
    if (isDisabled || topPinnedMessageId) return

    const pins = await channel.getPins()
    if (pins[0].id === topPinnedMessageId) return

    const topPinnedMessage = await channel.getMessage(topPinnedMessageId)
    await topPinnedMessage.unpin()
    await topPinnedMessage.pin()
}
