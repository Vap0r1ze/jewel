var bot = require("eris");
var config = require("./config.json");
var Bot = bot(config.tokens.jewel);
var fs = require("fs");
var reload = require("require-reload")(require);

var prefix = "j!";

Bot.on("messageCreate", (m)=>{
	if (m.author.bot) return;
	var commands = fs.readdirSync("./commands/");
	if (m.content.startsWith(prefix)) {
		var command = m.content.split(" ")[0].replace(prefix, "");
		if (commands.indexOf(command+".js") > -1) {
			var cmd = reload("./commands/"+command+".js");
			var args = m.content.split(" ");
			args.splice(0, 1);
			args = args.join(" ");
			try {
				cmd.main(Bot, m, args);
			} catch (err) {
				console.log(err);
				Bot.createMessage(m.channel.id, "An error has occured.");
			}
		}
	}
	try {
		reload("./bot_info.js")(Bot, m, config);
	} catch (err) {
		console.log(err);
	}
});

Bot.on("ready", function() {
	console.log("Ready!");
});

Bot.connect();