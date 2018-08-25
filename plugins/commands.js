let e = module.exports = {}

const fs = require('fs')
const chalk = require('chalk')

e.dependencies = ['eris']

e.init = function (Bot) {
  if (!fs.existsSync('commands'))
    fs.mkdirSync('commands')
  let commands = Bot.util.getFiles('commands')
  Bot.client.on('messageCreate', msg => {
    if (msg.content.startsWith(process.env.PREFIX)) {
      if (!msg.channel.guild || msg.author.bot) return
      let args = msg.content
        .replace(process.env.PREFIX, '')
        .split(/ +/)
        .filter(Boolean)
      let command = (args.shift() || '').toLowerCase()
      if (!/^[\w\-]+$/.test(command)) return
      let cmd = commands.find(cmd => [].concat(cmd.name, cmd.e.aliases || []).includes(command))
      if (!cmd) return
      cmd = cmd.e
      if (cmd.database && !Bot.db) return
      Bot.util.logger.cmd(`${command} ${args.join(' ')}`, msg.author)
      try {
        let permCheck = e.checkperms(cmd.perms, msg.member, cmd)
        if (permCheck === true) {
          let r = cmd.run.bind(Bot)(msg, args)
          if (r instanceof Promise)
            r.catch(err => {
              Bot.util.logger.error(command.toUpperCase(), err)
            })
        } else {
          msg.channel.send(`You must ${permCheck} to do this!`)
        }
      } catch (err) {
        Bot.util.logger.error('CMD', err)
      }
    }
  })
  Bot.util.logger.log('CMD', chalk`Listening to commands with prefix {magenta.bold ${process.env.PREFIX}}`)
}

e.checkperms = function (title, member, cmd) {
  switch (title) {
    case 'Developer':
      return process.env.DEVELOPERS.includes(member.id) || 'be a Developer'
    case 'Role':
      return member.roles.some(r => {
        return member.guild.roles.get(r).name === cmd.role
      }) || `have the \`${cmd.role}\` role`
    default:
      return true
  }
}
