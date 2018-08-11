let e = module.exports = {}
e.run = async function () {
  var args = []
  for (var arg of this.args) {
    args.push(await this.process(arg, this))
  }
  var n = parseFloat(args[0])
  var dp = parseInt(args[1]) || 0
  if (dp < 0) dp = 0
  return n.toFixed(dp)
}
