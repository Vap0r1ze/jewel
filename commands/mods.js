module.exports = {
	main: function(Bot, m, args) {
		var members = m.channel.guild.members;
		var mods = [];
		members.forEach(function(member){
			if (member.roles.indexOf("113379036524212224") > -1 && !(member.user.bot) && member.status == "online") {
				mods.push(member.user.username);
			}
		});
		if (mods.length > 1) {
			mods[mods.length-1] = "and "+ mods[mods.length-1];
		}
		mods = mods.join(", ");
		var msg = "Mods currently Online:\n"+mods;
		Bot.createMessage(m.channel.id, msg.replace(/\ud83d/g, "\\\ud83d"));
	},
	help: "Displays all mods currently online (Discord Bots only)"
}