import { Message } from 'eris'
import Bot from './Bot'

export type CommandArgs = (string | undefined)[] & { raw: string }

export default class Command {
  ctx: Bot

  constructor(ctx: Bot) {
    this.ctx = ctx
    this.init()
  }

  msg(msg: Message, args: CommandArgs) {
    if (this.isDeveloper && !process.env.DEVELOPERS.includes(msg.author.id)) return
    if (!process.env.CHANNEL_WHITELIST.includes(msg.channel.id)) return
    this.handle(msg, args)
  }

  get name() { return '' }

  get category() { return 'Misc' }

  get usage() { return '' }

  get description() { return '' }

  get aliases(): string[] { return [] }

  get isDeveloper() { return false }

  get isHidden() { return false }

  get isSilent() { return false }

  get permissions(): string[] { return [] }

  get botPermissions(): string[] { return [] }

  init() {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handle(msg: Message, args: CommandArgs) {}

  meColor(msg: Message) {
    const { channel } = msg
    if (channel.type !== 0) return 0
    const meMember = channel.guild.members.get(this.ctx.client.user.id)
    if (!meMember) return 0
    const meRoles = meMember.roles.map(r => channel.guild.roles.get(r)).reverse()
    const meColor = (meRoles.find(r => r?.color) || { color: 0 }).color
    return meColor
  }
}
