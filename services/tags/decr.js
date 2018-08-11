let e = module.exports = {}
e.run = async function () {
  var args = []
  for (var arg of this.args) {
    args.push(await this.process(arg, this))
  }
  var n = parseFloat(args[0]) || 0
  var decr = parseInt(args[1])
  if (isNaN(decr)) decr = 1
  return n - decr
}
