import fs from 'fs'
import { resolve } from 'path'
import chalk from 'chalk'
import Bot from '@/services/Bot'
import dmEvent from '@/events/messageCreate/dm'
import recordScrobble from '@/events/presenceUpdate/scrobbles'
import reactMenuRemove from '@/events/messageReactionRemove/reactMenu'
import reactMenuAdd from '@/events/messageReactionAdd/reactMenu'
import welcome from '@/events/guildMemberAdd/welcome'

export interface EventHandler {
  event: string;
  handler: (this: Bot, ...args: any) => void;
}

export default function registerEventHandlers(this: Bot) {
  const eventsPath = resolve(__dirname, '../events')
  if (!fs.existsSync(eventsPath)) { fs.mkdirSync(eventsPath) }
  const events = fs.readdirSync(eventsPath)
  const evtHandlers: EventHandler[] = [
    { event: 'guildMemberAdd', handler: welcome },
    { event: 'messageCreate', handler: dmEvent },
    { event: 'messageReactionAdd', handler: reactMenuAdd },
    { event: 'messageReactionRemove', handler: reactMenuRemove },
    { event: 'presenceUpdate', handler: recordScrobble },
  ]
  events.forEach(event => {
    if (evtHandlers.length) {
      this.client.on(event, (...args) => {
        evtHandlers.filter(h => h.event === event).forEach(h => {
          h.handler.apply(this, args)
        })
      })
    }
  })
  const e = evtHandlers.map(h => h.event).filter((o, i, a) => a.indexOf(o) === i).length
  this.logger.log('EVT', chalk`Listening to {green.bold ${e.toString()}} event${e === 1 ? '' : 's'}`
    + chalk` with {green.bold ${evtHandlers.length.toString()}} handler${evtHandlers.length === 1 ? '' : 's'}`)
  return evtHandlers
}
