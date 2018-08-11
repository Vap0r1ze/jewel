let e = module.exports = {}
const request = require('superagent')
e.run = async function () {
  var args = []
  for (var arg of this.args) {
    args.push(await this.process(arg, this))
  }
  let q = args[0] || ''
  let n = parseInt(args[1]) || 5
  let o = parseInt(args[2]) || 0
  let s = args[3] || ' '
  if (n < 1) n = 1
  if (n > 10) n = 10
  let getEmojis = new Promise(resolve => {
    request.get('https://emoji.getdango.com/api/emoji')
      .query({ q })
      .end((err, res) => {
        if (err) this.logger.error(`Error getting emojis: ${err}`)
        else resolve(res.body.results.map(({text}) => text))
      })
  })
  return (await getEmojis).slice(o, -10 + n + o).join(s)
}
