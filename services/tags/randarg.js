let e = module.exports = {}
e.run = async function () {
  return this.margs[Math.floor(Math.random() * this.margs.length)] || ''
}
