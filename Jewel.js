var bot = require("eris");
var fs = require("fs");
var config = require("./etc/config.json");
var Bot = bot(config.tokens.jewel);
var reload = require("require-reload")(require);
var _ = require("./data.js");
var events = fs.readdirSync("./events/");
var colors = require("colors");

var prefix = config.prefix;

Bot.on("messageCreate", (m)=>{
	if (m.author.bot) return;
	if (m.channel.isPrivate) return;
	
	var loguser = `${m.author.username}#${m.author.discriminator}`.magenta.bold;
	var logserver = `${m.channel.guild.name}`.cyan.bold;
	var logchannel = `#${m.channel.name}`.green.bold;
	var logdivs = [" > ".blue.bold, " - ".blue.bold];
	
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
			var logcmd = `${prefix}${command}`.bold;
			var logargs = `${args}`.bold;
			try {
				cmd.main(Bot, m, args);
				console.log("CMD".black.bgGreen+" "+loguser+logdivs[1]+logserver+logdivs[0]+logchannel+" "+logcmd.blue);
				if (args) console.log("ARG".black.bgCyan+" "+logargs.blue.bold);
				console.log('');
			} catch (err) {
				console.log(err);
				Bot.createMessage(m.channel.id, "An error has occured.");
				console.log("CMD".black.bgRed+" "+loguser+logdivs[1]+logserver+logdivs[0]+logchannel+" "+logcmd.red);
				if (args) console.log("ARG".black.bgCyan+" "+logargs.red.bold);
				console.log('');
			}
		}
	}
});


events.forEach(function(event) {
	Bot.on(event, function(m) {
		var eventjs = reload("./events/"+event+"/main.js");
		try {
			eventjs.main(Bot, m, config);
		} catch (err) {
			console.log(err);
		}
	});
});

Bot.connect();