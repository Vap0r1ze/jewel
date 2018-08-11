let e = module.exports = {}
e.run = async function () {
  var args = []
  for (var arg of this.args) {
    args.push(await this.process(arg, this))
  }
  let name = args[0]
  let value = args[1] || ''
  if (!name) return '`Invalid variable name`'
  let tagAuthor = await this.db.hgetAsync(`tags:${this.tag}:properties:${this.msg.channel.guild.id}`, 'author')
  if (this.tag === 'test') tagAuthor = this.msg.author.id
  if (value) {
    await this.db.hsetAsync(`tags:${tagAuthor}:vars:${this.msg.channel.guild.id}`, name, value)
  } else {
    await this.db.hdelAsync(`tags:${tagAuthor}:vars:${this.msg.channel.guild.id}`, name)
  }
  return ''
}
