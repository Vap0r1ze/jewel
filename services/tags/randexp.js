const RandExp = require('randexp')

let e = module.exports = {}
e.run = async function () {
  var args = []
  for (var arg of this.args) {
    args.push(await this.process(arg, this))
  }
  let pat = args[0] || ''
  let flags = args[1] || ''
  let res
  try {
    res = new RandExp(pat, flags).gen()
  } catch (err) {
    res = err
  }
  return res instanceof Error
    ? 'ERROR ' + res.message
    : res
}
