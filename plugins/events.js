const fs = require('fs')
const chalk = require('chalk')

exports.dependencies = ['eris']

exports.init = function () {
  if (!fs.existsSync('events'))
    fs.mkdirSync('events')
  let events = fs.readdirSync('events')
  let h = 0
  for (let event of events) {
    let handlers = Bot.util.getFiles(`events/${event}`)
    h += handlers.length
    this.on(event, function (...args) {
      handlers.forEach(h => {
        h.exports(...args)
      })
    })
  }
  let e = events.length
  this.util.logger.log('EVT', chalk`Listening to {green.bold ${e}} event${e===1?'':'s'}`
    + chalk` with {green.bold ${h}} handler${h===1?'':'s'}`)
}
