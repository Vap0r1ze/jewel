const { queue } = require('async')
const chalk = require('chalk')

exports.dependencies = ['eris', 'db']

exports.init = function () {
  const db = this.getDB('menus')

  this.createMenu = ({ channelId, messageId, emojis, handlerPath }) => {
    const menuInfo = { channelId, messageId, emojis, handlerPath }
    menus[messageId] = menuInfo
    const q = queue((emoji, next) => {
      this.client.addMessageReaction(channelId, messageId, emoji).then(() => {
        next()
      })
    })
    q.push(Object.values(emojis), () => {
      db.set(messageId, menuInfo)
    })
  }

  this.deleteMenu = (messageId, channelId) => {
    delete menus[messageId]
    db.delete(messageId)
    if (channelId)
      this.client.removeMessageReactions(channelId, messageId).catch(() => {})
  }

  const menus = this.menus = {}
  for (const { ID: menuId, data } of db.all()) {
    menuInfo = JSON.parse(data)
    menus[menuId] = menuInfo
  }

  m = Object.keys(menus).length
  this.util.logger.log('MENU', chalk`Loaded {green.bold ${m}} react menu${m===1?'':'s'} from storage`)
}
