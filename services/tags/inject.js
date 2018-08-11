let e = module.exports = {}
e.run = async function () {
  var args = []
  for (var arg of this.args) {
    args.push(await this.process(arg, this))
  }
  var code = args[0] || ''
  var i = await this.db.hgetAsync('tags:inject', this.msg.id)
  if (i) return 'Cannot stack inject'
  await this.db.hincrbyAsync('tags:inject', this.msg.id, 1)
  var p = await this.process(code, this)
  await this.db.hdelAsync('tags:inject', this.msg.id)
  return p
}
