import fs from 'fs'
import chalk from 'chalk'
import { resolve } from 'path'
import EvalCommand from '@/commands/eval'
import Bot from '@/services/Bot'
import GamesCommand from '@/commands/games'
import GitHubCommand from '@/commands/gh'
import HelpCommand from '@/commands/help'
import PingCommand from '@/commands/ping'
import RemindCommand from '@/commands/remind'
import Command, { CommandArgs } from '@/services/Command'
import BdayCommand from '@/commands/birthday'
// import BdaysCommand from '@/commands/birthdays'
import logger from '@/util/logger'
import { Priority } from './msgq'

export interface Commands {
  [name: string]: Command;
}

export default function registerCommands(this: Bot) {
  const cmdsPath = resolve(__dirname, '../commands')
  if (!fs.existsSync(cmdsPath)) { fs.mkdirSync(cmdsPath) }
  const commands: Commands = {
    // birthdays: new BdaysCommand(this),
    birthday: new BdayCommand(this),
    eval: new EvalCommand(this),
    games: new GamesCommand(this),
    github: new GitHubCommand(this),
    help: new HelpCommand(this),
    ping: new PingCommand(this),
    remind: new RemindCommand(this),
  }
  this.msgq.registerConsumer('commands', Priority.Commands, (msg, next) => {
    if (msg.channel.type !== 0 || msg.author.bot) {
      next()
      return
    }
    if (msg.content.startsWith(process.env.PREFIX)) {
      const argsRaw = msg.content
        .replace(process.env.PREFIX, '')
      const args: CommandArgs = Object.assign(argsRaw.split(/ +/), { raw: '' })
      let commandName = args.shift()
      if (!commandName) {
        next()
        return
      }
      args.raw = argsRaw.replace(commandName, '').replace(/^ ?/, '')
      commandName = commandName.toLowerCase()
      const command = (Object.values(commands) as ValueOf<Commands>[])
        .find(cmd => cmd.name === commandName || cmd.aliases.includes(commandName || ''))
      if (command) {
        try {
          command.msg(msg, args)
        } catch (err) {
          logger.error(`CMD:${command.name}`, err)
        }
        if (!command.isSilent) { logger.cmd(msg.content, msg) }
      }
    }
  })
  logger.log('CMD', chalk`Listening to commands with prefix {magenta.bold ${process.env.PREFIX}}`)
  return commands
}
