module.exports = {
	main: function(Bot, m, args) {
		Bot.createMessage(m.channel.id, "https://discordapp.com/oauth2/authorize?&client_id=222255735541596161&scope=bot")
	},
	help: "Invite me to your servers"
}