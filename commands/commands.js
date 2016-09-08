const fs = require("fs");

module.exports = {
	main: function(Bot, m, args) {
		function format(file, help) {
			var line = "`j!"+file.replace(".js", "")+"` "+help+".";
			return line;
		}
		var files = fs.readdirSync("./commands/");
		var lines = [];
		files.forEach(function(file) {
			var cmd = require("./"+file)
			lines.push(format(file, cmd.help));
		});
		var message = lines.join("\n");
		Bot.createMessage(m.channel.id, "Check your messages :mailbox_with_mail:");
		Bot.getDMChannel(m.author.id).then(function(DMchannel) {
			Bot.createMessage(DMchannel.id, message);
		});
	},
	help: "Gives a list of commands"
}