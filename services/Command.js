class Command {
  constructor (ctx) {
    this.ctx = ctx
    this.init()
  }
  msg (msg, args) {
    if (this.isDeveloper && !process.env.DEVELOPERS.includes(msg.author.id)) return
    if (!process.env.CHANNEL_WHITELIST.includes(msg.channel.id)) return
    this.handle(msg, args)
  }
  get name () {}
  get category () { return 'Misc' }
  get usage () { return '' }
  get description () { return '' }
  get aliases () { return [] }
  get isDeveloper () { return false }
  get isHidden () { return false }
  get isSilent () { return false }
  get permissions () { return [] }
  get botPermissions () { return [] }
  init () {}
  handle () {}

  meColor (msg) {
    const meMember = msg.channel.guild.members.get(this.ctx.client.user.id)
    const meRoles = meMember.roles.map(r => msg.channel.guild.roles.get(r)).reverse()
    const meColor = (meRoles.find(r => r.color) || {color:0}).color
    return meColor
  }
}
module.exports = Command
