import chalk from 'chalk'
import Bot from '@/services/Bot'
import logger from '@/util/logger'
import dummyCmds from '../services/data/dummyCmds'
import Command from '../services/Command'

interface DummyInfo {
  description: string;
  usage?: string;
}

export class DummyCommand extends Command {
  dummyName: string

  dummyCategory: string

  dummyInfo: DummyInfo

  constructor(ctx: Bot, name: string, category: string, info: DummyInfo) {
    super(ctx)
    this.dummyName = name
    this.dummyCategory = category
    this.dummyInfo = info
  }

  get category() {
    return this.dummyCategory
  }

  get name() {
    return this.dummyName
  }

  get description() {
    return this.dummyInfo.description || ''
  }

  get usage() {
    return this.dummyInfo.usage || ''
  }

  get isSilent() {
    return true
  }
}

export default function initDummyCmds(this: Bot) {
  let i = 0
  Array.from(Object.entries(dummyCmds)).forEach(([category, cmdDict]) => {
    Array.from(Object.entries(cmdDict)).forEach(([cmdName, cmdInfo]) => {
      this.commands[cmdName] = new DummyCommand(this, cmdName, category, cmdInfo)
      i += 1
    })
  })
  logger.log('DMY', chalk`Registered {green.bold ${i.toString()}} dummy commands`)
}
