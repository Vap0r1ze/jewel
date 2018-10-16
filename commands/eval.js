const Command = require('../services/Command')
const util = require('util')

class Eval extends Command {
  get name () {
    return 'eval'
  }
  get description () {
    return 'Evaluate JS code'
  }
  get developer () {
    return true
  }
  handle (msg, args) {
    let code = args.raw
    try {
      let output = eval(`${code}`)
      msg.channel.createMessage(`\`\`\`js\n${util.inspect(output)}\`\`\``).then(response => {
        if (output && typeof output.then == 'function') {
          output.then(value => {
            response.edit(`\`\`\`js\n${util.inspect(value)}\`\`\``)
          }).catch(err => {
            response.edit(`:no_entry_sign: __**Error**__\n\`\`\`\n${err}\`\`\``)
          })
        }
      })
    } catch (err) {
      if (err) {
        msg.channel.createMessage(`:no_entry_sign: __**Error**__\n\`\`\`\n${err}\`\`\``)
      }
    }
  }
}
module.exports = Eval
