import { Message } from 'eris'
import moment from 'moment'
import transformText from '@/util/text'
import Command, { CommandArgs } from '../services/Command'

const bdayPattern = /(?:<@!?(\d{16,20})>|(\d{16,20}))? *(jan(?:uary)?|feb(?:r?uary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?) *,? *(\d+) *(?:th)?(?:,? *\d+)?|(\d+) *[ \-//] *(\d+)(?: *[ \-//] *(?:\d+))?/i

const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
const monthNamesFull = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
const monthDayCount = [1, -1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1].map(n => n + 30)

function nth(n: number) {
    if (n < 4 || n > 20) {
        if (n % 10 === 1) return 'st'
        if (n % 10 === 2) return 'nd'
        if (n % 10 === 3) return 'rd'
    }
    return 'th'
}

export default class BdayCommand extends Command {
    get name() {
        return 'birthday'
    }

    get category() {
        return 'Social'
    }

    get usage() {
        return '<date>'
    }

    get examples() {
        return [
            'January 26',
            '1/26/03',
            '29 2',
        ]
    }

    get description() {
        return 'Set your birthday'
    }

    get aliases() {
        return ['bday', 'birthdate']
    }

    handle(msg: Message, args: CommandArgs) {
        if (msg.channel.type !== 0) return
        const isDeveloper = process.env.DEVELOPERS.includes(msg.author.id)

        if (args.raw.trim().length === 0) {
            const profile = this.ctx.profiles.getProfile(msg.author.id)
            if (profile.birthday) {
                const [month, date] = profile.birthday
                const bdayDisplay = `${transformText(monthNamesFull[month], 'capitalize')} ${date}${nth(date)}`
                msg.channel.createMessage(`Your birthday is set as **${bdayDisplay}**`)
            } else {
                msg.channel.createMessage(`Your birthday has not been set yet, try \`${process.env.PREFIX}help birthday\` to see how to set yours`)
            }
            return
        }

        const match = bdayPattern.exec(args.raw.trim())
        let month: number
        let date: number
        if (!match) {
            msg.channel.createMessage(`I hope there isn't a place where that is a valid date, try \`${process.env.PREFIX}help birthday\` to see example usage.`)
            return
        }

        const idMatches = match.splice(1, 2)
        const selectedId = idMatches[0] || idMatches[1]
        if (selectedId && !isDeveloper) {
            msg.channel.createMessage('Only a developer can set another user\'s birthday.')
            return
        }

        const selectedMember = msg.channel.guild.members.get(selectedId)
        if (selectedId && !selectedMember) {
            msg.channel.createMessage('I wasn\'t able to find that member.')
            return
        }

        if (match[1] && match[2]) { // MMMM dd
            const [, monthName, dateStr] = match
            month = monthNames.indexOf(monthName.toLowerCase().slice(0, 3))
            date = +dateStr
        } else if (match[3] && match[4]) { // MM dd
            const [,,, firstStr, secondStr] = match
            const first = +firstStr
            const second = +secondStr

            // Check for ambiguous date
            if (first <= 12 && second <= 12) {
                msg.channel.createMessage('I\'m unable to tell whether this date day-month or month-day. Please write the name of the month instead.')
                return
            }

            // Check for impossible date
            if (first > 12 && second > 12) {
                msg.channel.createMessage(`This date seems impossible, try \`${process.env.PREFIX}help birthday\` to see example usage.`)
                return
            }

            if (first > second) {
                date = first
                month = second - 1
            } else {
                month = first - 1
                date = second
            }
        } else {
            // stuff
            return
        }

        // Check for impossible day-month combo
        if (monthDayCount[month] < date) {
            msg.channel.createMessage(`This date seems impossible, try \`${process.env.PREFIX}help birthday\` to see example usage.`)
            return
        }

        const profile = this.ctx.profiles.getProfile(selectedId || msg.author.id)
        const oldBday = profile.birthday
        profile.setBirthday([month, date])

        if (!profile.bdayMoment) {
            profile.setBirthday(oldBday)
            msg.channel.createMessage('Something has gone wrong and your birthday could not be set')
            return
        }

        // 30 days in advance check
        if (!isDeveloper && profile.bdayMoment.diff(Date.now(), 'months') < 1) {
            profile.setBirthday(oldBday)
            msg.channel.createMessage('You must set your birthday a month in advance (this is in order to prevent abuse). If your birthday is within a month, DM or ping `@vap0r1ze` and ask for your birthday to be set.')
            return
        }

        // 6 months after role check
        if (!isDeveloper && moment().diff(moment(profile.birthdayLastUsed), 'months') < 6) {
            profile.setBirthday(oldBday)
            msg.channel.createMessage('You\'re not able to change your birthday within 6 months of receiving the birthday role (this is in order to prevent abuse). If you have a good reason to do this, DM `Vap0r1ze#0126` and ask him to set your birthday.')
            return
        }

        const bdayDisplay = `${transformText(monthNamesFull[month], 'capitalize')} ${date}${nth(date)}`
        msg.channel.createMessage(`✅  |  ${
            !selectedMember || selectedMember.id === msg.author.id
                ? 'Your'
                : `**${selectedMember.username}**'s`
        } birthday has been set to **${bdayDisplay}**`)
        profile.initBirthday(true)
    }
}
