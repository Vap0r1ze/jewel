let e = module.exports = {}

e.desc = 'Get help with commands'

e.run = async function (msg, args) {
  let cmds = this.util.getFiles('commands')
  msg.channel.createMessage([
    '__**Command List**__',
    ...cmds.map(c => `\`${c.name}\`  ${c.e.desc || '**missing description**'}`)
  ].join('\n'))
}
