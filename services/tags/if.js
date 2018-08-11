let e = module.exports = {}
e.run = async function () {
  var args = []
  for (var i = 0; i < 3; i++) {
    args.push(await this.process(this.args[i], this))
  }
  let comp = args[0]
  let a = args[1] || ''
  let b = args[2] || ''
  let bool
  switch (comp) {
    case '==': {
      bool = a === b
      break
    }
    case '!=': {
      bool = a !== b
      break
    }
    case '>': {
      bool = +a > +b
      break
    }
    case '<': {
      bool = +a < +b
      break
    }
    case '>=': {
      bool = +a >= +b
      break
    }
    case '<=': {
      bool = +a <= +b
      break
    }
    case '||': {
      bool = +a || +b
      break
    }
    case '&&': {
      bool = +a && +b
      break
    }
    default: {
      return '`Invalid Operator`'
    }
  }
  if (bool) {
    return await this.process(this.args[3], this) // eslint-disable-line
  } else {
    return await this.process(this.args[4], this) // eslint-disable-line
  }
}
