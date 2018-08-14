let e = module.exports = {}

e.desc = 'Server info card'

e.run = async function (msg, args) {
  let profile = await this.createImage('server', { msg }, {
    windowSize: { width: 500, height: 500 }
  })
  msg.channel.send(`Profile for **${msg.author.username}**`, {
    files: [ profile ]
  })
}
