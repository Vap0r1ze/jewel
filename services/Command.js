class Command {
  constructor (ctx) {
    this.ctx = ctx
    this.init()
  }
  msg (msg, args) {
    if (this.developer && !process.env.DEVELOPERS.includes(msg.author.id)) return
    if (!process.env.CHANNEL_WHITELIST.includes(msg.channel.id)) return
    this.handle(msg, args)
  }
  get name () {}
  get description () {}
  get aliases () {
    return []
  }
  get developer () {
    return false
  }
  get permissions () {
    return []
  }
  get botPermissions () {
    return []
  }
  init () {}
  handle () {}
}
module.exports = Command
