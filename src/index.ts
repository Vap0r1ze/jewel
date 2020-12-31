/* eslint-disable import/first */
require('module-alias/register')

// Modules
import * as dotenv from 'dotenv'
import Bot from './services/Bot'

// Config
dotenv.config()

// Bot Object
const bot = new Bot()
