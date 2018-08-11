let e = module.exports = {}
e.run = async function () {
  var args = []
  for (var arg of this.args) {
    args.push(await this.process(arg, this))
  }
  let r = parseInt(args[1])
  if (isNaN(r)) r = 1
  return ' '.repeat(r)
}
