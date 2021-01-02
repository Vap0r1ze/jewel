/* eslint-disable import/first */
require('module-alias/register')
require('dotenv').config()
require('source-map-support').install()

import Bot from './services/Bot'

const bot = new Bot()

bot.once('init', () => {
  bot.logger.log('BOT', 'Initialized')
})
