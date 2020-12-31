import Eris from 'eris'
import chalk from 'chalk'
import Bot from '@/services/Bot'

export default function createClient(this: Bot) {
  const token = process.env.BOT_TOKEN
  const client = new Eris.Client(token)
  this.on('init', () => {
    client.connect()
  })
  client.on('ready', () => {
    const g = client.guilds.size
    this.logger.log('ERIS', chalk`Logged in as {cyan.bold ${client.user.username}#${client.user.discriminator}}`)
    this.logger.log('ERIS', chalk`Currently in {green.bold ${g.toString()}} guild${g === 1 ? '' : 's'}`)
  })
  return client
}
