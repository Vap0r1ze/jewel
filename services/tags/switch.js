let e = module.exports = {}
e.run = async function () {
  var args = []
  for (var arg of this.args) {
    args.push(arg)
  }
  let o = await this.process(args[0], this) || ''
  args.shift()
  let def = ''
  if (args.length % 2) def = args.pop()
  let cases = {}
  for (let i = 0; i < args.length; i += 2) cases[await this.process(args[i], this)] = args[i + 1]
  if (cases[o]) {
    return this.process(cases[o], this)
  } else {
    return this.process(def, this)
  }
}
