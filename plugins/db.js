const db = require('quick.db')

exports.dependencies = []

exports.init = function () {
  this.getDB = function (table) {
    return new db.table(table)
  }
}
