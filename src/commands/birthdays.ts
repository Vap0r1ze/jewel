import Profile from '@/services/Profile'
import { Message } from 'eris'
import moment from 'moment'
import Command from '../services/Command'

const AMOUNT = 5

export default class BdaysCommand extends Command {
  get name() {
    return 'upcomingbdays'
  }

  get category() {
    return 'Social'
  }

  get description() {
    return `See the next ${AMOUNT} birthdays`
  }

  get aliases() {
    return ['upcomingbirthdays', 'birthdays', 'bdays']
  }

  get permissions() {
    return ['ADMIN']
  }

  handle(msg: Message) {
    if (msg.channel.type !== 0) return

    const profiles = Object.values(this.ctx.profiles.store) as Profile[]
    const bdayProfiles = profiles.filter(p => p.birthday != null)
      .sort((a, b) => {
        const getScore = (p: Profile) => {
          if (!p.birthday) return Infinity
          const date = moment(`${(p.birthday[0] + 1)}/${p.birthday[1]}/${new Date().getFullYear()}`)
          if (date.diff(Date.now(), 'days') < 0) {
            date.add(1, 'year')
          }
          return date.diff(Date.now(), 'days')
        }
        return getScore(a) - getScore(b)
      })

    const bdayMap: Dict<Profile[]> = {}

    for (let i = 0; i < AMOUNT; i++) {
      const profile = bdayProfiles[i]
      if (!profile.birthday) continue

      const date = moment(`${(profile.birthday[0] + 1)}/${profile.birthday[1]}`)
      const dateStr = `${date.format('MMM')} ${date.format('D').padStart(2, ' ')}`

      if (!profile) break
    }

    const dates = Object.keys(bdayMap)
    if (!dates.length) {
      msg.channel.createMessage('There are no profiles with upcoming birthdays')
    } else {
      const lines: string[] = []
      for (const [date, profiles] of Object.entries(bdayMap)) {
        if (!profiles) continue
        const profileDisplays = []

        for (const p of profiles) {
          if (msg.channel.permissionsOf(p.id).has('readMessages')) {
            const member = msg.channel.guild.members.get(p.id)
            profileDisplays.push(`\`${member?.username}#${member?.discriminator}\``)
          } else {
            profileDisplays.push(`<@${p.id}>`)
          }
        }

        lines.push(`**\`${date}\`** \\▫️ ${profileDisplays.join(', ')}`)
      }
      msg.channel.createMessage(lines.join('\n'))
    }
  }
}
