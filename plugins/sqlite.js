const Database = require('better-sqlite3')
const sqliteWrapper = require('../services/sqliteWrapper')

exports.dependencies = ['redis']

exports.init = async function () {
  this.sqlite = new Database('data.sqlite')
  let v = await this.cache.getAsync('DB_VERSION') || 0
  this.db = sqliteWrapper(this.sqlite)
  this.util.logger.log('SQLITE', 'Connected to database')
  let { migrations } = this.db
  if (v < migrations.length) {
    let neededMigrations = migrations.slice(v)
    for (let i = 0; i < neededMigrations.length; i++) {
      neededMigrations[i]()
      await this.cache.incrAsync('DB_VERSION')
      this.util.logger.log('SQLITE', `Performed migration #${v + i + 1}`)
    }
  }
}
