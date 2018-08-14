let e = module.exports = {}

const fs = require('fs')
const path = require('path')
const webshot = require('webshot')
const pug = require('pug')
const sass = require('sass')

e.init = function (Bot) {
  Bot.createImage = function (name, ctx = {}, options = {}) {
    Object.assign(ctx, { Bot })
    let f = path.join(__dirname, `../services/images/${name}`)
    let html = pug.renderFile(`${f}.pug`, ctx)
    let css = ''
    if (fs.existsSync(`${f}.scss`))
      css = sass.renderSync({ file: `${f}.scss` }).css.toString()
    Object.assign(options, {
      siteType: 'html',
      customCSS: css,
      phantomPath: path.join(__dirname, '../services/phantomjs.exe') // windows 2.5.0-beta
    })
    let img = path.join(__dirname, '../tmp.png')
    return new Promise((resolve, reject) => {
      webshot(html, img, options, function (err) {
        if (err)
          return reject(err)
        let image = fs.readFileSync(img)
        fs.unlinkSync(img)
        resolve(image)
      })
    })
  }
}
