let e = module.exports = {}

let Eris = require('eris')
let chalk = require('chalk')

e.init = function (Bot) {
  let token = process.env.BOT_TOKEN
  let client = Bot.client = new Eris(token)
  Bot.on('init', () => {
    client.connect()
  })
  Bot.client.on('ready', () => {
    let g = client.guilds.size
    Bot.util.logger.log('ERIS', chalk`Logged in as {cyan.bold ${client.user.username}#${client.user.discriminator}}`)
    Bot.util.logger.log('ERIS', chalk`Currently in {green.bold ${g}} guild${g===1?'':'s'}`)
  })
}
