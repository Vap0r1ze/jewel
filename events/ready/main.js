const colors = require("colors");

module.exports = {
	main: function(Bot, m, config) {
		var i = 0;
		Bot.guilds.map(g=>g.channels.size).forEach(c=>{i+=c;});
		console.log('');
		console.log("BOT".bgMagenta.black+" Logged in as "+`${Bot.user.username}#${Bot.user.discriminator}`.cyan.bold);
		console.log('');
		console.log("INF".bgBlue.black+" Currently seeing: "+`${Bot.guilds.size}`.green.bold+" guilds");
		console.log("INF".bgBlue.black+" Currently seeing: "+`${i}`.green.bold+" channels");
		console.log("INF".bgBlue.black+" Currently seeing: "+`${Bot.users.size}`.green.bold+" users");
		console.log('');
		Bot.voiceConnections.forEach(function(connection) {
			connection.disconnect();
		});
	}
}
