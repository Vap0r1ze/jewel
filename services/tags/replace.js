let e = module.exports = {}
e.run = async function () {
  var args = []
  for (var arg of this.args) {
    args.push(await this.process(arg, this))
  }
  let t = args[0] || ''
  let from = args[1] || ''
  let to = args[2] || ''
  return t.replace(from, to)
}
