/* eslint-disable import/first */
require('module-alias/register')
require('dotenv').config()
require('source-map-support').install()

import * as Sentry from '@sentry/node'
import * as Tracing from '@sentry/tracing'
import Bot from './services/Bot'

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
  })
}
const bot = new Bot()
const initTxn = Sentry.startTransaction({
  op: 'init',
  name: 'Bot Initialization',
})

bot.once('init', () => {
  bot.logger.log('BOT', 'Initialized')
  initTxn.finish()
})
