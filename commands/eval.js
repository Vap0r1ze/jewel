let e = module.exports = {}
let Discord = require('discord.js')

let request = require('superagent')
let util = require('util')

e.run = async function (msg, args) {
  let Bot = this
  let code = msg.content.split(' ').splice(1).join(' ')
  let embed = new Discord.RichEmbed()
  if (!code) {
    msg.reply('ERROR: **NO CODE TO EVAL**')
    return
  }
  try {
    let output = eval(`${code}`)
    embed.setTitle('Eval')
    embed.addField(':inbox_tray: Input', `\`\`\`js\n ${code}\`\`\``, false)
    embed.addField(`:outbox_tray: Output (${typeof output})`, `\`\`\`js\n ${util.inspect(output)}\`\`\``, false)
    embed.setColor(0x43b581)
    msg.channel.send({ embed: embed }).then(response => {
      if (output && typeof output.then == 'function') {
        output.then(value => {
          Object.assign(embed.fields[1], {
            name: `:gem: Resolved (${typeof value})`,
            value: `\`\`\`js\n${util.inspect(value)}\`\`\``
          })
          response.edit(embed)
        }).catch(err => {
          // err
        })
      } else if (output && typeof output.run == 'function') {
        output.run(Bot.db.  connection, (err, value) => {
          if (err) {
            Object.assign(embed.fields[1], {
              name: `:floppy_disk: Error (${typeof value})`,
              value: `\`\`\`\n${value}\`\`\``
            })
          } else {
            Object.assign(embed.fields[1], {
              name: `:floppy_disk: Data retrieved (${typeof value})`,
              value: `\`\`\`js\n ${util.inspect(value)}\`\`\``
            })
          }
          response.edit(embed)
        })
      }
    })
  } catch (err) {
    if (err) {
      embed.setTitle('Eval Error')
      if (!(embed.fields || []).length)
        embed.addField(':inbox_tray: Input', `\`\`\`js\n${code}\`\`\``, false)
      embed.addField(':outbox_tray: Error', `\`\`\`\n${err}\`\`\``, false)
      embed.setColor(0xf04747)
      msg.channel.send({ embed: embed })
    }
  }
}

e.name = 'eval'
e.desc = 'Evaluate JS code'
e.perms = 'Developer'
