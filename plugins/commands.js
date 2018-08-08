let e = module.exports = {}

const fs = require('fs')

e.dependencies = ['discordjs']

e.init = function (Bot) {
  if (!fs.existsSync('commands'))
    fs.mkdirSync('commands')
  Bot.client.on('message', msg => {
    if (msg.content.startsWith(process.env.PREFIX)) {
      if (!msg.channel.guild) return
      if (msg.author.bot) return
      let args = msg.content
        .replace(process.env.PREFIX, '')
        .split(/\s+/)
        .filter(Boolean)
      let command = args.shift().toLowerCase()
      if (!/[\w\-]/.test(command)) return
      if (fs.existsSync(`commands/${command}.js`)) {
        let cmd = require(`../commands/${command}.js`)
        if (cmd.database && !Bot.db.connection) return
        Bot.util.logger.cmd(command, msg.author)
        try {
          if (e.checkperms(cmd.perms, msg.author)) {
            cmd.run.bind(Bot)(msg, args)
          } else {
            msg.channel.send(`You must be a **${cmd.perms}** to do this!`)
          }
        } catch (err) {
          Bot.util.logger.error('CMD', err)
        }
      }
    }
  })
}

e.checkperms = function (title, member) {
  switch (title) {
    case 'Developer':
      return process.env.DEVELOPERS.includes(member.id)
    default:
      return true
  }
}
