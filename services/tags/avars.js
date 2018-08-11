let e = module.exports = {}
e.run = async function () {
  var args = []
  for (var arg of this.args) {
    args.push(await this.process(arg, this))
  }
  let index = parseInt(args[0])
  if (isNaN(index) || index < -1) index = -1

  let tagAuthor = await this.db.hgetAsync(`tags:${this.tag}:properties:${this.msg.channel.guild.id}`, 'author')
  if (this.tag === 'test') tagAuthor = this.msg.author.id
  var avars = Object.keys((await this.db.hgetallAsync(`tags:${tagAuthor}:vars:${this.msg.channel.guild.id}`)) || {})
  var avar = avars[index] || ''

  if (index < 0) avar = avars.length
  return avar
}
