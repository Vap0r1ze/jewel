const fs = require('fs')
const { resolve } = require('path')
const chalk = require('chalk')

exports.dependencies = ['eris']

exports.init = function () {
  const self = this
  const eventsPath = resolve(__dirname, '../events')
  if (!fs.existsSync(eventsPath))
    fs.mkdirSync(eventsPath)
  const events = fs.readdirSync(eventsPath)
  const evtHandlers = this.evtHandlers = []
  for (const event of events) {
    const handlers = this.util.getFiles(resolve(__dirname, `../events/${event}`))
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
