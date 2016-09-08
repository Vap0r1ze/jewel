const fs = require("fs");

module.exports = {
	main: function(Bot, m, args) {
		if (args != "") {
			var commands = fs.readdirSync("./commands/");
			if (commands.indexOf(args+".js") > -1) {
				var cmd = require("./"+args+".js");
				Bot.createMessage(m.channel.id, cmd.help);
			} else {
				Bot.createMessage(m.channel.id, "That command doesn't exist.");
			}
		} else {
			Bot.createMessage(m.channel.id, "To show a help for a certain command, say `j!help <command>`.\nif you want a list of commands, say `j!commands`.");
		}
	},
	help: "Displays help for a command"
}