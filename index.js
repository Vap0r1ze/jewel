// Config
require('dotenv').config()

// Modules
const EventEmitter = require('events')
const _ = require('async')
const chalk = require('chalk')
const getFiles = require('./util/getFiles.js')

// Bot Object
const Bot = new EventEmitter()

// Utils
Bot.util = {}
for (let util of getFiles('./util'))
  Bot.util[util.name] = util.e

// Plugins
let plugins = getFiles('./plugins')
Bot.plugins = []
function registerPlugin (plugin) {
  if (!Bot.plugins.includes(plugin.name)) {
    if (plugin.e.dependencies) {
      let depsRegistered = true
      for (let dep of plugin.e.dependencies) {
        if (!Bot.plugins.includes(dep)) {
          if (plugins.map(p => p.name).includes(dep))
            registerPlugin(plugins.find(p => p.name === dep))
          else
            Bot.util.logger.error('PLG', `Could not find plugin ${dep}`)
        }
        depsRegistered = depsRegistered && Bot.plugins.includes(dep)
      }
      if (depsRegistered) {
        Bot.util.logger.log('PLG', chalk`Registered plugin {cyan.bold ${plugin.name}}`)
        Bot.plugins.push(plugin.name)
      } else
        Bot.util.logger.warn('PLG', chalk`Could not register plugin {red.bold ${plugin.name}}, missing dependencies`)
    } else {
      Bot.plugins.push(plugin.name)
      Bot.util.logger.log('PLG', chalk`Registered plugin {cyan.bold ${plugin.name}}`)
    }
  }
}

plugins.forEach(registerPlugin)

function initializeFunction (next) {
  let name = Bot.plugins.shift()
  let plugin = plugins.find(p => p.name == name)
  if (plugin.e.init instanceof Function) {
    if (plugin.e.init.constructor === Function) {
      let res = plugin.e.init(Bot)
      if (res)
        throw res
      else {
        // Bot.util.logger.log('PLG', 'Initialized '
        // + chalk.cyan.bold(name))
        next()
      }
    } else {
      plugin.e.init(Bot).then(() => {
        // Bot.util.logger.log('PLG', 'Initialized '
        // + chalk.cyan.bold(name))
        next()
      }).catch(err => {
        throw err
      })
    }
  } else
    next()
}

_.waterfall(
  new Array(Bot.plugins.length)
    .fill(initializeFunction),
  function (err) {
    if (err)
      Bot.util.logger.error('PLG', err)
    else {
      delete Bot.plugins
      Bot.util.logger.log('BOT', 'Initialized')
      Bot.emit('init')
    }
  }
)
