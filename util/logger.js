const chalk = require('chalk')
const dateFormat = require('dateformat')

module.exports = {
	format: '[hh:MM:ss TT]',
	get time () {
		return dateFormat(new Date(), this.format)
	},
	warn (title, desc) {
		console.log(chalk`${this.time} {bgYellow.white.bold  ${title.toUpperCase()} } ${desc}`)
	},
	error (title, error) {
		console.log(chalk`${this.time} {bgRed.white.bold  ${title.toUpperCase()} } ${error.stack || error.message || error}`)
	},
	log (title, desc) {
		console.log(chalk`${this.time} {bgGreen.white.bold  ${title.toUpperCase()} } ${desc}`)
	},
	cmd (cmd, user) {
		console.log(chalk`${this.time} {bgGreen.white.bold  CMD } {cyan.bold ${user.username}}`
			+ chalk` <{green.bold ${user.id}}>: {cyan.bold ${cmd.toLowerCase()}}`)
	}
}
