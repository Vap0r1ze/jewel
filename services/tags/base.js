let e = module.exports = {}
e.run = async function () {
  var args = []
  for (var arg of this.args) {
    args.push(await this.process(arg, this))
  }
  let i = args[0]
  let fr = +args[1]
  let tr = +args[2]
  if (tr < 1 || fr < 1 || isNaN(tr) || isNaN(fr) || tr > 36 || fr > 36) return '`Invalid Radix`'
  return parseInt(i, fr).toString(tr)
}
