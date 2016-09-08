module.exports = {
	main: function(Bot, m, args) {
		Bot.createMessage(m.channel.id, "Here is my source code: https://github.com/Vap0r1ze/Jewel")
	},
	help: "Shows a link to my public GitHub page"
}