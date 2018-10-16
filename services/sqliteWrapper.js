const defaults = {
  guild: {
    id: null,
    prefix: process.env.PREFIX
  }
}

module.exports = function sqliteWrapper (sqlite) {
  let db = {
    migrations: [
      () => {
        sqlite.prepare('CREATE TABLE `guilds` (`id` TEXT, `prefix` TEXT, PRIMARY KEY (`id`))').run()
      }
    ],
    guilds: {
      get (guildID) {
        return Object.assign(defaults.guild, sqlite.prepare('SELECT * FROM `guilds` WHERE `id` = ?').get(guildID))
      }
    }
  }
  return db
}
