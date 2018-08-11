let e = module.exports = {}
e.run = async function () {
  var args = []
  for (var arg of this.args) {
    args.push(await this.process(arg, this))
  }
  let t = args[0] || ''
  let start = +args[1] || 0
  let end = +args[2] || t.length
  return t.substr(start, end)
}
