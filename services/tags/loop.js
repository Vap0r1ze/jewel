let e = module.exports = {}
e.run = async function () {
  var args = []
  for (var arg of this.args) {
    args.push(arg)
  }
  var from = parseInt(await this.process(args[0] || '', this)) || 0
  var to = parseInt(await this.process(args[1] || '', this))
  var loop = args[2] || ''
  var sep = await this.process(args[3] || '', this)

  if (isNaN(to)) to = 0
  if (to < from) return 'Invalid number pair'
  if (to - from > 100) return 'Range too large (over 100)'

  var depth = parseInt(await this.db.hgetAsync(`tags:${this.msg.id}:loops`, 'depth')) || 0
  if (depth > 3) return 'Loop too deep (depth > 3)'

  await this.db.hincrbyAsync(`tags:${this.msg.id}:loops`, 'depth', 1)
  var result = []
  for (var i = from; i < to + 1; i++) {
    await this.db.hsetAsync(`tags:${this.msg.id}:loops`, depth.toString(), i)
    var loopResult = await this.process(loop, this)
    result.push(loopResult)
  }
  await this.db.hdelAsync(`tags:${this.msg.id}:loops`, depth.toString())
  await this.db.hincrbyAsync(`tags:${this.msg.id}:loops`, 'depth', -1)
  if (!depth) await this.db.hdelAsync(`tags:${this.msg.id}:loops`, 'depth')
  return result.join(sep)
}
