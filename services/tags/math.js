let e = module.exports = {}
e.run = async function () {
  var args = []
  for (var arg of this.args) {
    args.push(await this.process(arg, this))
  }
  let oper = args[0]
  let nums = args.slice(1).map(ns => parseFloat(ns))
  let response
  if (oper === '+') response = nums.reduce((a, b) => a + b)
  else if (oper === '-') response = nums.reduce((a, b) => a - b)
  else if (oper === '/') response = nums.reduce((a, b) => a / b)
  else if (oper === '*') response = nums.reduce((a, b) => a * b)
  else if (oper === '%') response = nums.reduce((a, b) => a % b)
  else if (oper === '^') response = nums.reduce((a, b) => Math.pow(a, b))
  else if (oper === 'sqrt') response = nums.reduce((a, b) => Math.sqrt(a) + Math.sqrt(b), 0)
  else if (oper === 'cbrt') response = nums.reduce((a, b) => Math.cbrt(a) + Math.cbrt(b), 0)
  else response = '`Invalid operator`'
  return response
}
