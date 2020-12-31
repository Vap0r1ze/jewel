/* eslint-disable import/first */
require('module-alias/register')
require('dotenv').config()

import Bot from './services/Bot'

const bot = new Bot()
