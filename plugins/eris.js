let e = module.exports = {}

let Eris = require('eris')
let chalk = require('chalk')

e.init = function () {
  let token = process.env.BOT_TOKEN
  let client = this.client = new Eris(token)
  this.on('init', () => {
    client.connect()
  })
  this.client.on('ready', () => {
    let g = client.guilds.size
    this.util.logger.log('ERIS', chalk`Logged in as {cyan.bold ${client.user.username}#${client.user.discriminator}}`)
    this.util.logger.log('ERIS', chalk`Currently in {green.bold ${g}} guild${g===1?'':'s'}`)
  })
}
