const fs = require('fs')
var tags = fs.readdirSync('./services/tags')
  .filter(f => f !== 'index.js')
  .map(f => f.replace(/\.js$/, ''))

module.exports = {}

for (var tag of tags) {
  module.exports[tag] = require(`./${tag}.js`)
}
