module.exports = {
	main: function(Bot, m, args) {
		var msg = m.cleanContent.replace("j!say ", "");
		Bot.createMessage(m.channel.id, msg);
	},
	help: "Makes me say something"
}
