const yt = require("ytdl-core");
const fs = require("fs");
module.exports = {
	main: function(Bot, m, args) {
		var music = JSON.parse(fs.readFileSync("data.json")).music;
		var code = args.replace(/<?(https?:\/\/)?(www\.)?(youtu(be\.com\/|.be\/))?(watch\?v=)?([^>]*)>?/, "$6");
		if (m.member.voiceState.channelID) { // User is in Voice Channel
			var BotVoiceState = m.channel.guild.members.get(Bot.user.id).voiceState;
			if (BotVoiceState.channelID) { // Bot is in Voice Channel
			var voiceConnection = Bot.voiceConnections.get(m.channel.guild.id);
				if (BotVoiceState.channelID == m.member.voiceState.channelID) { // User is in same Voice Channel
					if (voiceConnection.playing) {
						Bot.createMessage(m.channel.id, "Queue feature coming soon >.>");
					} else {
						var song = yt("https://www.youtube.com/watch?v="+code, {audioonly: true});
						voiceConnection.playResource(song, {inlineVolume: true});
						yt.getInfo("https://www.youtube.com/watch?v="+code, function(error, info) {
							Bot.createMessage(m.channel.id, "Now playing: `"+info.title+"` requested by **"+m.author.username+"#"+m.author.discriminator+"**");
						});
					}
				} else { // User is in different Voice Channel
					Bot.createMessage(m.channel.id, "You must be in the same Voice Channel as me to play a song");
				}
				voiceConnection.on("end", function() {
					Bot.createMessage(m.channel.id, "Song finished playing");
				});
			} else { // Bot isn't in Voice Channel
				Bot.joinVoiceChannel(m.member.voiceState.channelID);
				// ADD PLAY SONG FEATURE HERE
			}
		} else { // User isn't in Voice Channel
			Bot.createMessage(m.channel.id, "You must be in a Voice Channel to play a song");
		}
	},
	help: "Plays a song from the specified YouTube link"
}