let e = module.exports = {}
e.run = async function () {
  var args = []
  for (var arg of this.args) {
    args.push(await this.process(arg, this))
  }
  let dir = args[0]
  let t = args[1] || ''
  let n = args[2] || 0
  let a = args[3] || ''
  if (['left', 'l'].includes(dir)) {
    return a.repeat(n - t.length) + t
  } else if (['right', 'r'].includes(dir)) {
    return t + a.repeat(n - t.length)
  } else return '`Invalid direction`'
}
