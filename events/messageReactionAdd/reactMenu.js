module.exports = function (message, { name: emojiName, id: emojiId }, member) {
  if (member.bot) return
  const menuInfo = this.menus[message.id]
  if (menuInfo) {
    const [ id ] = [...Object.entries(menuInfo.emojis)].find(e => e[1] === `${emojiName}:${emojiId}`) || []
    if (id) {
      const handler = this.util.accessObjPath(this, menuInfo.handlerPath, true)
      try {
        handler(id, member.id)
      } catch (error) {
        this.util.logger.error(`MENU:${menuInfo.handlerPath}:${id}`, error)
      }
    }
  }
}
