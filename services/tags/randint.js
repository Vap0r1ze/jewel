let e = module.exports = {}
e.run = async function () {
  var args = []
  for (var arg of this.args) {
    args.push(await this.process(arg, this))
  }
  let min = parseInt(args[0]) || 0
  let max = parseInt(args[1]) || 9
  return Math.floor(Math.random() * (max - min + 1)) + min
}
