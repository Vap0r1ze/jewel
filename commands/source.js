const fs = require("fs");

module.exports = {
	main: function(Bot, m, args) {
		if (args != "") {
			var commands = fs.readdirSync("./commands/");
			if (commands.indexOf(args+".js") > -1) {
				Bot.createMessage(m.channel.id, "Here is the source for the command **"+args+"** https://github.com/Vap0r1ze/Jewel/tree/master/commands/"+args+".js");
			} else {
				Bot.createMessage(m.channel.id, "That command doesn't exist.");
			}
		} else {
			Bot.createMessage(m.channel.id, "Here is my source code: https://github.com/Vap0r1ze/Jewel")
		}
	},
	help: "Shows a link to the source of a certain command"
}