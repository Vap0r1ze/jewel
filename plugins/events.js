let e = module.exports = {}

const fs = require('fs')
const chalk = require('chalk')

e.dependencies = ['eris']

e.init = function (Bot) {
  if (!fs.existsSync('events'))
    fs.mkdirSync('events')
  let events = fs.readdirSync('events')
  let h = 0
  for (let event of events) {
    let handlers = Bot.util.getFiles(`events/${event}`)
    h += handlers.length
    Bot.on(event, function (...args) {
      handlers.forEach(h => {
        h(...args)
      })
    })
  }
  let e = events.length
  Bot.util.logger.log('EVT', chalk`Listening to {green.bold ${e}} event${e===1?'':'s'}`
    + chalk` with {green.bold ${h}} handler${h===1?'':'s'}`)
}
