import 'dotenv/config'
import Bot from './services/Bot'
import logger from './util/logger'

const bot = new Bot()

bot.once('init', () => {
  logger.log('BOT', 'Initialized')
})
