let e = module.exports = {}

const moment = require('moment')
const superagent = require('superagent')
const TagProcessor = require('../services/TagProcessor')

e.aliases = ['tag', 't']
e.desc = 'Save guild-wide memos with functional tags'
e.perms = 'Role'
e.role = 'Tag Creators'

e.run = function (msg, args) {
  let authorID = msg.author.id
  let guildID = msg.channel.guild.id
  if (!args.length) return wrongUsage(msg)
  switch (args[0]) {
    case 'create': {
      args.shift()
      let name = args[0]
      if (typeof name === 'string')
        name = name.replace(/[^a-zA-Z0-9_-]/g, '')
      args.shift()
      new Promise((resolve, reject) => {
        if (msg.attachments.size)
          superagent.get(msg.attachments.array()[0].url).end((err, res) => {
            if (err)
              resolve('')
            else
              resolve(res.text || '')
          })
        else
          resolve(args.join(' '))
      }).then(content => {
        if (!content || !name)
          return wrongUsage(msg)
        if (name.length > 20)
          return msg.channel.send('📔  |  **'+msg.author.username+'**, **tag names must be under 20 characters.**')
        this.db.existsAsync(`tags:${name}:properties:${guildID}`).then(exists => {
          if (exists)
            return msg.channel.send('📔  |  **'+msg.author.username+'**, **this tag already exists.**')
          if (content.length > 128000)
            return msg.channel.send('📔  |  **'+msg.author.username+'**, **you can only have 128,000 or less characters.**')
          this.db.multi()
          .sadd(`tags:${authorID}:owned:${guildID}`, name)
          .zadd(`tags:${guildID}`, 0, name)
          .hset(`tags:${name}:properties:${guildID}`, 'content', content)
          .hset(`tags:${name}:properties:${guildID}`, 'author', authorID)
          .hset(`tags:${name}:properties:${guildID}`, 'createdAt', Date.now())
          .hset(`tags:${name}:properties:${guildID}`, 'lastEdit', Date.now())
          .exec(err => {
            if (err)
              return this.util.logger.err(`Error creating tag: ${err}`)
            msg.channel.send('📔  |  **'+msg.author.username+'**, **tag created.**')
          })
        }).catch(() => {})
      }).catch(() => {})
      break
    }
    case 'edit': {
      args.shift()
      let name = args[0]
      if (typeof name === 'string')
        name = name.replace(/[^a-zA-Z0-9_-]/g, '')
      args.shift()
      new Promise((resolve, reject) => {
        if (msg.attachments.size) {
          superagent.get(msg.attachments.array()[0].url).end((err, res) => {
            if (err)
              resolve('')
            else
              resolve(res.text || '')
          })
        } else {
          resolve(args.join(' '))
        }
      }).then(content => {
        if (!content || !name)
          return wrongUsage(msg)
        this.db.multi()
        .exists(`tags:${name}:properties:${guildID}`)
        .hget(`tags:${name}:properties:${guildID}`, 'author')
        .exec((err, replies) => {
          if (err)
            return this.util.logger.err(`Error getting tag: ${err}`)
          if (!replies[0])
            return msg.channel.send('📔  |  **'+msg.author.username+'**, **this tag does not exist.**')
          if (replies[1] !== authorID)
            return msg.channel.send('📔  |  **'+msg.author.username+'**, **you do not own this tag.**')
          if (content.length > 128000)
            return msg.channel.send('📔  |  **'+msg.author.username+'**, **you can only have 128,000 or less characters.**')
          this.db.multi()
          .hset(`tags:${name}:properties:${guildID}`, 'content', content)
          .hset(`tags:${name}:properties:${guildID}`, 'lastEdit', Date.now())
          .exec(error => {
            if (error) return this.util.logger.err(`Error editing tag: ${error}`)
            msg.channel.send('📔  |  **'+msg.author.username+'**, **tag edited.**')
          })
        })
      }).catch(() => {})
      break
    }
    case 'delete': case 'remove': {
      args.shift()
      let name = args[0]
      if (typeof name === 'string')
        name = name.replace(/[^a-zA-Z0-9_-]/g, '')
      if (!name) {
        return wrongUsage(msg)
      }
      this.db.multi()
      .exists(`tags:${name}:properties:${guildID}`)
      .hget(`tags:${name}:properties:${guildID}`, 'author')
      .srem(`tags:${authorID}:owned:${guildID}`, name)
      .exec((err, replies) => {
        if (err)
          return this.util.logger.err(`Error getting tag: ${err}`)
        if (!replies[0])
          return msg.channel.send('📔  |  **'+msg.author.username+'**, **this tag does not exist.**')
        else if (replies[1] !== authorID)
          return msg.channel.send('📔  |  **'+msg.author.username+'**, **you do not own this tag.**')
        this.db.multi()
        .del(`tags:${name}:properties:${guildID}`)
        .zrem(`tags:${guildID}`, name)
        .exec(error => {
          if (error)
            return this.util.logger.err(`Error getting tag: ${err}`)
          msg.channel.send('📔  |  **'+msg.author.username+'**, **tag deleted.**')
        })
      })
      break
    }
    case 'info': {
      args.shift()
      let name = args[0]
      if (typeof name === 'string')
        name = name.replace(/[^a-zA-Z0-9_-]/g, '')
      if (!name) {
        return wrongUsage(msg)
      }
      this.db.multi()
      .exists(`tags:${name}:properties:${guildID}`)
      .hgetall(`tags:${name}:properties:${guildID}`)
      .zscore(`tags:${guildID}`, name)
      .zrevrank(`tags:${guildID}`, name)
      .exec((err, replies) => {
        if (err)
          return this.util.logger.err(`Error getting tag: ${err}`)
        if (!replies[0])
          return msg.channel.send('📔  |  **'+msg.author.username+'**, **this tag does not exist.**')
        let a = replies[1].author
        let u = replies[2] || 0
        let l = moment(+replies[1].lastEdit).format('MMMM Do, Y')
        let c = moment(+replies[1].createdAt).format('MMMM Do, Y')
        let r = replies[3] + 1
        let user = msg.channel.guild.members.get(a)
        if (!user) a = 'User Left Guild'
        else a = `${user.username}#${user.discriminator}`
        msg.channel.send([
          `📔  |  **${msg.author.username}**, showing info for \`${name}\``,
          `__**Author**__: **${a}**`,
          `__**Uses**__: **${u}**`,
          `__**Last Edited**__: **${l}**`,
          `__**Created**__: **${c}**`,
          `__**Rank**__: **#${r}**`
        ].join('\n'))
      })
      break
    }
    case 'list': {
      args.shift()
      let selectedPage = parseInt(args.find(arg => parseInt(arg) && arg.length < 10)) || 0
      let user = /\d+/.exec(args.find(arg => !(parseInt(arg) && arg.length < 10)))
      if (!user)
        user = [msg.author.id]
      user = msg.channel.guild.members.get(user[0])
      if (selectedPage < 1)
        selectedPage = 1
      if (!user)
        return msg.channel.send('📔  |  **'+msg.author.username+'**, cannot find the specified user.')
      if (user.bot)
        return msg.channel.send('📔  |  **'+msg.author.username+'**, bots cannot own tags.')
      let userID = user.id
      this.db.smembersAsync(`tags:${userID}:owned:${guildID}`).then(ownedTags => {
        if (!ownedTags.length)
          return msg.channel.send(`📔  |  ${
            userID === authorID
            ? 'you do'
            : `${user.user.username} does`
          } not have any tags.`)
        ownedTags = ownedTags.sort()
        let pageLength = 0
        let pages = [[]]
        let page = 0
        for (var ownedTag of ownedTags) {
          if (pageLength < 841) {
            pageLength += ownedTag.length + 2
          } else {
            page++
            pages[page] = []
            pageLength = ownedTag.length + 2
          }
          pages[page].push(ownedTag)
        }
        if (selectedPage > pages.length)
          selectedPage = pages.length
        let list = pages[selectedPage-1]
        let response = `here is a list of all of ${userID === authorID ? 'your' : `${user.username}'s`} tags`
        msg.channel.send(`📔  |  **${msg.author.username}**, **${response}**\n\`\`\`${list.join(', ')}\`\`\`**Page ${selectedPage}/${pages.length}**`)
      }).catch(() => {})
      break
    }
    case 'test': {
      args.shift()
      if (!args.length)
        return wrongUsage(msg)
      let content = args.join(' ')
      let margs = args
      TagProcessor.process(content, {
        db: this.db,
        msg,
        margs,
        tag: 'test',
        process: TagProcessor.process
      }).then(processed => {
        if (processed.length > 1990)
          msg.channel.send('📔  |  **'+msg.author.username+'**, **this tag has produced text too long to display.**')
        else
          msg.channel.send(`📔  |  ${processed}`)
      }).catch(() => {})
      break
    }
    case 'top': case 'top10': {
      this.db.zrevrangeAsync(`tags:${guildID}`, 0, -1, 'WITHSCORES').then(top => {
        if (!top.length)
          return msg.channel.send('📔  |  **'+msg.author.username+'**, NO_TAGS')
        top = top.slice(0, 20)
        let toSend = [
          '📔  |  **Top 10 Tags Used**',
          '\n```ruby',
          '✪ Rank | Tag'
        ]
        for (let i = 0; i < top.length; i += 2) {
          toSend.push(`${i / 2 + 1}      ➤  # ${top[i]}`)
          toSend.push(`        Uses: ${top[i + 1]}`)
        }
        toSend.push('```')
        msg.channel.send(toSend.join('\n'))
      }).catch(() => {})
      break
    }
    case 'raw': {
      args.shift()
      let name = args[0]
      if (typeof name === 'string')
        name = name.replace(/[^a-zA-Z0-9_-]/g, '')
      if (!name) {
        return wrongUsage(msg)
      }
      this.db.multi()
      .exists(`tags:${name}:properties:${guildID}`)
      .hgetall(`tags:${name}:properties:${guildID}`)
      .exec((err, replies) => {
        if (err)
          return this.util.logger.err(`Error checking tag: ${err}`)
        if (!replies[0])
          return msg.channel.send('📔  |  **'+msg.author.username+'**, **this tag does not exist.**')
        let {content} = replies[1]
        let contentMsg = `📔  |  **Showing raw contents**\n\`\`\`\n${content.replace(/```/g, '`\u200b`\u200b`')}\n\`\`\``
        if (contentMsg.length > 2000)
          msg.channel.createMessage(`📔  |  **Showing raw contents**`, {
            name: `${name}.txt`,
            file: new Buffer(content)
          })
        else
          msg.channel.send(contentMsg)
      })
      break
    }
    default: {
      let name = args[0]
      args.shift()
      this.db.multi()
      .exists(`tags:${name}:properties:${guildID}`)
      .hget(`tags:${name}:properties:${guildID}`, 'content')
      .exec((err, replies) => {
        if (!replies[0])
          return msg.channel.send('📔  |  **'+msg.author.username+'**, **this tag does not exist.**')
        let margs = args.map(arg => arg instanceof Object
            ? `<@${msg.channel.guild.members.get(arg.id).nick ? '!' : ''}${arg.id}>`
            : arg)
        TagProcessor.process(replies[1], {
          db: this.db,
          msg,
          margs,
          tag: name,
          process: TagProcessor.process
        }).then(processed => {
          this.db.multi()
          .zincrby(`tags:${guildID}`, 1, name)
          .del(`tags:${msg.id}:exec`)
          .del(`tags:${msg.id}:inject`)
          .exec((err, replies) => {
            if (processed.length < 2000)
              msg.channel.send('\u200b' + processed)
            else
              msg.channel.send('📔  |  **'+msg.author.username+'**, **this tag has produced text too long to display.**')
          })
        }).catch(() => {})
      })
    }
  }
}

function wrongUsage (msg) {
  msg.reply('wrong usage (needs more stuff)')
}
