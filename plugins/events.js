const fs = require('fs')
const chalk = require('chalk')

exports.dependencies = ['eris']

exports.init = function () {
  const self = this
  if (!fs.existsSync('events'))
    fs.mkdirSync('events')
  const events = fs.readdirSync('events')
  const evtHandlers = this.evtHandlers = []
  for (const event of events) {
    const handlers = this.util.getFiles(`events/${event}`)
    evtHandlers.push(...handlers.map(h => ({ event, handler: h.exports })))
    if (handlers.length) {
      this.client.on(event, function () {
        self.evtHandlers.filter(h => h.event === event).forEach(h => {
          h.handler.apply(self, arguments)
        })
      })
    }
  }
  const e = evtHandlers.map(h => h.event).filter((e,i,a) => a.indexOf(e) === i).length
  this.util.logger.log('EVT', chalk`Listening to {green.bold ${e}} event${e===1?'':'s'}`
    + chalk` with {green.bold ${evtHandlers.length}} handler${evtHandlers.length===1?'':'s'}`)
}
