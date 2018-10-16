// Config
require('dotenv').config()

// Modules
const EventEmitter = require('events')
const { waterfall } = require('async')
const chalk = require('chalk')
const getFiles = require('./util/getFiles.js')
global.Promise = require('bluebird')

// Bot Object
const Bot = new EventEmitter()

// Utils
Bot.util = {}
for (let util of getFiles('./util'))
  Bot.util[util.name] = util.exports

// Plugins
let plugins = getFiles('./plugins')
Bot.plugins = []
function registerPlugin (plugin) {
  if (!Bot.plugins.includes(plugin.name)) {
    if (plugin.exports.dependencies) {
      let depsRegistered = true
      for (let dep of plugin.exports.dependencies) {
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
  if (plugin.exports.init instanceof Function) {
      let res = plugin.exports.init.apply(Bot)
      if (res && res.constructor.name === 'Promise') {
        res.then(() => {
          next()
        }).catch(err => {
          throw err
        })
      } else
        next()
  } else
    next()
}

waterfall(
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
