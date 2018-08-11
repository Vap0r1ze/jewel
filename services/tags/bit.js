let e = module.exports = {}
e.run = async function () {
  var args = []
  for (var arg of this.args) {
    args.push(await this.process(arg, this))
  }
  let oper = args[0]
  let n1 = +args[1]
  let n2 = +args[2]
  if (isNaN(n1)) return '`Invalid number (arg 1)`'
  if (oper === '!') return +!n1
  if (oper === '~') return ~n1
  if (isNaN(n2)) return '`Invalid number (arg 2)`'
  if (oper === '&') return n1 & n2
  if (oper === '^') return n1 ^ n2
  if (oper === '|') return n1 | n2
  if (oper === '>>') return n1 >> n2
  if (oper === '>>>') return n1 >>> n2
  if (oper === '<<') return n1 << n2
  return '`Invalid operator`'
}
