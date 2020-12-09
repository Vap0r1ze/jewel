module.exports = function (message, { name: emojiName, id: emojiId }, member) {
  if (member.bot) return
  const menuInfo = this.menus[message.id]
  if (menuInfo) {
    for (const [ choiceId, emoji ] of Object.entries(menuInfo.emojis)) {
      if (emoji === (emojiId ? `${emojiName}:${emojiId}` : emojiName)) {
        const handler = this.util.accessObjPath(this, menuInfo.handlerPath, true)
        try {
          handler(choiceId, member.id)
        } catch (error) {
          this.util.logger.error(`MENU:${menuInfo.handlerPath}:${choiceId}`, error)
        }
      }
    }
  }
}
