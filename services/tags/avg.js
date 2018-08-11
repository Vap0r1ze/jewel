let e = module.exports = {}
e.run = async function () {
  var args = []
  for (var arg of this.args) {
    args.push(await this.process(arg, this))
  }
  return args.map(n => parseFloat(n, 10)).reduce((a, b) => a + b, 0) / args.length
}
