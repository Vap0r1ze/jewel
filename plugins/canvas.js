let e = module.exports = {}

const path = require('path')
const { createCanvas, Image, registerFont, CanvasRenderingContext2D } = require('canvas')

CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
  if (w < 2 * r) r = w / 2
  if (h < 2 * r) r = h / 2
  this.beginPath()
  this.moveTo(x + r, y)
  this.arcTo(x + w, y, x + w, y + h, r)
  this.arcTo(x + w, y + h, x, y + h, r)
  this.arcTo(x, y + h, x, y, r)
  this.arcTo(x, y, x + w, y, r)
  this.closePath()
  return this
}
CanvasRenderingContext2D.prototype.wrapText = function (text, x, y, width, lineHeight, maxLines) {
  if (!lineHeight)
    lineHeight = +this.font.match(/(\d+)px/)[1]
  let ls = text.split('\n')
  let ln = 0
  for (let l of ls) {
    let ws = l.split(' ')
    let lwr = 0
    for (let i = 0; i < ws.length; i++) {
      if (ln >= maxLines) return
      let lw = this.measureText(ws.slice(lwr, i + 1)).width
      if (lw > width && i + 1 - lwr > 1) {
        this.fillText(ws.slice(lwr, i).join(' '), x, y + ln * lineHeight)
        lwr = i
        ln++
      }
      if (ws.length - 1 === i) {
        this.fillText(ws.slice(lwr, i + 1).join(' '), x, y + ln * lineHeight)
        ln++
      }
    }
    ln++
  }
  return this
}

e.init = function () {
  registerFont(path.join(__dirname, '../fonts/Lato-Regular.ttf'), {
    family: 'Lato',
    weight: 400
  })
  registerFont(path.join(__dirname, '../fonts/Lato-Black.ttf'), {
    family: 'Lato',
    weight: 900
  })

  this.canvas = {
    async getImage (url, timeout = 5000) {
      return new Promise((resolve, reject) => {
        let img = new Image()
        let t = setTimeout(() => {
          img.onload = null
          reject(new Error('Request timed out'))
        }, timeout)
        img.onload = () => {
          clearTimeout(t)
          resolve(img)
        }
        img.src = url
      })
    }
  }
}
