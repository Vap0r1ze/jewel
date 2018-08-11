let e = module.exports = {}
e.run = async function () {
  var args = []
  for (var arg of this.args) {
    args.push(await this.process(arg, this))
  }
  let index = parseInt(args[0])
  if (isNaN(index) || index < -1) index = -1
  var tvars = Object.keys((await this.db.hgetallAsync(`tags:${this.tag}:vars:${this.msg.channel.guild.id}`)) || {})
  if (tvars.length > 7000) return `\`MAX amount of VARS for ${this.tag} reached.\``
  var tvar = tvars[index] || ''
  if (index < 0) tvar = tvars.length
  return tvar
}
