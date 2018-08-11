let e = module.exports = {}
e.run = async function () {
  var args = []
  for (var arg of this.args) {
    args.push(await this.process(arg, this))
  }
  var string = args[0]
  var search = args[1]
  return string.lastIndexOf(search)
}
