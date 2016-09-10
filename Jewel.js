var bot = require("eris");
var config = require("./config.json");
var Bot = bot(config.tokens.jewel);
var fs = require("fs");
var reload = require("require-reload")(require);
var _ = require("./data.js");

var prefix = config.prefix;

Bot.on("messageCreate", (m)=>{
	if (m.author.bot) return;
	if (m.channel.isPrivate) return;
	
	var data = _.load();
	if (!(data[m.author.id])) {
		data[m.author.id] = {};
	}
	_.save(data);
	
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
	Bot.voiceConnections.forEach(function(connection) {
		connection.disconnect();
	});
});

Bot.connect();
