const chalk = require('chalk')
const dummyCmds = require('../services/data/dummyCmds.json5')
const Command = require('../services/Command')

exports.dependencies = ['commands']

exports.init = function () {
  let i = 0
  for (const [ category, cmdDict ] of Object.entries(dummyCmds)) {
    for (const [ cmdName, cmdInfo ] of Object.entries(cmdDict)) {
      this.commands[cmdName] = new DummyCommand(cmdName, category, cmdInfo)
      i++
    }
  }
  this.util.logger.log('DMY', chalk`Registered {green.bold ${i}} dummy commands`)
}

class DummyCommand extends Command {
  constructor (name, category, info) {
    super()
    this.dummyName = name
    this.dummyCategory = category
    this.dummyInfo = info
  }
  get category () {
    return this.dummyCategory
  }
  get name () {
    return this.dummyName
  }
  get description () {
    return this.dummyInfo.description || ''
  }
  get usage () {
    return this.dummyInfo.usage || ''
  }
  get isSilent () {
    return true
  }
}
