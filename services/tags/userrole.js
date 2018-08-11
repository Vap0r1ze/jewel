let e = module.exports = {}
e.run = async function () {
  var args = []
  for (var arg of this.args) {
    args.push(await this.process(arg, this))
  }
  let i = parseInt(args[0])
  if (isNaN(i)) i = -1
  if (args[1]) {
    if (/\d{17,18}/.test(args[1])) {
      let member = this.msg.channel.guild.members.get(/\d{17,18}/.exec(args[1])[0])
      return member ? (member.roles[i === -1 ? this.msg.member.roles.length - 1 : i] || '') : '`User not found`'
    } else {
      return '`User not found`'
    }
  } else {
    return this.msg.member.roles[i === -1 ? this.msg.member.roles.length - 1 : i] || ''
  }
}
