const fs = require('fs')
const pathjs = require('path')
const yaml = require('node-yaml')

module.exports = function (path) {
	let fileNames = fs.readdirSync(path).filter(file => file.endsWith('.yml') && file.length > 4)
	return fileNames.map(file => {
		let content = fs.readFileSync(`./${pathjs.join(path, file)}`)
			.toString()
			.replace(/\t/g, '  ')
			.replace(/\n\r/, '\n')
		return {
			name: file.slice(0, -4),
			d: yaml.parse(content)
		}
	})
}