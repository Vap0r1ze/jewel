let e = module.exports = {}
e.run = async function () {
  var args = []
  for (var arg of this.args) {
    args.push(await this.process(arg, this))
  }
  if (args[0]) {
    if (/\d{17,18}/.test(args[0])) {
      let member = this.msg.channel.guild.members.get(/\d{17,18}/.exec(args[0])[0])
      return member ? member.user.createdAt : '`User not found`'
    } else {
      return '`User not found`'
    }
  } else {
    return this.msg.author.createdAt
  }
}
