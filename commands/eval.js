let e = module.exports = {}

const util = require('util')

e.desc = 'Evaluate JS code'
e.perms = 'Developer'

e.run = async function (msg, args) {
  let code = msg.content.split(' ').splice(1).join(' ')
  let embed = {
    fields: []
  }
  if (!code) {
    msg.reply('ERROR: **NO CODE TO EVAL**')
    return
  }
  try {
    let output = eval(`${code}`)
    embed.title = 'Eval'
    embed.fields.push({
      name: ':inbox_tray: Input',
      value: `\`\`\`js\n ${code}\`\`\``
    }, {
      name: `:outbox_tray: Output (${typeof output})`,
      value: `\`\`\`js\n ${util.inspect(output)}\`\`\``
    })
    embed.color = 0x43b581
    msg.channel.createMessage({ embed }).then(response => {
      if (output && typeof output.then == 'function') {
        output.then(value => {
          Object.assign(embed, { fields: [{
            name: `:gem: Resolved (${typeof value})`,
            value: `\`\`\`js\n${util.inspect(value)}\`\`\``
          }] })
          response.edit({ embed })
        }).catch(err => {
          Object.assign(embed, {
            color: 0xf04747,
            fields: [{
              name: `:no_entry_sign: ${err.constructor.name}`,
              value: `\`\`\`\n${err}\`\`\``
            }]
          })
          response.edit({ embed })
        })
      }
    })
  } catch (err) {
    if (err) {
      embed.title = 'Eval Error'
      embed.fields = [{
        name: ':inbox_tray: Input',
        value: `\`\`\`js\n${code}\`\`\``
      }, {
        name: ':outbox_tray: Error',
        value: `\`\`\`\n${err}\`\`\``
      }]
      embed.color = 0xf04747
      msg.channel.createMessage({ embed })
    }
  }
}
