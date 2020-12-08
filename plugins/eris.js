const Eris = require('eris')
const chalk = require('chalk')

exports.init = function () {
  const token = process.env.BOT_TOKEN
  const client = this.client = new Eris(token)
  this.on('init', () => {
    client.connect()
  })
  this.client.on('ready', () => {
    const g = client.guilds.size
    this.util.logger.log('ERIS', chalk`Logged in as {cyan.bold ${client.user.username}#${client.user.discriminator}}`)
    this.util.logger.log('ERIS', chalk`Currently in {green.bold ${g}} guild${g===1?'':'s'}`)
  })
}
