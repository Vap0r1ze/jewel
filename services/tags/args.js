let e = module.exports = {}
e.run = async function () {
  var args = []
  for (var arg of this.args) {
    args.push(await this.process(arg, this))
  }
  let start = parseInt(args[0]) || 0
  let end = parseInt(args[1]) || this.margs.length
  if (!args[1] && args[0]) end = start + 1
  return this.margs.slice(start, end).join(' ')
}
