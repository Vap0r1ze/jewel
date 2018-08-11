let e = module.exports = {}
e.run = async function () {
  var args = []
  for (var arg of this.args) {
    args.push(await this.process(arg, this))
  }
  let c = args[0] || ''
  let n = Math.abs(parseInt(args[1])) || 1
  let r = ''
  for (let i = 0; i < n; i++) r += c[Math.floor(Math.random() * c.length)]
  return r
}
