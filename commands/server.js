let e = module.exports = {}

e.desc = 'Server info card'

e.run = async function (msg, args) {
  let serverCard = await this.createImage('server', { msg }, {
    windowSize: { width: 500, height: 500 }
  })
  msg.channel.createMessage(`Profile for **${msg.author.username}**`, {
    file: serverCard,
    name: 'server.png'
  })
}
