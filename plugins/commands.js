const fs = require('fs')
const chalk = require('chalk')

exports.dependencies = ['eris', 'sqlite']

exports.init = function () {
  if (!fs.existsSync('commands'))
    fs.mkdirSync('commands')
  let commands = this.commands = []
  for (let file of this.util.getFiles('commands')) {
    let command = new file.exports(this)
    commands.push(command)
  }
  this.client.on('messageCreate', msg => {
    if (!msg.channel.guild || msg.author.bot) return
    let guild = this.db.guilds.get(msg.channel.guild.id)
    let prefix
    if (msg.content.startsWith(guild.prefix))
      prefix = guild.prefix
    else if (msg.content.startsWith(process.env.PREFIX))
      prefix = process.env.PREFIX
    if (prefix) {
      let argsRaw = msg.content
        .replace(prefix, '')
      let args = argsRaw
        .split(/ +/)
      let commandName = args.shift()
      args.raw = argsRaw.replace(commandName, '').replace(/^ ?/, '')
      if (!commandName) return
      commandName = commandName.toLowerCase()
      let command = commands.find(cmd => cmd.name === commandName || cmd.aliases.includes(commandName))
      if (command) {
        try {
          let result = command.msg(msg, args)
          if (result instanceof Promise) {
            result.catch(err => {
              this.util.logger.error(command.name, err)
            })
          }
        } catch (err) {
          this.util.logger.error(command.name, err)
        }
        this.util.logger.cmd(args.raw, msg)
      }
    }
  })
  this.util.logger.log('CMD', chalk`Listening to commands with prefix {magenta.bold ${process.env.PREFIX}}`)
}
