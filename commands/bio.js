let e = module.exports = {}

e.desc = 'View/set your bio'

e.run = async function (msg, args) {
  if (args.length) {
    await this.db.hsetAsync(`profile:${msg.author.id}`, 'bio', args.join(' '))
    msg.channel.createMessage('**New bio set**')
  } else {
    let currentBio = await this.db.hgetAsync(`profile:${msg.author.id}`, 'bio')
    if (!currentBio)
      msg.channel.createMessage(`**No bio found.** Add one with \`${process.env.PREFIX}bio [bio]\``)
    else
      msg.channel.createMessage(`**__Your current bio__**\n${currentBio}`)
  }
}
