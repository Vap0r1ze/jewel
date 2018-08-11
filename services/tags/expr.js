const Parser = require('expr-eval').Parser

let e = module.exports = {}
e.run = async function () {
  var args = []
  for (var arg of this.args) {
    args.push(await this.process(arg, this))
  }
  let expr = args[0] || ''
  let res = ''
  try {
    res = Parser.evaluate(expr)
  } catch (err) {
    res = err
  }
  return res instanceof Error
    ? 'ERROR ' + res.message
    : res
}
