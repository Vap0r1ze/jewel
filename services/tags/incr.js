let e = module.exports = {}
e.run = async function () {
  var args = []
  for (var arg of this.args) {
    args.push(await this.process(arg, this))
  }
  var n = parseFloat(args[0]) || 0
  var incr = parseInt(args[1])
  if (isNaN(incr)) incr = 1
  return n + incr
}
