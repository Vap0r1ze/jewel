let e = module.exports = {}
e.run = async function () {
  var args = []
  for (var arg of this.args) {
    args.push(await this.process(arg, this))
  }
  var name = args[0] || ''
  args.shift()
  var exists = await this.db.existsAsync(`tags:${name}:properties:${this.msg.channel.guild.id}`)
  if (!exists) return 'Tag does not exist'

  if (name === this.tag) return 'You cannot execute this tag in itself'
  await this.db.hincrbyAsync(`tags:${this.msg.id}:exec`, name, 1)
  if ((await this.db.hgetAsync(`tags:${this.msg.id}:exec`, name)) > 50) return 'This tag has appeared in the trace too many times (50)'

  var content = await this.db.hgetAsync(`tags:${name}:properties:${this.msg.channel.guild.id}`, 'content')
  return await this.process(content, Object.assign({}, this, { tag: name, margs: args })) // eslint-disable-line
}
