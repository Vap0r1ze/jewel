const Command = require('../services/Command')
const moment = require('moment')

class Remind extends Command {
  get name () {
    return 'remind'
  }
  get description () {
    return 'set a reminder in seconds'
  }
  get isDeveloper () {
    return true
  }
  fulfillReminder ({ userId, channelId, seconds, info }, isLate) {
    const pretense = isLate
      ? 'Earlier'
      : `**${seconds}** seconds ago`
    let response = `<@${userId}> ${pretense}, you set a reminder: \`${info}\``
    const lateReason = [, 'serverStress', 'downtime'][isLate]
    if (isLate)
      response += ` **(due to ${lateReason}, this reminder is late)**`
    this.ctx.client.createMessage(channelId, response)
  }
  handle (msg, args) {
    const seconds = Math.abs(parseInt(args.shift()))
    const info = args.join(' ')
    const authorId = msg.author.id
    if (isNaN(seconds) || !info)
      return msg.channel.createMessage(`Format: <seconds> <info>`)
    const date = moment().add(seconds, 'seconds')
    this.ctx.jobs.create(`reminder:${authorId}:${msg.id}`, date, 'commands.remind.fulfillReminder', {
      userId: authorId,
      channelId: msg.channel.id,
      seconds,
      info
    })
    msg.channel.createMessage(`Ok! I will respond in ${seconds} seconds (${date.format('h:mm A')} EST).`)
  }
}
module.exports = Remind
