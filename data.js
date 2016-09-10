const fs = require("fs");

module.exports = {
	load: function() {
		return JSON.parse(fs.readFileSync("./data.json"));
	},
	save: function(data) {
		fs.writeFileSync("./data.json", JSON.stringify(data, null, "\t"));
	}
}