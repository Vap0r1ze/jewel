let e = module.exports = {}
e.run = async function () {
  return this.msg.channel.guild.members.random().id
}
