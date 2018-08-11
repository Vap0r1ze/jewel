let e = module.exports = {}
e.run = async function () {
  var args = []
  for (var arg of this.args) {
    args.push(await this.process(arg, this))
  }
  let t = args[0] || ''
  return t.split('').sort(() => 0.5 - Math.random()).join('')
}
