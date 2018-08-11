let e = module.exports = {}
e.run = async function () {
  var args = []
  for (var arg of this.args) {
    args.push(await this.process(arg, this))
  }
  var depth = parseInt(args[0]) || 0
  return await this.db.hgetAsync(`tags:${this.msg.id}:loops`, depth.toString()) || ''
}
