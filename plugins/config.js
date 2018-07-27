let e = module.exports = {}

const fs = require('fs')

e.init = function (Bot) {
  Bot.config = {}
  for (let config of Bot.util.getYAMLs('./config')) {
    Bot.config[config.name] = config.d
  }
}
