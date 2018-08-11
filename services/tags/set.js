let e = module.exports = {}
e.run = async function () {
  var args = []
  for (var arg of this.args) {
    args.push(await this.process(arg, this))
  }
  let name = args[0]
  let value = args[1] || ''
  if (!name) return '`Invalid variable name`'
  if (value) {
    await this.db.hsetAsync(`tags:${this.tag}:vars:${this.msg.channel.guild.id}`, name, value)
  } else {
    await this.db.hdelAsync(`tags:${this.tag}:vars:${this.msg.channel.guild.id}`, name)
  }
  return ''
}
