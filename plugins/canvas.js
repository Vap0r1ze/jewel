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
CanvasRenderingContext2D.prototype.wrapText = function (t, x, y, w, lh) {
  if (!lh)
    lh = +this.font.match(/(\d+)px/)[1]
  let ls = t.split('\n')
  let f = []
  let ln = 0
  for (let l of ls) {
    let ws = l.split(' ')
    let lwr = 0
    for (let i = 0; i < ws.length; i++) {
      let wr = ws[i]
      let lw = this.measureText(ws.slice(lwr, i + 1)).width
      if (lw > w && i + 1 - lwr > 1) {
        this.fillText(ws.slice(lwr, i).join(' '), x, y + ln * lh)
        lwr = i
        ln++
      }
      if (ws.length - 1 === i) {
        this.fillText(ws.slice(lwr, i + 1).join(' '), x, y + ln * lh)
        ln++
      }
    }
    ln++
  }
  return this
}

const bg = '#1e293a'
const textMuted = '#3a5879'

const peach = '#ffaa77'
const magenta = '#f600b3'
const salmon = '#fd7567'
const turquoise = '#00d3d7'
const springgreen = '#00feb9'

e.init = function (Bot) {
  registerFont(path.join(__dirname, '../fonts/Lato-Regular.ttf'), {
    family: 'Lato',
    weight: 400
  })
  registerFont(path.join(__dirname, '../fonts/Lato-Black.ttf'), {
    family: 'Lato',
    weight: 900
  })

  Bot.canvas = {
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
    },
    async profileCard (user) {
      let canvas = createCanvas(550, 400)
      let ctx = canvas.getContext('2d')

      // Global Clip
      ctx.roundRect(0, 0, 550, 400, 10)
      ctx.clip()

      // Background
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, 550, 400)

      // Avatar
      let avatar = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=1024`
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(250, 0)
      ctx.lineTo(250, 400)
      ctx.lineTo(0, 400)
      ctx.closePath()
      ctx.save()
      ctx.clip()
      ctx.drawImage(await this.getImage(avatar), -47.5, 0, 345, 345)
      ctx.restore()

      // Username
      let usernameGrad = ctx.createLinearGradient(0, 30, 0, 50)
      usernameGrad.addColorStop(0, magenta)
      usernameGrad.addColorStop(1, salmon)
      ctx.fillStyle = usernameGrad
      ctx.font = '800 30px Lato'
      ctx.textBaseline = 'hanging'
      ctx.fillText(user.username, 270, 30)

      // Role
      ctx.fillStyle = textMuted
      ctx.font = '500 15px Lato'
      ctx.textBaseline = 'hanging'
      ctx.fillText(user.role, 270, 65)

      // Bio
      let bioGrad = ctx.createLinearGradient(0, 90, 0, 120)
      bioGrad.addColorStop(0, turquoise)
      bioGrad.addColorStop(1, springgreen)
      ctx.fillStyle = bioGrad
      ctx.font = '500 25px Lato'
      ctx.textBaseline = 'hanging'
      ctx.fillText('Bio', 270, 90)
      ctx.fillStyle = textMuted
      ctx.font = '500 15px Lato'
      ctx.textBaseline = 'hanging'
      ctx.wrapText(user.bio, 270, 120, 260)

      // Footer
      let footerGrad = ctx.createLinearGradient(0, 290, 0, 400)
      footerGrad.addColorStop(0, peach)
      footerGrad.addColorStop(1, magenta)
      ctx.fillStyle = footerGrad
      ctx.beginPath()
      ctx.moveTo(0, 290)
      ctx.lineTo(0, 400)
      ctx.lineTo(545, 400)
      ctx.closePath()
      ctx.fill()

      return canvas.toBuffer()
    }
  }
}
