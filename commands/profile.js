let e = module.exports = {}

e.desc = 'View your profile'

e.run = async function (msg, args) {
  let user = msg.author
  let userProfile = await this.db.hgetallAsync(`profile:${user.id}`) || {}
  let userData = {
    id: user.id,
    avatar: user.avatar,
    username: user.username,
    role: userProfile.role || 'User',
    bio: userProfile.bio || `No bio found. Add one with ${process.env.PREFIX}bio [bio]`
  }
  let card = await this.canvas.profileCard(userData)
  msg.channel.createMessage(`Profile for **${user.username}**`, {
    file: card,
    name: 'profile.png'
  })
}
