import { Message } from 'eris'
import moment from 'moment'
import Command, { CommandArgs } from '../services/Command'

export type ReminderData = {
    userId: string;
    channelId: string;
    seconds: number;
    info: string;
}

export default class RemindCommand extends Command {
    get name() {
        return 'remind'
    }

    get description() {
        return 'set a reminder in seconds'
    }

    get isDeveloper() {
        return true
    }

    fulfillReminder({
        userId, channelId, seconds, info,
    }: ReminderData, isLate: 1 | 2) {
        const pretense = isLate
            ? 'Earlier'
            : `**${seconds}** seconds ago`
        let response = `<@${userId}> ${pretense}, you set a reminder: \`${info}\``
        const lateReason = [, 'serverStress', 'downtime'][isLate]
        if (isLate) { response += ` **(due to ${lateReason}, this reminder is late)**` }
        this.ctx.client.createMessage(channelId, response)
    }

    handle(msg: Message, args: CommandArgs) {
        const seconds = Math.abs(parseInt(args.shift() || '0', 10))
        const info = args.join(' ')
        const authorId = msg.author.id
        if (Number.isNaN(seconds) || !info) {
            msg.channel.createMessage('Format: <seconds> <info>')
            return
        }
        const date = moment().add(seconds, 'seconds')
        this.ctx.jobs.create(`reminder:${authorId}:${msg.id}`, date, 'commands.remind.fulfillReminder', {
            userId: authorId,
            channelId: msg.channel.id,
            seconds,
            info,
        })
        msg.channel.createMessage(`Ok! I will respond in ${seconds} seconds (${date.format('h:mm A')} EST).`)
    }
}
