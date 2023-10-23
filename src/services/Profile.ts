import schedule from 'node-schedule'
import { table } from 'quick.db'
import moment from 'moment'
import { format } from 'util'
import { ProfileData } from '@/plugins/profiles'
import Bot from './Bot'

const bdayRoles: string[] = JSON.parse(process.env.BDAY_ROLES)
const bdayMessages: string[] = JSON.parse(process.env.BDAY_MESSAGES)

export default class Profile implements ProfileData {
    ctx: Bot

    db: table

    bdayJobs: [schedule.Job, schedule.Job] | null

    id: ProfileData['id']

    birthday: ProfileData['birthday']

    birthdayLastUsed: ProfileData['birthdayLastUsed']

    constructor(ctx: Bot, data: ProfileData) {
        this.ctx = ctx
        this.db = ctx.getDB('profiles')
        this.bdayJobs = null
        this.id = data.id
        this.birthday = data.birthday
        this.birthdayLastUsed = data.birthdayLastUsed

        this.initBirthday()
    }

    // Internals
    saveData(): ProfileData {
        const data = {
            id: this.id,
            birthday: this.birthday,
            birthdayLastUsed: this.birthdayLastUsed,
        }
        this.db.set(this.id, data)
        return data
    }

    // Initializers
    initBirthday(forceEnd = false) {
        if (this.bdayJobs) {
            this.bdayJobs[0].cancel()
            this.bdayJobs[1].cancel()
            this.bdayJobs = null
        }
        if (!this.birthday) {
            if (forceEnd) this.onBirthdayEnd()
            return
        }

        const isToday = moment().startOf('day').diff(this.bdayMoment) === 0
        const startRule = `0 0 ${this.birthday[1]} ${this.birthday[0] + 1} *`
        const endRule = `59 23 ${this.birthday[1]} ${this.birthday[0] + 1} *`

        const startJob = schedule.scheduleJob(startRule, this.onBirthdayStart.bind(this))
        const endJob = schedule.scheduleJob(endRule, this.onBirthdayEnd.bind(this))
        this.bdayJobs = [startJob, endJob]

        if (isToday) {
            this.onBirthdayStart()
        } else if (forceEnd) {
            this.onBirthdayEnd()
        }
    }

    // Hooks
    async onBirthdayStart() {
        const guild = this.ctx.client.guilds.get(process.env.BDAY_GUILD)
        if (!guild) return
        const [member] = await guild.fetchMembers({ userIDs: [this.id] })
        if (!member) return
        if (bdayRoles.every(id => member.roles.includes(id))) return

        const missingRoles = bdayRoles.filter(id => !member.roles.includes(id))

        await member.edit({ roles: [...member.roles, ...missingRoles] })

        const channel = guild.channels.get(process.env.BDAY_CHANNEL)
        if (channel && channel.type === 0) {
            const bdayMsg = bdayMessages[Math.floor(Math.random() * bdayMessages.length)]
            await channel.createMessage(bdayMsg.replace('{USER}', member.mention))
        }

        this.birthdayLastUsed = Date.now()
        this.saveData()
    }

    async onBirthdayEnd() {
        const guild = this.ctx.client.guilds.get(process.env.BDAY_GUILD)
        if (!guild) return

        const memberSearch = await guild.fetchMembers({ userIDs: [this.id] })
        if (typeof memberSearch[Symbol.iterator] !== 'function') {
            throw new TypeError(format('%O is not iterable', memberSearch))
        }
        const [member] = memberSearch
        if (!member) return

        if (!bdayRoles.every(id => member.roles.includes(id))) return

        const nonBdayRoles = member.roles.filter(id => !bdayRoles.includes(id))

        await member.edit({ roles: nonBdayRoles })
    }

    // Setters
    setBirthday(birthday: ProfileData['birthday']) {
        this.birthday = birthday

        this.saveData()
    }

    // Getters
    get bdayMoment(): moment.Moment | null {
        if (this.birthday) {
            const monthStr = (this.birthday[0] + 1).toString().padStart(2, '0')
            const dateStr = this.birthday[1].toString().padStart(2, '0')
            const thisYear = new Date().getFullYear()

            const dateNoYear = `${monthStr}-${dateStr}`
            let bdayMoment = moment(`${thisYear}-${dateNoYear}`)

            if (!bdayMoment.isValid() && dateNoYear === '02-29') {
                bdayMoment = moment(`${thisYear}-03-01`)
            }

            if (bdayMoment.isBefore(moment().startOf('day'))) {
                bdayMoment = moment(`${thisYear + 1}-${dateNoYear}`)
            }

            return bdayMoment
        }
        return null
    }
}
