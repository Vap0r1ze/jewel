const fs = require('fs')
const chalk = require('chalk')

exports.dependencies = ['eris', 'db', 'jobs']

exports.init = function () {
  if (!fs.existsSync('commands'))
    fs.mkdirSync('commands')
  const commands = this.commands = {}
  for (const file of this.util.getFiles('commands')) {
    const command = new file.exports(this)
    commands[command.name] = command
  }
  this.client.on('messageCreate', msg => {
    if (!msg.channel.guild || msg.author.bot) return
    if (msg.content.startsWith(process.env.PREFIX)) {
      const argsRaw = msg.content
        .replace(process.env.PREFIX, '')
      const args = argsRaw
        .split(/ +/)
      let commandName = args.shift()
      args.raw = argsRaw.replace(commandName, '').replace(/^ ?/, '')
      if (!commandName) return
      commandName = commandName.toLowerCase()
      const command = Object.values(commands).find(cmd => cmd.name === commandName || cmd.aliases.includes(commandName))
      if (command) {
        try {
          let result = command.msg(msg, args)
          if (result instanceof Promise) {
            result.catch(err => {
              this.util.logger.error(`CMD:${command.name}`, err)
            })
          }
        } catch (err) {
          this.util.logger.error(`CMD:${command.name}`, err)
        }
        this.util.logger.cmd(msg.content, msg)
      }
    }
  })
  this.util.logger.log('CMD', chalk`Listening to commands with prefix {magenta.bold ${process.env.PREFIX}}`)
}
