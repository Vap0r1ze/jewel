class Command {
  constructor (ctx) {
    Object.assign(this, ctx)
    if (!this.name)
      throw new Error('Command does not have a name')
    this.init()
  }
  msg (msg, args) {
    if (this.developer && !process.env.DEVELOPERS.includes(msg.author.id)) return
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
