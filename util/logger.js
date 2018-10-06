const chalk = require('chalk')
const dateFormat = require('dateformat')

module.exports = {
	format: 'hh:MM:ss TT',
	get time () {
		return dateFormat(new Date(), this.format)
	},
	_log (title, style, text, bg = 'bgBlack') {
		let width = process.stdout.columns || 120
		let lines = text.split('\n')
		let header = lines.shift()
		let spacingSize = width - title.length - this.time.length - header.replace(/\x1b\[\d+m/g, '').length - 7
		console.log([
			chalk[style].black(` ${title.toUpperCase()} `),
			chalk[style.slice(2).toLowerCase()][bg]('\uE0B0 '),
			chalk[bg](header),
			chalk[bg](' '.repeat(spacingSize < 0 ? 0 : spacingSize)),
			bg === 'bgBlackBright' ? chalk[bg](' ') : chalk.grey[bg]('\uE0B2'),
			chalk.bgBlackBright(` ${this.time} `),
		].join(''))
	},
	warn (title, desc) {
		this._log(title, 'bgYellow', desc)
	},
	error (title, error) {
		this._log(title, 'bgRed', error.stack || error.message || error)
	},
	log (title, desc) {
		this._log(title, 'bgGreen', desc)
	},
	cmd (cmd, user) {
		// this._log('CMD', 'bgGreen', [
		// 	'',
		// ].join(''), chalk.bgBlackBright)
		// {cyan.bold ${user.username}}`
		// 	+ chalk` <{green.bold ${user.id}}>: {cyan.bold ${cmd.toLowerCase()}}`)
	}
}
