let e = module.exports = {}

let Discord = require('discord.js')
let chalk = require('chalk')

e.init = function (Bot) {
  let token = process.env.BOT_TOKEN
  let client = Bot.client = new Discord.Client()
  Bot.on('init', () => {
    client.login(token)
  })
  Bot.client.on('ready', () => {
    let s
    Bot.util.logger.log('DJS', chalk`Logged in as {cyan.bold ${client.user.username}#${client.user.discriminator}}`)
    s = client.guilds.size
    Bot.util.logger.log('DJS', chalk`Currently in {green.bold ${s}} guild${s?'s':''}`)
    s = client.channels.size
    Bot.util.logger.log('DJS', chalk`Currently in {green.bold ${s}} channel${s?'s':''}`)
  })
}
