import chalk from 'chalk'
import dateFormat from 'dateformat'
import { Message } from 'eris'
import * as Sentry from '@sentry/node'

export default {
  format: '[hh:MM:ss TT]',
  get time(): string {
    return dateFormat(new Date(), this.format)
  },
  warn(title: string, desc: string): void {
    console.log(chalk`${this.time} {bgYellow.white.bold  ${title.toUpperCase()} } ${desc}`)
  },
  error(title: string, error: Error | string): void {
    Sentry.captureException(error, scope => scope.setTag('title', title))
    console.log(chalk`${this.time} {bgRed.white.bold  ${title.toUpperCase()} } ${(error instanceof Error) ? (error.stack || error.message) : error}`)
  },
  log(title: string, desc: string): void {
    console.log(chalk`${this.time} {bgGreen.white.bold  ${title.toUpperCase()} } ${desc}`)
  },
  cmd(cmd: string, msg: Message): void {
    if (msg.channel.type === 0) {
      console.log(chalk`${this.time} {bgGreen.white.bold  CMD } {cyan.bold ${msg.channel.guild.name}} ({green.bold ${msg.channel.guild.id}})`
        + chalk` > {cyan.bold ${msg.author.username}} ({green.bold ${msg.author.id}}): ${cmd}`)
    } else {
      console.log(chalk`${this.time} {bgGreen.white.bold  CMD } {cyan.bold ${msg.author.username}} ({green.bold ${msg.author.id}}): ${cmd}`)
    }
  },
}
