let e = module.exports = {}
e.run = async function () {
  var args = []
  for (var arg of this.args) {
    args.push(await this.process(arg, this))
  }
  let regexRegex = /^\/?(.*?)(?:\/([gim]+)?)?$/
  let t = args[0] || ''
  let from = args[1] || '/^[.\\n]$/'
  let to = args[2] || ''
  let parsedR = regexRegex.exec(from)
  try {
    from = new RegExp(parsedR[1], parsedR[2])
    return t.replace(from, to)
  } catch (err) {
    return '`Invalid regular expression`'
  }
}
